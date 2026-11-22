import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { HttpResponse, http } from 'msw'
import { server } from '@/test/setup'
import { overdueProjectFixture } from '@/test/fixtures/projects'
import { Dashboard } from './index'
import type { CreateProjectRequest } from './api'

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

  // ---- 증적자료 폴더 (선택) ----

  async function openModalAndFillName(user: ReturnType<typeof userEvent.setup>) {
    await user.click(screen.getByRole('button', { name: /새 프로젝트 등록/ }))
    await user.type(screen.getByLabelText(/사업명/), '가상 신규 사업')
  }

  function captureCreateBody() {
    const bodies: CreateProjectRequest[] = []
    server.use(
      http.post('/api/v1/projects', async ({ request }) => {
        bodies.push((await request.json()) as CreateProjectRequest)
        return HttpResponse.json({}, { status: 201 })
      }),
    )
    return bodies
  }

  it('증적자료 폴더를 비워 두면 요청에 폴더 필드가 없다', async () => {
    const bodies = captureCreateBody()
    const user = userEvent.setup()
    renderDashboard()
    await openModalAndFillName(user)
    await user.click(screen.getByRole('button', { name: '등록' }))
    await waitFor(() => expect(bodies).toHaveLength(1))
    expect(bodies[0]).not.toHaveProperty('evidenceFolderPath')
    expect(bodies[0]).not.toHaveProperty('evidenceFolderLabel')
  })

  it('증적자료 폴더 이름·경로를 입력하면 요청 본문에 포함된다', async () => {
    const bodies = captureCreateBody()
    const user = userEvent.setup()
    renderDashboard()
    await openModalAndFillName(user)
    await user.type(screen.getByLabelText('폴더 이름'), '감사 증적')
    await user.type(screen.getByLabelText('NAS 경로'), '/mnt/nas/가상사업/증적자료')
    await user.click(screen.getByRole('button', { name: '등록' }))
    await waitFor(() => expect(bodies).toHaveLength(1))
    expect(bodies[0]).toMatchObject({
      evidenceFolderLabel: '감사 증적',
      evidenceFolderPath: '/mnt/nas/가상사업/증적자료',
    })
  })

  it('경로만 입력하고 폴더 이름이 없으면 유효성 오류를 표시하고 요청하지 않는다', async () => {
    const bodies = captureCreateBody()
    const user = userEvent.setup()
    renderDashboard()
    await openModalAndFillName(user)
    await user.type(screen.getByLabelText('NAS 경로'), '/mnt/nas/가상사업/증적자료')
    await user.click(screen.getByRole('button', { name: '등록' }))
    expect(await screen.findByText('폴더 경로를 입력했다면 폴더 이름도 입력하세요')).toBeInTheDocument()
    expect(bodies).toHaveLength(0)
  })

  it('서버가 400을 반환하면 detail 메시지를 표시하고 모달을 유지한다', async () => {
    server.use(
      http.post('/api/v1/projects', () =>
        HttpResponse.json({ detail: '허용되지 않은 NAS 경로입니다: /etc/x' }, { status: 400 }),
      ),
    )
    const user = userEvent.setup()
    renderDashboard()
    await openModalAndFillName(user)
    await user.type(screen.getByLabelText('폴더 이름'), '증적자료')
    await user.type(screen.getByLabelText('NAS 경로'), '/etc/x')
    await user.click(screen.getByRole('button', { name: '등록' }))
    expect(await screen.findByRole('alert')).toHaveTextContent('허용되지 않은 NAS 경로입니다: /etc/x')
    expect(screen.getByRole('heading', { name: '새 프로젝트 등록' })).toBeInTheDocument()
  })

  // ---- 열린 이슈 모달 ----

  it('카드의 "열린 이슈 N건"을 누르면 이슈 모달이 열리고 목록이 표시된다', async () => {
    const user = userEvent.setup()
    renderDashboard()
    await user.click(await screen.findByRole('button', { name: '열린 이슈 2건 보기' }))
    const dialog = await screen.findByRole('dialog')
    expect(within(dialog).getByText('스마트 팩토리 구축 사업')).toBeInTheDocument()
    expect(await within(dialog).findByText('가상 보안 요건 추가 대응')).toBeInTheDocument()
  })

  it('열린 이슈가 0건인 카드는 버튼이 비활성화된다', async () => {
    renderDashboard()
    const zeroButtons = await screen.findAllByRole('button', { name: '열린 이슈 0건 보기' })
    zeroButtons.forEach((b) => expect(b).toBeDisabled())
  })
})
