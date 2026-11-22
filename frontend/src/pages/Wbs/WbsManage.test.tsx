import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { HttpResponse, http } from 'msw'
import { server } from '@/test/setup'
import { ganttFixture } from '@/test/fixtures/gantt'
import { WbsPage } from './index'

/** WBS 화면의 일정 관리(공정·Task·마일스톤 추가·수정·삭제) 테스트 */

function renderWbs(search = '') {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={[`/projects/1/wbs${search}`]}>
        <Routes>
          <Route path="/projects/:projectId/wbs" element={<WbsPage />} />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>,
  )
}

type Captured = { params: Record<string, unknown>; body: Record<string, unknown> | null }

/** 요청 본문을 기록하고, 기본 핸들러로 넘긴다. */
function capture(method: 'post' | 'put' | 'delete', path: string) {
  const calls: Captured[] = []
  server.use(
    http[method](path, async ({ request, params }) => {
      const text = await request.clone().text()
      calls.push({ params, body: text ? JSON.parse(text) : null })
      return undefined // passthrough → 기본 핸들러 응답
    }),
  )
  return calls
}

/** 간트 재조회 횟수 */
function countGanttFetches() {
  const counter = { n: 0 }
  server.use(
    http.get('/api/v1/projects/:projectId/gantt', () => {
      counter.n += 1
      return HttpResponse.json(ganttFixture)
    }),
  )
  return counter
}

const dialog = () => screen.getByRole('dialog')

