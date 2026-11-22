import { HttpResponse, http } from 'msw'
import { foldersFixture, filesFixture } from '../fixtures/nasFiles'

export const nasHandlers = [
  // 폴더 목록
  http.get('/api/v1/projects/:projectId/folders', () => {
    return HttpResponse.json(foldersFixture)
  }),

  // 폴더별 파일 목록
  http.get('/api/v1/projects/:projectId/folders/:folderId/files', ({ params }) => {
    const { folderId } = params
    // folderId=2 는 빈 폴더로 처리 (테스트용)
    if (folderId === '2') {
      return HttpResponse.json([])
    }
    return HttpResponse.json(filesFixture)
  }),

  // OnlyOffice 설정
  http.get('/api/v1/onlyoffice/config', () => {
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

  // 신규 파일 생성
  http.post('/api/v1/projects/:projectId/folders/:folderId/files', () => {
    return HttpResponse.json({ fileKey: 'uuid-new-file-999' }, { status: 201 })
  }),

  // 폴더 등록
  http.post('/api/v1/projects/:projectId/folders', async ({ request }) => {
    const body = await request.json() as { label: string; nasPath: string; description?: string }
    return HttpResponse.json(
      {
        folderId: 99,
        projectId: 1,
        label: body.label,
        nasPath: body.nasPath,
        description: body.description ?? null,
        sortOrder: 3,
      },
      { status: 201 },
    )
  }),

  // 폴더 삭제
  http.delete('/api/v1/projects/:projectId/folders/:folderId', () => {
    return new HttpResponse(null, { status: 204 })
  }),
]
