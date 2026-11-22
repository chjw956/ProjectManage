export interface ProjectFolderResponse {
  folderId: number
  projectId: number
  label: string
  nasPath: string
  description: string | null
  sortOrder: number
}

export interface NasFileInfo {
  name: string
  fileKey: string
  size: number
  lastModified: string
  extension: string
}

export interface OnlyOfficeConfig {
  documentType: string
  document: {
    fileType: string
    key: string
    url: string
    title: string
  }
  editorConfig: {
    mode: string
    callbackUrl: string
  }
}

export interface CreateFileRequest {
  name: string
  type: 'xlsx' | 'docx'
}
