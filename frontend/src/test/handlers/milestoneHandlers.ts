import { HttpResponse, http } from 'msw'
import { milestonesFixture } from '../fixtures/milestones'

export const milestoneHandlers = [
  http.get('/api/v1/projects/:projectId/milestones', () => {
    return HttpResponse.json(milestonesFixture)
  }),
]
