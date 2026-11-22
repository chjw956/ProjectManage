import type { ProjectFolderResponse, NasFileInfo } from '@/pages/NasFiles/types'

export const foldersFixture: ProjectFolderResponse[] = [
  {
    folderId: 1,
    projectId: 1,
    label: '계약 증적',
    nasPath: '/tmp/nas-mock/erp/contract',
    description: 'ERP 구축 계약 관련 증빙 자료',
    sortOrder: 1,
  },
  {
    folderId: 2,
    projectId: 1,
    label: '중간보고 자료',
    nasPath: '/tmp/nas-mock/erp/report',
    description: 'ERP 중간 보고 발표 자료 및 회의록',
    sortOrder: 2,
  },
]

export const filesFixture: NasFileInfo[] = [
  {
    name: '계약서_v3.xlsx',
    fileKey: 'uuid-excel-001',
    size: 24576,
    lastModified: '2026-11-15T10:30:00',
    extension: 'xlsx',
  },
  {
    name: '계약_최종.pdf',
    fileKey: 'uuid-pdf-002',
    size: 512000,
    lastModified: '2026-11-14T15:00:00',
    extension: 'pdf',
  },
  {
    name: '검토의견서.hwp',
    fileKey: 'uuid-hwp-003',
    size: 102400,
    lastModified: '2026-11-10T09:00:00',
    extension: 'hwp',
  },
]

export const emptyFilesFixture: NasFileInfo[] = []
