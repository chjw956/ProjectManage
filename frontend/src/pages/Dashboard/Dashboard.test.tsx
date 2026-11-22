import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { HttpResponse, http } from 'msw'
import { server } from '@/test/setup'
import { overdueProjectFixture } from '@/test/fixtures/projects'
import { Dashboard } from './index'

function renderDashboard() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  })
  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter>
        <Dashboard />
      </MemoryRouter>
    </QueryClientProvider>,
  )
}

describe('Dashboard', () => {
  it('로딩 중에는 스켈레톤을 표시한다', () => {
    renderDashboard()
    expect(screen.getByText('포트폴리오 대시보드')).toBeInTheDocument()
    // 스켈레톤 애니메이션 요소가 있어야 함
    const skeletons = document.querySelectorAll('.animate-pulse')
    expect(skeletons.length).toBeGreaterThan(0)
  })

  it('사업 카드 2개 이상을 렌더링한다', async () => {
    renderDashboard()
    await waitFor(() => {
      expect(screen.getByText('스마트 팩토리 구축 사업')).toBeInTheDocument()
      expect(screen.getByText('AI 품질 검사 R&D')).toBeInTheDocument()
    })
  })

  it('사업 유형 라벨(사내/정부)을 표시한다', async () => {
    renderDashboard()
    await waitFor(() => {
      expect(screen.getAllByText('사내').length).toBeGreaterThan(0)
      expect(screen.getByText('정부')).toBeInTheDocument()
    })
  })

  it('D-day 음수를 D-N 형식으로 표시한다 (dDay=-9 → D-9)', async () => {
    renderDashboard()
    await waitFor(() => {
      expect(screen.getByText('D-9')).toBeInTheDocument()
    })
  })

  it('D-day 양수를 D+N 형식으로 표시한다 (dDay=82 → D+82)', async () => {
    server.use(
      http.get('/api/v1/projects', () =>
        HttpResponse.json([overdueProjectFixture]),
      ),
    )
    renderDashboard()
    await waitFor(() => {
      expect(screen.getByText('D+82')).toBeInTheDocument()
    })
  })

  it('사업 목록이 비어 있으면 EmptyState를 표시한다', async () => {
    server.use(
      http.get('/api/v1/projects', () => HttpResponse.json([])),
    )
    renderDashboard()
    await waitFor(() => {
      expect(screen.getByText('등록된 사업이 없습니다')).toBeInTheDocument()
    })
  })

  it('API 에러 시 에러 메시지를 표시한다', async () => {
    server.use(
      http.get('/api/v1/projects', () => HttpResponse.json({}, { status: 500 })),
    )
    renderDashboard()
    await waitFor(() => {
      expect(screen.getByText(/불러오지 못했습니다/)).toBeInTheDocument()
    })
  })

  it('WBS 링크가 올바른 경로(/projects/:id/wbs)로 연결된다', async () => {
    renderDashboard()
    await waitFor(() => {
      const links = screen.getAllByRole('link', { name: /WBS\/간트/ })
      expect(links[0]).toHaveAttribute('href', '/projects/1/wbs')
    })
  })

  // ---- 새 프로젝트 등록 ----

  it('"새 프로젝트 등록" 버튼이 대시보드 헤더에 표시된다', () => {
    renderDashboard()
    expect(screen.getByRole('button', { name: /새 프로젝트 등록/ })).toBeInTheDocument()
  })

  it('버튼 클릭 시 등록 모달이 열린다', async () => {
    const user = userEvent.setup()
    renderDashboard()
    await user.click(screen.getByRole('button', { name: /새 프로젝트 등록/ }))
    expect(screen.getByRole('heading', { name: '새 프로젝트 등록' })).toBeInTheDocument()
  })

  it('사업명 없이 제출하면 유효성 오류 메시지가 표시된다', async () => {
    const user = userEvent.setup()
    renderDashboard()
    await user.click(screen.getByRole('button', { name: /새 프로젝트 등록/ }))
    await user.click(screen.getByRole('button', { name: '등록' }))
    await waitFor(() => {
      expect(screen.getByText('사업명을 입력하세요')).toBeInTheDocument()
    })
  })

  it('필수값을 입력하고 제출하면 API가 호출되고 모달이 닫힌다', async () => {
    const user = userEvent.setup()
    renderDashboard()
    await user.click(screen.getByRole('button', { name: /새 프로젝트 등록/ }))
    await user.type(screen.getByLabelText(/사업명/), '테스트 신규 사업')
    await user.click(screen.getByRole('button', { name: '등록' }))
    await waitFor(() => {
      expect(screen.queryByRole('heading', { name: '새 프로젝트 등록' })).not.toBeInTheDocument()
    })
  })
})
