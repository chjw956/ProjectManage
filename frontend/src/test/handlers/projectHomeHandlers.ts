import { HttpResponse, http } from 'msw'
import { projectHomeFixture } from '../fixtures/projectHome'

export const projectHomeHandlers = [
  http.get('/api/v1/projects/:projectId', () => {
    return HttpResponse.json(projectHomeFixture)
  }),
]
