import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen, waitFor, fireEvent } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { HttpResponse, http } from 'msw'
import { server } from '@/test/setup'
import { NasFilesPage } from './index'

function renderNasFiles(projectId = '1') {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  })
  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={[`/projects/${projectId}/files`]}>
        <Routes>
          <Route path="/projects/:projectId/files" element={<NasFilesPage />} />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>,
  )
}

describe('NasFiles', () => {
  it('폴더 목록이 표시된다', async () => {
    renderNasFiles()
    await waitFor(() => {
      expect(screen.getByText('계약 증적')).toBeInTheDocument()
      expect(screen.getByText('중간보고 자료')).toBeInTheDocument()
    })
  })

  it('폴더 클릭 시 해당 폴더의 파일 목록이 표시된다', async () => {
    renderNasFiles()
    await waitFor(() => {
      expect(screen.getByText('계약 증적')).toBeInTheDocument()
    })

    fireEvent.click(screen.getByText('계약 증적'))

    await waitFor(() => {
      expect(screen.getByText('계약서_v3.xlsx')).toBeInTheDocument()
      expect(screen.getByText('계약_최종.pdf')).toBeInTheDocument()
      expect(screen.getByText('검토의견서.hwp')).toBeInTheDocument()
    })
  })

  it('PDF 파일 "보기" 클릭 시 iframe이 렌더링된다', async () => {
    renderNasFiles()
    await waitFor(() => expect(screen.getByText('계약 증적')).toBeInTheDocument())

    fireEvent.click(screen.getByText('계약 증적'))
    await waitFor(() => expect(screen.getByText('계약_최종.pdf')).toBeInTheDocument())

    // PDF 행의 "보기" 버튼 클릭
    const pdfRow = screen.getByText('계약_최종.pdf').closest('tr')!
    const viewBtn = pdfRow.querySelector('button')!
    fireEvent.click(viewBtn)

    await waitFor(() => {
      const iframe = document.querySelector('iframe')
      expect(iframe).toBeInTheDocument()
      expect(iframe?.src).toContain('uuid-pdf-002')
    })
  })

  it('Excel 파일 "편집" 클릭 시 OnlyOffice 설정 API를 호출한다', async () => {
    let configCalled = false
    server.use(
      http.get('/api/v1/onlyoffice/config', () => {
        configCalled = true
        return HttpResponse.json({
          documentType: 'cell',
          document: {
            fileType: 'xlsx',
            key: 'uuid-excel-001',
            url: 'http://localhost:8080/api/files/stream?key=uuid-excel-001',
            title: '계약서_v3.xlsx',
          },
          editorConfig: {
            mode: 'edit',
            callbackUrl: 'http://localhost:8080/api/v1/onlyoffice/callback?key=uuid-excel-001',
          },
        })
      }),
    )

    renderNasFiles()
    await waitFor(() => expect(screen.getByText('계약 증적')).toBeInTheDocument())
    fireEvent.click(screen.getByText('계약 증적'))
    await waitFor(() => expect(screen.getByText('계약서_v3.xlsx')).toBeInTheDocument())

    const xlsxRow = screen.getByText('계약서_v3.xlsx').closest('tr')!
    const editBtn = Array.from(xlsxRow.querySelectorAll('button')).find(
      (b) => b.textContent?.trim() === '편집',
    )!
    fireEvent.click(editBtn)

    await waitFor(() => {
      expect(configCalled).toBe(true)
    })
  })

  it('"새 파일 만들기" 클릭 시 모달이 열린다', async () => {
    renderNasFiles()
    await waitFor(() => expect(screen.getByText('계약 증적')).toBeInTheDocument())
    fireEvent.click(screen.getByText('계약 증적'))
    await waitFor(() => expect(screen.getByText('계약서_v3.xlsx')).toBeInTheDocument())

    fireEvent.click(screen.getByRole('button', { name: /새 파일 만들기/ }))

    await waitFor(() => {
      expect(screen.getByRole('dialog', { name: '새 파일 만들기' })).toBeInTheDocument()
    })
  })

  it('파일이 없는 폴더는 EmptyState를 표시한다', async () => {
    renderNasFiles()
    await waitFor(() => expect(screen.getByText('중간보고 자료')).toBeInTheDocument())

    // folderId=2는 빈 폴더 (nasHandlers 참조)
    fireEvent.click(screen.getByText('중간보고 자료'))

    await waitFor(() => {
      expect(screen.getByText('파일이 없습니다')).toBeInTheDocument()
    })
  })

  it('파일 목록 API 에러 시 에러 메시지를 표시한다', async () => {
    server.use(
      http.get('/api/v1/projects/:projectId/folders/:folderId/files', () =>
        HttpResponse.json({}, { status: 500 }),
      ),
    )

    renderNasFiles()
    await waitFor(() => expect(screen.getByText('계약 증적')).toBeInTheDocument())
    fireEvent.click(screen.getByText('계약 증적'))

    await waitFor(() => {
      expect(screen.getByText('파일 목록을 불러오지 못했습니다')).toBeInTheDocument()
    })
  })
})
