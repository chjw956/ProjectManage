import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen, waitFor } from '@testing-library/react'
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
    const ganttAreas = document.querySelectorAll('.cursor-pointer')
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
    const ganttAreas = document.querySelectorAll('.cursor-pointer')
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

  it('데이터가 없는 공정은 EmptyState를 보여준다', async () => {
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
      expect(screen.getByText('검색 결과가 없습니다')).toBeInTheDocument()
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
})