describe('WBS 일정 관리', () => {
  // ---------------------------------------------------------------- 공정 추가

  it('"+ 공정" → 기간 역순이면 오류, 바로잡으면 POST 후 창이 닫히고 간트를 다시 불러온다', async () => {
    const calls = capture('post', '/api/v1/projects/:projectId/tasks/processes')
    const gantt = countGanttFetches()
    const user = userEvent.setup()
    renderWbs()
    await user.click(await screen.findByRole('button', { name: '+ 공정' }))

    await user.type(within(dialog()).getByLabelText(/공정명/), '가상 신규 공정')
    await user.type(within(dialog()).getByLabelText('계획 시작일'), '2027-03-10')
    await user.type(within(dialog()).getByLabelText('계획 종료일'), '2027-03-01')
    await user.click(screen.getByRole('button', { name: '추가' }))
    expect(await screen.findByText('종료일은 시작일 이후여야 합니다')).toBeInTheDocument()
    expect(calls).toHaveLength(0)

    await user.clear(within(dialog()).getByLabelText('계획 종료일'))
    await user.type(within(dialog()).getByLabelText('계획 종료일'), '2027-04-30')
    const before = gantt.n
    await user.click(screen.getByRole('button', { name: '추가' }))

    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument())
    expect(calls[0].body).toMatchObject({
      name: '가상 신규 공정', plannedStart: '2027-03-10', plannedEnd: '2027-04-30',
    })
    await waitFor(() => expect(gantt.n).toBeGreaterThan(before))
  })

  // ---------------------------------------------------------------- 세부 Task 추가

  it('공정 행의 "+ 작업" → 해당 공정 하위로 POST /tasks/{공정ID}/subtasks', async () => {
    const calls = capture('post', '/api/v1/projects/:projectId/tasks/:parentId/subtasks')
    const user = userEvent.setup()
    renderWbs()
    await user.click(await screen.findByRole('button', { name: '계약 협상에 작업 추가' }))

    expect(within(dialog()).getByText('공정 · 계약 협상')).toBeInTheDocument()
    await user.type(within(dialog()).getByLabelText(/Task명/), '가상 계약서 검토')
    await user.type(within(dialog()).getByLabelText('담당자'), '담당자C')
    await user.click(screen.getByRole('button', { name: '추가' }))

    await waitFor(() => expect(calls).toHaveLength(1))
    expect(calls[0].params.parentId).toBe('20')
    expect(calls[0].body).toMatchObject({ name: '가상 계약서 검토', assignee: '담당자C' })
  })

  // ---------------------------------------------------------------- 정보 수정

  it('Task 정보 수정: 이름만 바꾸면 사유 없이 PUT, 요청에 reason 없음', async () => {
    const calls = capture('put', '/api/v1/projects/:projectId/tasks/:taskId')
    const user = userEvent.setup()
    renderWbs()
    await user.click(await screen.findByRole('button', { name: '초안 검토' }))
    await user.click(screen.getByRole('button', { name: '정보 수정' }))

    const name = within(dialog()).getByLabelText(/Task명/)
    await user.clear(name)
    await user.type(name, '초안 법무 검토')
    expect(within(dialog()).queryByLabelText(/변경 사유/)).not.toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: '저장' }))

    await waitFor(() => expect(calls).toHaveLength(1))
    expect(calls[0].params.taskId).toBe('201')
    expect(calls[0].body).toMatchObject({ name: '초안 법무 검토', assignee: '이영희' })
    expect(calls[0].body).not.toHaveProperty('reason')
  })

  it('Task 정보 수정: 담당자를 바꾸면 변경 전→후와 사유 입력란이 나오고, 사유 없이는 저장되지 않는다', async () => {
    const calls = capture('put', '/api/v1/projects/:projectId/tasks/:taskId')
    const user = userEvent.setup()
    renderWbs()
    await user.click(await screen.findByRole('button', { name: '초안 검토' }))
    await user.click(screen.getByRole('button', { name: '정보 수정' }))

    const assignee = within(dialog()).getByLabelText('담당자')
    await user.clear(assignee)
    await user.type(assignee, '담당자D')
    expect(within(dialog()).getByText(/담당자 변경:/)).toHaveTextContent('이영희 → 담당자D')

    await user.click(screen.getByRole('button', { name: '저장' }))
    expect(await screen.findByText('담당자를 바꾸려면 변경 사유를 입력하세요')).toBeInTheDocument()
    expect(calls).toHaveLength(0)

    await user.type(within(dialog()).getByLabelText(/변경 사유/), '업무 재배치')
    await user.click(screen.getByRole('button', { name: '저장' }))
    await waitFor(() => expect(calls).toHaveLength(1))
    expect(calls[0].body).toMatchObject({ assignee: '담당자D', reason: '업무 재배치' })
  })

  // ---------------------------------------------------------------- 삭제

  it('Task 삭제: 사유 없이는 삭제하지 않고, 사유 입력 시 DELETE 본문에 사유를 보낸다', async () => {
    const calls = capture('delete', '/api/v1/projects/:projectId/tasks/:taskId')
    const user = userEvent.setup()
    renderWbs()
    await user.click(await screen.findByRole('button', { name: '대외기관 사전 협의' }))
    await user.click(screen.getByRole('button', { name: '삭제' }))

    expect(screen.getByRole('dialog', { name: '세부 Task 삭제' })).toBeInTheDocument()
    expect(within(dialog()).getByText('대외기관 사전 협의')).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: '삭제' }))
    expect(await screen.findByText('삭제 사유를 입력하세요')).toBeInTheDocument()
    expect(calls).toHaveLength(0)

    await user.type(within(dialog()).getByLabelText(/삭제 사유/), '중복 등록')
    await user.click(screen.getByRole('button', { name: '삭제' }))
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument())
    expect(calls[0].params.taskId).toBe('102')
    expect(calls[0].body).toEqual({ reason: '중복 등록' })
  })

  it('공정 삭제: 검색 필터 중에도 전체 하위 Task 수(3건)로 경고한다', async () => {
    const user = userEvent.setup()
    renderWbs('?q=서류')  // 수출 승인 신청 공정의 Task 3건 중 1건만 표시됨
    await user.click(await screen.findByRole('button', { name: '수출 승인 신청' }))
    expect(within(dialog()).getByText('3건')).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: '삭제' }))
    expect(screen.getByRole('dialog', { name: '공정 삭제' })).toBeInTheDocument()
    expect(screen.getByText('하위 세부 Task 3건도 함께 삭제됩니다.')).toBeInTheDocument()
  })

  it('삭제 실패(서버 오류) 시 서버 메시지를 표시하고 창을 유지한다', async () => {
    server.use(
      http.delete('/api/v1/projects/:projectId/tasks/:taskId', () =>
        HttpResponse.json({ detail: '삭제 권한이 없습니다.' }, { status: 403 }),
      ),
    )
    const user = userEvent.setup()
    renderWbs()
    await user.click(await screen.findByRole('button', { name: '초안 검토' }))
    await user.click(screen.getByRole('button', { name: '삭제' }))
    await user.type(within(dialog()).getByLabelText(/삭제 사유/), '정리')
    await user.click(screen.getByRole('button', { name: '삭제' }))

    expect(await screen.findByRole('alert')).toHaveTextContent('삭제 권한이 없습니다.')
    expect(screen.getByRole('dialog', { name: '세부 Task 삭제' })).toBeInTheDocument()
  })

  // ---------------------------------------------------------------- 일정 변경

  it('일정 변경 창은 변경 전 → 후를 보여주고, 저장 후 간트를 다시 불러온다', async () => {
    const gantt = countGanttFetches()
    const user = userEvent.setup()
    renderWbs()
    await screen.findByText('수출 승인 서류 작성')
    await user.click(screen.getAllByTestId('gantt-bar-area')[0])

    const end = screen.getByLabelText('종료일')
    await user.clear(end)
    await user.type(end, '2026-10-20')
    expect(screen.getByTestId('schedule-diff')).toHaveTextContent('2026.08.03 ~ 2026.10.04→2026.08.03 ~ 2026.10.20')

    const before = gantt.n
    await user.type(screen.getByLabelText(/변경 사유/), '협의 지연')
    await user.click(screen.getByRole('button', { name: '저장' }))
    await waitFor(() => expect(screen.queryByRole('heading', { name: '계획 일정 변경' })).not.toBeInTheDocument())
    await waitFor(() => expect(gantt.n).toBeGreaterThan(before))
  })

  // ---------------------------------------------------------------- 마일스톤

  it('마일스톤 추가: 계획일이 없으면 오류, 입력하면 POST', async () => {
    const calls = capture('post', '/api/v1/projects/:projectId/milestones')
    const user = userEvent.setup()
    renderWbs()
    await user.click(await screen.findByRole('button', { name: '마일스톤 관리' }))
    await user.click(screen.getByRole('button', { name: '+ 마일스톤 추가' }))

    const form = screen.getByRole('form', { name: '마일스톤 추가' })
    await user.type(within(form).getByLabelText(/명칭/), '가상 최종 보고')
    await user.click(within(form).getByRole('button', { name: '추가' }))
    expect(await within(form).findByText('계획일을 입력하세요')).toBeInTheDocument()

    await user.selectOptions(within(form).getByLabelText('유형'), 'REPORT')
    await user.type(within(form).getByLabelText(/계획일/), '2027-06-30')
    await user.click(within(form).getByRole('button', { name: '추가' }))

    await waitFor(() => expect(calls).toHaveLength(1))
    expect(calls[0].body).toEqual({ name: '가상 최종 보고', type: 'REPORT', plannedDate: '2027-06-30' })
  })

  it('마일스톤 수정: 계획일을 바꾸면 사유 필수, 사유와 함께 PUT', async () => {
    const calls = capture('put', '/api/v1/projects/:projectId/milestones/:milestoneId')
    const user = userEvent.setup()
    renderWbs()
    await user.click(await screen.findByRole('button', { name: '마일스톤 관리' }))
    await user.click(screen.getByRole('button', { name: '전문위원회(2차) 수정' }))

    const form = screen.getByRole('form', { name: '마일스톤 수정' })
    const date = within(form).getByLabelText(/계획일/)
    await user.clear(date)
    await user.type(date, '2026-12-14')
    expect(within(form).getByText(/계획일 변경:/)).toHaveTextContent('2026.11.30 → 2026.12.14')

    await user.click(within(form).getByRole('button', { name: '저장' }))
    expect(await within(form).findByText('계획일을 바꾸려면 변경 사유를 입력하세요')).toBeInTheDocument()
    expect(calls).toHaveLength(0)

    await user.type(within(form).getByLabelText(/변경 사유/), '위원회 일정 연기')
    await user.click(within(form).getByRole('button', { name: '저장' }))
    await waitFor(() => expect(calls).toHaveLength(1))
    expect(calls[0].params.milestoneId).toBe('2')
    expect(calls[0].body).toMatchObject({ plannedDate: '2026-12-14', reason: '위원회 일정 연기' })
  })

  it('마일스톤 삭제: 사유와 함께 DELETE', async () => {
    const calls = capture('delete', '/api/v1/projects/:projectId/milestones/:milestoneId')
    const user = userEvent.setup()
    renderWbs()
    await user.click(await screen.findByRole('button', { name: '마일스톤 관리' }))
    await user.click(screen.getByRole('button', { name: '기업결합 심사 삭제' }))

    expect(screen.getByRole('dialog', { name: '마일스톤 삭제' })).toBeInTheDocument()
    await user.type(within(dialog()).getByLabelText(/삭제 사유/), '범위 제외')
    await user.click(screen.getByRole('button', { name: '삭제' }))

    await waitFor(() => expect(calls).toHaveLength(1))
    expect(calls[0].params.milestoneId).toBe('3')
    expect(calls[0].body).toEqual({ reason: '범위 제외' })
  })
})
