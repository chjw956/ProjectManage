import { HttpResponse, http } from 'msw'
import { projectsFixture } from '../fixtures/projects'
import type { CreateProjectRequest } from '@/pages/Dashboard/api'

export const projectHandlers = [
  http.get('/api/v1/projects', () => {
    return HttpResponse.json(projectsFixture)
  }),

  http.post('/api/v1/projects', async ({ request }) => {
    const body = await request.json() as CreateProjectRequest
    return HttpResponse.json(
      {
        projectId: 99,
        name: body.name,
        type: body.type,
        phase: body.phase ?? null,
        startDate: body.startDate ?? null,
        endDate: body.endDate ?? null,
        progress: 0,
        openIssueCount: 0,
        statusSignal: { status: 'NORMAL', reasons: [] },
        nextMilestone: null,
      },
      { status: 201 },
    )
  }),
]
