import { Collection } from '@freearhey/core'
import { restEndpointMethods } from '@octokit/plugin-rest-endpoint-methods'
import { paginateRest } from '@octokit/plugin-paginate-rest'
import { Octokit } from '@octokit/core'
import { IssueParser } from './'
import { TESTING, OWNER, REPO } from '../constants'

const CustomOctokit = Octokit.plugin(paginateRest, restEndpointMethods)
const octokit = new CustomOctokit()

export class IssueLoader {
  async load(props?: { labels: string[] | string }) {
    let labels = ''
    if (props && props.labels) {
      labels = Array.isArray(props.labels) ? props.labels.join(',') : props.labels
    }

    let issues: object[] = []
    if (TESTING) {
      issues = (await import('../../tests/__data__/input/db/update/issues.js')).default
    } else {
      issues = await octokit.paginate(octokit.rest.issues.listForRepo, {
        owner: OWNER,
        repo: REPO,
        per_page: 100,
        labels,
        headers: {
          'X-GitHub-Api-Version': '2022-11-28'
        }
      })
    }

    const parser = new IssueParser()

    return new Collection(issues).map(parser.parse)
  }
}
