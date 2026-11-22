import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { HttpResponse, http } from 'msw'
import { server } from '@/test/setup'
import { OpenIssuesModal } from './OpenIssuesModal'

function renderModal(projectId = 1, onClose = vi.fn()) {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  render(
    <QueryClientProvider client={queryClient}>
      <OpenIssuesModal projectId={projectId} projectName="가상 사업" onClose={onClose} />
    </QueryClientProvider>,
  )
  return { onClose }
}

describe('OpenIssuesModal', () => {
  it('로딩 중에는 스켈레톤을 표시한다', () => {
    renderModal()
    expect(screen.getByTestId('issues-loading')).toBeInTheDocument()
  })

  it('열린 이슈 건수와 항목(등급·상태·담당자·대응 방안)을 표시한다', async () => {
    renderModal()
    expect(await screen.findByRole('heading', { name: '열린 이슈 2건' })).toBeInTheDocument()

    const items = screen.getAllByRole('listitem')
    expect(items).toHaveLength(2)
    expect(within(items[0]).getByText('가상 보안 요건 추가 대응')).toBeInTheDocument()
    expect(within(items[0]).getByText('등급 상')).toBeInTheDocument()
    expect(within(items[0]).getByText('미착수')).toBeInTheDocument()
    expect(within(items[0]).getByText('담당자A')).toBeInTheDocument()
    expect(within(items[0]).getByText('관련 부서 협의 중')).toBeInTheDocument()
    expect(within(items[1]).getByText('진행중')).toBeInTheDocument()
  })

  it('서버가 overdue=true로 준 이슈에만 "기한 초과"를 표시한다', async () => {
    renderModal()
    const items = await screen.findAllByRole('listitem')
    expect(within(items[0]).getByText('기한 초과')).toBeInTheDocument()
    expect(within(items[1]).queryByText('기한 초과')).not.toBeInTheDocument()
  })

  it('열린 이슈가 없으면 빈 상태를 표시한다', async () => {
    renderModal(2)
    expect(await screen.findByText('열린 이슈가 없습니다.')).toBeInTheDocument()
  })

  it('API 에러 시 에러 메시지를 표시한다', async () => {
    server.use(http.get('/api/v1/projects/:projectId/issues', () => HttpResponse.json({}, { status: 500 })))
    renderModal()
    expect(await screen.findByText(/이슈 목록을 불러오지 못했습니다/)).toBeInTheDocument()
  })

  it('닫기 버튼·Esc 키로 닫힌다', async () => {
    const user = userEvent.setup()
    const { onClose } = renderModal()
    await user.click(screen.getByRole('button', { name: '닫기' }))
    await user.keyboard('{Escape}')
    expect(onClose).toHaveBeenCalledTimes(2)
  })
})
