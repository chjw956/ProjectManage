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

  // ---- 공정·Task 추가 / 수정 / 삭제 (백엔드 검증 규칙을 흉내 낸다) ----

  http.post('/api/v1/projects/:projectId/tasks/processes', async ({ request }) => {
    const body = await request.json() as { name: string }
    return HttpResponse.json({ taskId: 900, projectId: 1, name: body.name, progress: 0, status: 'PENDING' }, { status: 201 })
  }),

  http.post('/api/v1/projects/:projectId/tasks/:parentId/subtasks', async ({ request, params }) => {
    const body = await request.json() as { name: string }
    return HttpResponse.json(
      { taskId: 901, projectId: 1, parentId: Number(params.parentId), name: body.name, progress: 0, status: 'PENDING' },
      { status: 201 },
    )
  }),

  http.put('/api/v1/projects/:projectId/tasks/:taskId', async ({ request, params }) => {
    const body = await request.json() as { name?: string; assignee?: string; reason?: string }
    return HttpResponse.json({ taskId: Number(params.taskId), projectId: 1, ...body })
  }),

  http.delete('/api/v1/projects/:projectId/tasks/:taskId', async ({ request }) => {
    const body = await request.json() as { reason?: string }
    if (!body.reason) return HttpResponse.json({ detail: '삭제에는 사유가 필요합니다.' }, { status: 400 })
    return new HttpResponse(null, { status: 204 })
  }),
]
