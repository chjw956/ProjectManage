import { useEffect, useRef, useState } from 'react'
import { fetchOnlyOfficeConfig } from './api'
import type { NasFileInfo } from './types'

interface FileViewerProps {
  file: NasFileInfo
  mode: 'view' | 'edit'
  onClose: () => void
}

const ONLYOFFICE_URL = import.meta.env.VITE_ONLYOFFICE_URL ?? 'http://localhost:8081'

/** 파일 확장자가 PDF인지 여부 */
function isPdf(ext: string) {
  return ext.toLowerCase() === 'pdf'
}

/** OnlyOffice로 열 수 있는 확장자인지 여부 */
function isEditorSupported(ext: string) {
  const supported = ['xlsx', 'xls', 'docx', 'doc', 'pptx', 'ppt', 'odt', 'ods', 'odp', 'rtf', 'txt', 'csv', 'hwp', 'hwpx']
  return supported.includes(ext.toLowerCase())
}

export function FileViewer({ file, mode, onClose }: FileViewerProps) {
  const editorRef = useRef<HTMLDivElement>(null)
  const [editorError, setEditorError] = useState<string | null>(null)
  // PDF와 미지원 파일은 초기부터 로딩 상태 없음
  const [loading, setLoading] = useState(
    () => !isPdf(file.extension) && isEditorSupported(file.extension),
  )
  const editorInstanceRef = useRef<unknown>(null)

  // 미지원 확장자는 렌더 시점에 계산 (effect 외부)
  const unsupportedExt = !isPdf(file.extension) && !isEditorSupported(file.extension)
  const error = unsupportedExt ? `지원하지 않는 파일 형식입니다: .${file.extension}` : editorError

  useEffect(() => {
    if (isPdf(file.extension) || unsupportedExt) return

    let scriptEl: HTMLScriptElement | null = null
    let destroyed = false

    const initEditor = async () => {
      try {
        const config = await fetchOnlyOfficeConfig(file.fileKey, mode)

        // DocsAPI.js 동적 로드 (중복 로드 방지)
        const apiUrl = `${ONLYOFFICE_URL}/web-apps/apps/api/documents/api.js`
        if (!document.querySelector(`script[src="${apiUrl}"]`)) {
          scriptEl = document.createElement('script')
          scriptEl.src = apiUrl
          await new Promise<void>((resolve, reject) => {
            scriptEl!.onload = () => resolve()
            scriptEl!.onerror = () => reject(new Error('OnlyOffice API 스크립트 로드 실패'))
            document.head.appendChild(scriptEl!)
          })
        }

        if (destroyed) return

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const DocsAPI = (window as any).DocsAPI
        if (!DocsAPI || !editorRef.current) return

        editorInstanceRef.current = new DocsAPI.DocEditor('oo-editor', {
          documentType: config.documentType,
          document: config.document,
          editorConfig: config.editorConfig,
          width: '100%',
          height: '100%',
        })
        setLoading(false)
      } catch (e) {
        if (!destroyed) {
          setEditorError(e instanceof Error ? e.message : 'OnlyOffice 로드 중 오류가 발생했습니다')
          setLoading(false)
        }
      }
    }

    initEditor()

    return () => {
      destroyed = true
    }
  }, [file.fileKey, file.extension, mode, unsupportedExt])

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-white">
      {/* 헤더 */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-slate-200 bg-slate-50">
        <div className="flex items-center gap-3">
          <span className="text-sm font-medium text-slate-800">{file.name}</span>
          <span className="text-xs text-slate-500 bg-slate-200 px-2 py-0.5 rounded">
            {mode === 'edit' ? '편집' : '보기'}
          </span>
        </div>
        <button
          onClick={onClose}
          className="text-slate-500 hover:text-slate-700 p-1 rounded hover:bg-slate-200 transition-colors"
          aria-label="닫기"
        >
          <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
            <path d="M6 6l8 8M14 6l-8 8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" fill="none" />
          </svg>
        </button>
      </div>

      {/* 뷰어 본문 */}
      <div className="flex-1 overflow-hidden">
        {loading && (
          <div className="flex items-center justify-center h-full text-slate-400">
            <div className="text-center">
              <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
              <p className="text-sm">파일을 불러오는 중...</p>
            </div>
          </div>
        )}

        {error && (
          <div className="flex items-center justify-center h-full">
            <div className="text-center text-red-600">
              <p className="text-sm font-medium">파일을 열 수 없습니다</p>
              <p className="text-xs mt-1 text-red-400">{error}</p>
            </div>
          </div>
        )}

        {!error && isPdf(file.extension) && (
          <iframe
            src={`/api/files/stream?key=${file.fileKey}`}
            title={file.name}
            className="w-full h-full border-none"
          />
        )}

        {!error && isEditorSupported(file.extension) && (
          <div
            id="oo-editor"
            ref={editorRef}
            className="w-full h-full"
            style={{ visibility: loading ? 'hidden' : 'visible' }}
          />
        )}
      </div>
    </div>
  )
}
