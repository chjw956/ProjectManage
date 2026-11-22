import { HttpResponse, http } from 'msw'
import { openIssuesFixture } from '../fixtures/issues'

export const issueHandlers = [
  http.get('/api/v1/projects/:projectId/issues', ({ params }) => {
    return HttpResponse.json(params.projectId === '1' ? openIssuesFixture : [])
  }),
]
