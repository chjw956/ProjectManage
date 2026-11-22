import { HttpResponse, http } from 'msw'
import { milestonesFixture } from '../fixtures/milestones'

export const milestoneHandlers = [
  http.get('/api/v1/projects/:projectId/milestones', () => {
    return HttpResponse.json(milestonesFixture)
  }),

  http.post('/api/v1/projects/:projectId/milestones', async ({ request }) => {
    const body = await request.json() as { name: string; plannedDate?: string }
    if (!body.plannedDate) return HttpResponse.json({ detail: '마일스톤 계획일을 입력하세요.' }, { status: 400 })
    return HttpResponse.json({ milestoneId: 900, projectId: 1, status: 'TODO', dDay: 0, ...body }, { status: 201 })
  }),

  http.put('/api/v1/projects/:projectId/milestones/:milestoneId', async ({ request, params }) => {
    const body = await request.json() as Record<string, unknown>
    return HttpResponse.json({ milestoneId: Number(params.milestoneId), projectId: 1, dDay: 0, ...body })
  }),

  http.delete('/api/v1/projects/:projectId/milestones/:milestoneId', async ({ request }) => {
    const body = await request.json() as { reason?: string }
    if (!body.reason) return HttpResponse.json({ detail: '마일스톤 삭제에는 사유가 필요합니다.' }, { status: 400 })
    return new HttpResponse(null, { status: 204 })
  }),
]
