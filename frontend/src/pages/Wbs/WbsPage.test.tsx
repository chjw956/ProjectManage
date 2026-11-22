import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { HttpResponse, http } from 'msw'
import { server } from '@/test/setup'
import { milestonesFixture } from '@/test/fixtures/milestones'
import { WbsPage } from './index'

function renderWbs(search = '') {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  })
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

describe('WbsPage', () => {
  it('마일스톤 칩이 올바른 이름으로 렌더링된다', async () => {
    renderWbs()
    await waitFor(() => {
      expect(screen.getByText(/전문위원회\(1차\)/)).toBeInTheDocument()
      expect(screen.getByText(/전문위원회\(2차\)/)).toBeInTheDocument()
    })
  })

  it('공정 이름이 렌더링된다', async () => {
    renderWbs()
    await waitFor(() => {
      expect(screen.getByText('수출 승인 신청')).toBeInTheDocument()
      expect(screen.getByText('계약 협상')).toBeInTheDocument()
    })
  })

  it('세부 Task 이름이 렌더링된다', async () => {
    renderWbs()
    await waitFor(() => {
      expect(screen.getByText('수출 승인 서류 작성')).toBeInTheDocument()
      expect(screen.getByText('대외기관 사전 협의')).toBeInTheDocument()
    })
  })

  it('공정 행의 접기 버튼을 누르면 세부 Task가 사라진다', async () => {
    const user = userEvent.setup()
    renderWbs()
    await waitFor(() => {
      expect(screen.getByText('수출 승인 서류 작성')).toBeInTheDocument()
    })
    const collapseButtons = screen.getAllByRole('button', { name: '접기' })
    await user.click(collapseButtons[0])
    expect(screen.queryByText('수출 승인 서류 작성')).not.toBeInTheDocument()
  })

  it('접힌 공정을 다시 펼치면 Task가 나타난다', async () => {
    const user = userEvent.setup()
    renderWbs()
    await waitFor(() => {
      expect(screen.getByText('수출 승인 서류 작성')).toBeInTheDocument()
    })
    const collapseBtn = screen.getAllByRole('button', { name: '접기' })[0]
    await user.click(collapseBtn)
    const expandBtn = screen.getAllByRole('button', { name: '펼치기' })[0]
    await user.click(expandBtn)
    expect(screen.getByText('수출 승인 서류 작성')).toBeInTheDocument()
  })

  it('지연 Task에는 "지연" 배지가 표시된다', async () => {
    renderWbs()
    await waitFor(() => {
      expect(screen.getByText('전문위·보호위 심의 대응(1차)')).toBeInTheDocument()
    })
    // 배지 span 중에 "지연" 텍스트를 가진 요소가 하나 이상 있어야 함
    const badges = screen.getAllByText('지연')
    const badge = badges.find((el) => el.tagName === 'SPAN' && el.className.includes('bg-red'))
    expect(badge).toBeInTheDocument()
  })

  it('계획 막대 DOM 요소가 존재한다', async () => {
    renderWbs()
    await waitFor(() => {
      const bars = document.querySelectorAll('[data-testid="planned-bar"]')
      expect(bars.length).toBeGreaterThan(0)
    })
  })

  it('?view=list 쿼리 파라미터이면 목록 모드로 렌더링한다', async () => {
    renderWbs('?view=list')
    await waitFor(() => {
      expect(screen.getByRole('table')).toBeInTheDocument()
    })
  })

  it('목록 모드에서 간트 막대가 없다', async () => {
    renderWbs('?view=list')
    await waitFor(() => {
      expect(screen.getByRole('table')).toBeInTheDocument()
    })
    expect(document.querySelector('[data-testid="planned-bar"]')).toBeNull()
  })

  it('오늘 기준선(빨간 세로선)이 간트 헤더에 존재한다', async () => {
    renderWbs()
    await waitFor(() => {
      expect(document.querySelector('[data-testid="today-line"]')).toBeInTheDocument()
    })
  })

  it('일정 변경 모달 — 사유 없이 저장하면 에러 메시지가 표시된다', async () => {
    const user = userEvent.setup()
    renderWbs()
    await waitFor(() => {
      expect(screen.getByText('수출 승인 서류 작성')).toBeInTheDocument()
    })
    // Task 행 간트 영역 클릭 → 모달 열기
    const ganttAreas = screen.getAllByTestId('gantt-bar-area')
    await user.click(ganttAreas[0])
    // 사유 없이 저장
    const saveBtn = screen.getByRole('button', { name: '저장' })
    await user.click(saveBtn)
    expect(screen.getByText('변경 사유를 입력하세요')).toBeInTheDocument()
  })

  it('일정 변경 모달 — 사유 입력 후 저장하면 PATCH API가 호출된다', async () => {
    const user = userEvent.setup()
    let patchCalled = false
    server.use(
      http.patch('/api/v1/projects/:projectId/tasks/:taskId/schedule', async ({ request }) => {
        patchCalled = true
        const body = await request.json() as { reason?: string }
        if (!body.reason) return HttpResponse.json({}, { status: 400 })
        return HttpResponse.json({
          taskId: 101, projectId: 1, parentId: 10,
          name: '수출 승인 서류 작성', dept: 'Project-C', assignee: '—',
          progress: 100, status: 'DONE', delayed: false,
          plannedStart: '2026-08-10', plannedEnd: '2026-10-10',
          actualStart: '2026-08-03', actualEnd: '2026-10-04',
          sortOrder: 0, work: false, amount: null,
        })
      }),
    )
    renderWbs()
    await waitFor(() => {
      expect(screen.getByText('수출 승인 서류 작성')).toBeInTheDocument()
    })
    const ganttAreas = screen.getAllByTestId('gantt-bar-area')
    await user.click(ganttAreas[0])
    // 사유 입력
    const reasonField = screen.getByRole('textbox', { name: /변경 사유/ })
    await user.type(reasonField, '일정 조정 필요')
    const saveBtn = screen.getByRole('button', { name: '저장' })
    await user.click(saveBtn)
    await waitFor(() => {
      expect(patchCalled).toBe(true)
    })
  })

  it('공정이 없으면 빈 상태와 "첫 공정 추가하기" 버튼을 보여준다', async () => {
    server.use(
      http.get('/api/v1/projects/:projectId/gantt', () =>
        HttpResponse.json({ projectId: 1, progress: 0, processes: [] }),
      ),
      http.get('/api/v1/projects/:projectId/milestones', () =>
        HttpResponse.json([]),
      ),
    )
    renderWbs()
    await waitFor(() => {
      expect(screen.getByText('등록된 공정이 없습니다')).toBeInTheDocument()
      expect(screen.getByRole('button', { name: '첫 공정 추가하기' })).toBeInTheDocument()
    })
  })

  it('API 에러 시 에러 메시지를 표시한다', async () => {
    server.use(
      http.get('/api/v1/projects/:projectId/gantt', () =>
        HttpResponse.json({}, { status: 500 }),
      ),
    )
    renderWbs()
    await waitFor(() => {
      expect(screen.getByText(/WBS 데이터를 불러오지 못했습니다/)).toBeInTheDocument()
    })
  })

  it('건수 표시가 올바르게 나타난다 (전체 Task 건수)', async () => {
    renderWbs()
    await waitFor(() => {
      // ganttFixture has 4 subtasks total (3 + 1) — 필터 없음이면 "4건" 표시
      const countEl = document.querySelector('[data-testid="task-count"]')
      expect(countEl).toBeInTheDocument()
      expect(countEl?.textContent).toMatch(/4건/)
    })
  })

  it('milestoneHandlers 가 반환한 마일스톤 4개가 모두 표시된다', async () => {
    renderWbs()
    await waitFor(() => {
      // 마일스톤 바에 4개 이름이 모두 표시됨
      expect(screen.getByText(/전문위원회\(1차\)/)).toBeInTheDocument()
      expect(screen.getAllByText(/전문위원회\(2차\)/).length).toBeGreaterThan(0)
      expect(screen.getAllByText(/기업결합 심사/).length).toBeGreaterThan(0)
      expect(screen.getByText(/중국법인 설립/)).toBeInTheDocument()
    })
    // milestonesFixture.length 개수만큼 마일스톤 칩 존재 여부 확인
    const milestoneBar = document.querySelector('[data-testid="milestone-bar"]')
    expect(milestoneBar?.querySelectorAll('.rounded-full.inline-flex').length).toBe(
      milestonesFixture.length,
    )
  })

  // ---- 공정·Task 상세 보기 ----

  it('Task 이름을 누르면 상세 창에 소속 공정·기간·담당 정보가 표시된다', async () => {
    const user = userEvent.setup()
    renderWbs()
    await user.click(await screen.findByRole('button', { name: '대외기관 사전 협의' }))

    const dialog = screen.getByRole('dialog', { name: '대외기관 사전 협의' })
    expect(within(dialog).getByText('세부 Task · 수출 승인 신청')).toBeInTheDocument()
    expect(within(dialog).getByText('2026.08.03 ~ 2026.10.04')).toBeInTheDocument()  // 계획
    expect(within(dialog).getByText('2026.08.03 ~ 2026.10.10')).toBeInTheDocument()  // 실제
    expect(within(dialog).getByText('Project-C')).toBeInTheDocument()
    expect(within(dialog).getByText('완료')).toBeInTheDocument()
  })

  it('지연 Task 상세는 상태를 "지연"으로, 실제 종료 전이면 "진행 중"으로 표시한다', async () => {
    const user = userEvent.setup()
    renderWbs()
    await user.click(await screen.findByRole('button', { name: '전문위·보호위 심의 대응(1차)' }))

    const dialog = screen.getByRole('dialog')
    expect(within(dialog).getByText('지연')).toBeInTheDocument()
    expect(within(dialog).getByText('2026.10.14 ~ 진행 중')).toBeInTheDocument()
  })

  it('Task 상세에서 "일정 변경"을 누르면 일정 변경 창으로 전환된다', async () => {
    const user = userEvent.setup()
    renderWbs()
    await user.click(await screen.findByRole('button', { name: '수출 승인 서류 작성' }))
    await user.click(screen.getByRole('button', { name: '일정 변경' }))

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    expect(screen.getByRole('heading', { name: '계획 일정 변경' })).toBeInTheDocument()
    expect(screen.getByLabelText('시작일')).toHaveValue('2026-08-03')
  })

  it('공정 이름을 누르면 공정 상세(하위 Task 수·공사 여부)가 표시되고, 접기 상태는 바뀌지 않는다', async () => {
    const user = userEvent.setup()
    renderWbs()
    await user.click(await screen.findByRole('button', { name: '수출 승인 신청' }))

    const dialog = screen.getByRole('dialog', { name: '수출 승인 신청' })
    expect(within(dialog).getByText('3건')).toBeInTheDocument()
    expect(within(dialog).getByText('비공사')).toBeInTheDocument()
    expect(within(dialog).queryByRole('button', { name: '일정 변경' })).not.toBeInTheDocument()

    await user.click(within(dialog).getByRole('button', { name: '닫기' }))
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    // 공정 이름 클릭은 접기·펼치기와 무관 — 세부 Task가 그대로 보인다
    expect(screen.getByText('수출 승인 서류 작성')).toBeInTheDocument()
  })

  it('막대 영역 클릭은 기존처럼 일정 변경 창을 연다', async () => {
    const user = userEvent.setup()
    renderWbs()
    await screen.findByText('수출 승인 서류 작성')
    await user.click(screen.getAllByTestId('gantt-bar-area')[0])

    expect(screen.getByRole('heading', { name: '계획 일정 변경' })).toBeInTheDocument()
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })

  // ---- 타임라인 폭·겹침 ----

  it('기본 보기는 "기간 축소": 타임라인이 화면 폭에 맞춰지고(고정 폭 없음) 눈금은 월 라벨만 표시', async () => {
    renderWbs()
    await screen.findByText('수출 승인 서류 작성')

    const cells = screen.getAllByTestId('timeline-cell')
    cells.forEach((c) => expect(c.style.width).toBe(''))
    expect(screen.getByRole('button', { name: /주 단위/ })).toBeInTheDocument()

    const header = screen.getByTestId('gantt-header-ticks')
    expect(within(header).getAllByText(/^\d{2}\.\d{2}$/).length).toBeGreaterThan(0)
    expect(within(header).queryByText(/^\d{1,2}\/\d{1,2}$/)).not.toBeInTheDocument()
  })

  it('"주 단위"로 바꾸면 1주 = 44px 고정 폭이 되고 일자 눈금(M/d)이 표시된다', async () => {
    const user = userEvent.setup()
    renderWbs()
    await screen.findByText('수출 승인 서류 작성')
    await user.click(screen.getByRole('button', { name: /주 단위/ }))

    const header = screen.getByTestId('gantt-header-ticks')
    const tickCount = header.children.length
    expect(header.style.width).toBe(`${tickCount * 44}px`)
    screen.getAllByTestId('timeline-cell').forEach((c) => expect(c.style.width).toBe(`${tickCount * 44}px`))
    expect(within(header).getAllByText(/^\d{1,2}\/\d{1,2}$/).length).toBeGreaterThan(0)
  })

  it('기간 축소 보기에서도 오늘 기준선이 % 위치로 표시된다', async () => {
    renderWbs()
    await screen.findByText('수출 승인 서류 작성')
    const line = document.querySelector<HTMLElement>('[data-testid="today-line"]')
    expect(line).not.toBeNull()
    expect(line!.style.left).toMatch(/%$/)
  })

  it('막대 영역은 별도 쌓임 맥락(isolate)이고 왼쪽 고정 칸이 더 위(z-20)에 있다 — 가로 스크롤 시 막대가 표를 덮지 않음', async () => {
    renderWbs('?scale=week')
    await screen.findByText('수출 승인 서류 작성')
    const cell = screen.getAllByTestId('timeline-cell')[0]
    expect(cell).toHaveClass('isolate')
    const stickyLeft = cell.parentElement!.firstElementChild as HTMLElement
    expect(stickyLeft).toHaveClass('sticky', 'left-0', 'z-20')
  })

  it('날짜 헤더는 본문과 같은 스크롤 컨테이너 안에 있어 가로 스크롤을 함께 따라간다', async () => {
    renderWbs('?scale=week')
    await screen.findByText('수출 승인 서류 작성')
    const scroll = screen.getByTestId('gantt-scroll')
    expect(scroll).toContainElement(screen.getByTestId('gantt-header-ticks'))
  })
})
