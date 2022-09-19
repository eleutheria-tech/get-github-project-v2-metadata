import { getInput, debug, info, setOutput, setFailed } from '@actions/core'
import { context } from '@actions/github'
import { getGitHubProjectV2MetaData } from './get-github-project-v2-metadata'

// most @actions toolkit packages have async methods
async function run(): Promise<void> {
  try {
    // [INPUT] gh_token
    const ghToken = getInput('gh_token')
    if (ghToken !== '') {
      info('[GitHub Token GET!]')
      debug(`gh_token: ${ghToken}`)
    } else {
      throw new Error(
        '[GitHub Token NOT SUPPLIED] gh_token must be supplied. It is used to authenticate the query. It could be your Personal Access Token (PAT) (not recommended) with org permission or token generated from your GitHub app with org permission (recommended)'
      )
    }

    // [INPUT] org
    let org = getInput('org')
    if (org !== '') {
      info('[Organization GET!]')
      debug(`org: ${org}`)
    } else {
      org = context.repo.owner
      info(`[Organization NOT SUPPLIED] Defaults to ${org}`)
    }

    // [INPUT] project_number
    const projectNumber = getInput('project_number')
    if (projectNumber !== '') {
      info('[Project Number GET!]')
      debug(`project_number: ${projectNumber}`)
    } else {
      throw new Error(
        '[Project Number NOT SUPPLIED] project_number must be supplied. It is used to identify and query metadata of your GitHub Project'
      )
    }

    // [INPUT] single_select_field_name
    const ssfName = getInput('single_select_field_name')
    if (ssfName !== '') {
      info('[Single Select Field Name GET!]')
      debug(`single_select_field_name: ${ssfName}`)
    } else {
      info(
        '[Single Select Field Name NOT SUPPLIED] It is used to identify the single select field in your GitHub Project.'
      )
    }

    // [INPUT] single_select_field_option_name
    const ssfOptionName = getInput('single_select_field_option_name')
    if (ssfOptionName !== '') {
      // single_select_field_name is needed
      if (ssfName !== '') {
        info('[Single Select Field Option Name GET!]')
        debug(`single_select_option_name: ${ssfOptionName}`)
      } else {
        throw new Error(
          '[Single Select Field Option Name GET FAILED] Cannot get option without single_select_field_name.'
        )
      }
    } else {
      info(
        '[Single Select Field Option Name NOT SUPPLIED] It is used to identify the single select field option in your GitHub Project.'
      )
    }

    const { projectId, ssfId, ssfOptionId } = await getGitHubProjectV2MetaData({
      ghToken,
      org,
      projectNumber: parseInt(projectNumber),
      ssfName,
      ssfOptionName
    })

    // [OUTPUT] project_id
    if (projectId) {
      setOutput('project_id', projectId)
    }

    // [OUTPUT] single_select_field_id
    if (ssfId) {
      setOutput('single_select_field_id', ssfId)
    }

    // [OUTPUT] single_select_field_option_id
    if (ssfOptionId) {
      setOutput('single_select_field_option_id', ssfOptionId)
    }
  } catch (error) {
    if (error instanceof Error) setFailed(error.message)
  }
}

run()
