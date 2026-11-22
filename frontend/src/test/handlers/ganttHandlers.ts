import { HttpResponse, http } from 'msw'
import { ganttFixture } from '../fixtures/gantt'

export const ganttHandlers = [
  http.get('/api/v1/projects/:projectId/gantt', () => {
    return HttpResponse.json(ganttFixture)
  }),

  http.patch('/api/v1/projects/:projectId/tasks/:taskId/schedule', async ({ request }) => {
    const body = await request.json() as { reason?: string }
    if (!body.reason) {
      return HttpResponse.json({ message: 'reason은 필수입니다.' }, { status: 400 })
    }
    return HttpResponse.json({
      taskId: 101,
      projectId: 1,
      parentId: 10,
      name: '수출 승인 서류 작성',
      dept: 'Project-C',
      assignee: '—',
      progress: 100,
      status: 'DONE',
      delayed: false,
      plannedStart: '2026-08-10',
      plannedEnd: '2026-10-10',
      actualStart: '2026-08-03',
      actualEnd: '2026-10-04',
      sortOrder: 0,
      work: false,
      amount: null,
    })
  }),
]
