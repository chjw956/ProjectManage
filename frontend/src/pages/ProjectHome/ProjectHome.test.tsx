import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { HttpResponse, http } from 'msw'
import { server } from '@/test/setup'
import { ProjectHome } from './index'

function renderProjectHome(projectId = 1) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  })
  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={[`/projects/${projectId}/home`]}>
        <Routes>
          <Route path="/projects/:projectId/home" element={<ProjectHome />} />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>,
  )
}

describe('ProjectHome', () => {
  it('사업명과 유형(사내/정부)이 올바르게 표시된다', async () => {
    renderProjectHome()
    await waitFor(() => {
      expect(screen.getByText('스마트 팩토리 구축 사업')).toBeInTheDocument()
      expect(screen.getByText('사내')).toBeInTheDocument()
    })
  })

  it('상태 신호(주의)와 판단 사유가 함께 표시된다', async () => {
    renderProjectHome()
    await waitFor(() => {
      expect(screen.getByText('주의')).toBeInTheDocument()
      expect(screen.getByText(/마일스톤 1주 지연/)).toBeInTheDocument()
    })
  })

  it('진척률 숫자(예: "45%")가 표시된다', async () => {
    renderProjectHome()
    await waitFor(() => {
      expect(screen.getByText('45%')).toBeInTheDocument()
    })
  })

  it('마일스톤 목록에 계획일이 표시된다', async () => {
    renderProjectHome()
    await waitFor(() => {
      // milestonesFixture에 plannedDate '2026-11-30' → formatDate → '2026.11.30'
      expect(screen.getByText(/2026\.11\.30/)).toBeInTheDocument()
    })
  })

  it('최근 이벤트 요약 텍스트가 표시된다', async () => {
    renderProjectHome()
    await waitFor(() => {
      expect(screen.getByText('2차 PoC 범위를 설비예지보전으로 한정')).toBeInTheDocument()
    })
  })

  it('WBS/간트 링크가 /projects/1/wbs로 연결된다', async () => {
    renderProjectHome(1)
    await waitFor(() => {
      const link = screen.getByRole('link', { name: /WBS\/간트/ })
      expect(link).toBeInTheDocument()
      expect(link.getAttribute('href')).toBe('/projects/1/wbs')
    })
  })

  it('API 에러 시 에러 메시지를 표시한다', async () => {
    server.use(
      http.get('/api/v1/projects/:projectId', () =>
        HttpResponse.json({}, { status: 500 }),
      ),
    )
    renderProjectHome()
    await waitFor(() => {
      expect(screen.getByText(/사업 홈 데이터를 불러오지 못했습니다/)).toBeInTheDocument()
    })
  })
})
