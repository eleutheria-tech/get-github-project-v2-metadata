import { debug, info, error } from '@actions/core'
import { getOctokit } from '@actions/github'
import { GraphqlResponseError } from '@octokit/graphql'
import {
  Organization,
  ProjectV2SingleSelectField,
  Query
} from '@octokit/graphql-schema'

type GetGitHubProjectV2MetaDataParams = {
  ghToken: string
  org: string
  projectNumber: number
  ssfName: string
  ssfOptionName: string
}

type GitHubProjectV2MetaData = {
  projectId?: string
  ssfId?: string
  ssfOptionId?: string
}

export const getGitHubProjectV2MetaData = async ({
  ghToken,
  org,
  projectNumber,
  ssfName,
  ssfOptionName
}: GetGitHubProjectV2MetaDataParams): Promise<GitHubProjectV2MetaData> => {
  let metadata: GitHubProjectV2MetaData = {}

  if (typeof projectNumber !== 'number') {
    throw new Error('[Project Number INVALID] projectNumber must be a number')
  }

  const organization = await getGitHubProjectV2Result(
    ghToken,
    org,
    projectNumber
  )

  const projectV2 = organization.projectV2

  if (!projectV2) {
    throw new Error(`[Project NOT FOUND] project_number: ${projectNumber}`)
  }

  const projectId = projectV2.id

  metadata = { ...metadata, projectId }
  info('[Project ID GET!]')
  debug(`projectId: ${projectId}`)

  if (ssfName) {
    // #region find single select field
    const fields = projectV2.fields.nodes

    if (!fields) {
      throw new Error('[Fields NOT FOUND]')
    }

    const ssfs = fields.filter(
      x => x?.__typename === 'ProjectV2SingleSelectField'
    )

    if (!ssfs) {
      throw new Error('[Single Select Fields NOT FOUND]')
    }

    let ssf = ssfs.find(x => x?.name === ssfName)

    if (!ssf) {
      throw new Error(`[Single Select Field NOT FOUND] ssfName: ${ssfName}`)
    }

    ssf = ssf as ProjectV2SingleSelectField

    const ssfId = ssf.id

    metadata = { ...metadata, ssfId }
    info('[Single Select Field ID GET!]')
    debug(`ssfId: ${ssfId}`)
    // #endregion

    // #region find single select field option
    const ssfOptions = ssf.options

    if (ssfOptionName) {
      const ssfOption = ssfOptions.find(x => x.name === ssfOptionName)

      if (!ssfOption) {
        throw new Error(
          `[Single Select Field Option NOT FOUND] ssfOptionName: ${ssfOptionName}`
        )
      }

      const ssfOptionId = ssfOption.id

      metadata = {
        ...metadata,
        ssfOptionId
      }
      info('[Single Select Field Option ID GET!]')
      debug(`ssfOptionId: ${ssfOptionId}`)
    }
    // #endregion
  }

  return metadata
}

const getGitHubProjectV2Result = async (
  ghToken: string,
  org: string,
  projectNumber: number
): Promise<Organization> => {
  const octokit = getOctokit(ghToken)

  const variables = { org, projectNumber }

  const query = `
        query($org: String!, $projectNumber: Int!) {
            __typename
            organization(login: $org){
                __typename
                projectV2(number: $projectNumber) {
                    __typename
                    id
                    fields(first:100) {
                        nodes {
                            __typename
                            ... on ProjectV2SingleSelectField {
                                id
                                name
                                options {
                                    __typename
                                    id
                                    name
                                }
                            }
                        }
                    }
                }
            }
        }
    `

  try {
    const result: Query = await octokit.graphql(query, variables)
    debug(`result: ${JSON.stringify(result)}`)

    const { organization } = result

    if (!organization) {
      throw new Error('[Organization NOT FOUND]')
    }

    return organization
  } catch (err) {
    if (err instanceof GraphqlResponseError) {
      error(JSON.stringify(err.request))
      error(err.message)
      throw new Error('[GraphQL Request FAILED]')
    } else throw err
  }
}
