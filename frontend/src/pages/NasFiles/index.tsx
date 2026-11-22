import { useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { useListFolders, useListFiles, useCreateFile, useDeleteFolder, useCreateFolder } from './api'
import { FileViewer } from './FileViewer'
import { NewFileModal } from './NewFileModal'
import type { NasFileInfo, ProjectFolderResponse } from './types'

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

function formatDate(iso: string): string {
  if (!iso) return '-'
  return iso.replace('T', ' ').substring(0, 16)
}

export function NasFilesPage() {
  const { projectId } = useParams<{ projectId: string }>()
  const pid = Number(projectId)

  const [selectedFolder, setSelectedFolder] = useState<ProjectFolderResponse | null>(null)
  const [viewingFile, setViewingFile] = useState<{ file: NasFileInfo; mode: 'view' | 'edit' } | null>(null)
  const [showNewFileModal, setShowNewFileModal] = useState(false)
  const [showAddFolderForm, setShowAddFolderForm] = useState(false)
  const [newFolderLabel, setNewFolderLabel] = useState('')
  const [newFolderPath, setNewFolderPath] = useState('')

  const { data: folders, isLoading: foldersLoading, isError: foldersError } = useListFolders(pid)
  const {
    data: files,
    isLoading: filesLoading,
    isError: filesError,
  } = useListFiles(pid, selectedFolder?.folderId ?? null)

  const createFile = useCreateFile(pid, selectedFolder?.folderId ?? null)
  const deleteFolder = useDeleteFolder(pid)
  const createFolder = useCreateFolder(pid)

  const handleCreateFile = (name: string, type: 'xlsx' | 'docx') => {
    createFile.mutate(
      { name, type },
      {
        onSuccess: (data) => {
          setShowNewFileModal(false)
          // 생성 후 편집 모드로 바로 열기
          const newFileInfo: NasFileInfo = {
            name: `${name}.${type}`,
            fileKey: data.fileKey,
            size: 0,
            lastModified: new Date().toISOString().replace('Z', '').substring(0, 19),
            extension: type,
          }
          setViewingFile({ file: newFileInfo, mode: 'edit' })
        },
      },
    )
  }

  const handleAddFolder = (e: React.FormEvent) => {
    e.preventDefault()
    if (!newFolderLabel.trim() || !newFolderPath.trim()) return
    createFolder.mutate(
      { label: newFolderLabel.trim(), nasPath: newFolderPath.trim() },
      {
        onSuccess: () => {
          setShowAddFolderForm(false)
          setNewFolderLabel('')
          setNewFolderPath('')
        },
      },
    )
  }

  return (
    <div className="flex flex-col flex-1">
      {/* 헤더 */}
      <header className="bg-white border-b border-slate-200 px-8 py-5 flex items-center gap-3">
        <Link
          to="/dashboard"
          className="text-xs text-slate-400 hover:text-slate-600 flex items-center gap-1"
        >
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
            <path d="M8 10L4 6L8 2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          포트폴리오
        </Link>
        <span className="text-slate-300">/</span>
        <h1 className="text-lg font-semibold text-slate-900">증적 파일</h1>
        <span className="text-xs text-slate-500 mt-0.5">사업 #{projectId}</span>
      </header>

      <div className="flex flex-1 overflow-hidden">
        {/* 좌측 패널: 폴더 목록 */}
        <aside className="w-56 border-r border-slate-200 bg-slate-50 flex flex-col">
          <div className="px-3 py-3 border-b border-slate-200">
            <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">폴더</p>
          </div>

          <nav className="flex-1 overflow-y-auto p-2 space-y-0.5">
            {foldersLoading && (
              <div className="space-y-2 p-1">
                {[1, 2].map((i) => (
                  <div key={i} className="h-8 animate-pulse rounded bg-slate-200" />
                ))}
              </div>
            )}

            {foldersError && (
              <p className="text-xs text-red-500 p-2">폴더를 불러오지 못했습니다</p>
            )}

            {!foldersLoading &&
              !foldersError &&
              folders?.map((folder) => (
                <button
                  key={folder.folderId}
                  onClick={() => setSelectedFolder(folder)}
                  className={`w-full text-left flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-colors ${
                    selectedFolder?.folderId === folder.folderId
                      ? 'bg-blue-50 text-blue-700 font-medium'
                      : 'text-slate-700 hover:bg-slate-200'
                  }`}
                >
                  <span>📁</span>
                  <span className="truncate">{folder.label}</span>
                </button>
              ))}
          </nav>

          {/* 폴더 추가 */}
          <div className="p-2 border-t border-slate-200">
            {showAddFolderForm ? (
              <form onSubmit={handleAddFolder} className="space-y-2">
                <input
                  type="text"
                  value={newFolderLabel}
                  onChange={(e) => setNewFolderLabel(e.target.value)}
                  placeholder="폴더 이름"
                  className="w-full border border-slate-200 rounded px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-blue-500"
                  autoFocus
                />
                <input
                  type="text"
                  value={newFolderPath}
                  onChange={(e) => setNewFolderPath(e.target.value)}
                  placeholder="NAS 경로"
                  className="w-full border border-slate-200 rounded px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
                <div className="flex gap-1">
                  <button
                    type="submit"
                    disabled={createFolder.isPending}
                    className="flex-1 text-xs bg-blue-600 text-white rounded px-2 py-1 hover:bg-blue-700 disabled:opacity-50"
                  >
                    추가
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowAddFolderForm(false)}
                    className="text-xs text-slate-500 hover:text-slate-700 px-2 py-1"
                  >
                    취소
                  </button>
                </div>
              </form>
            ) : (
              <button
                onClick={() => setShowAddFolderForm(true)}
                className="w-full flex items-center gap-2 px-3 py-2 text-xs text-slate-500 hover:text-slate-700 hover:bg-slate-200 rounded-lg transition-colors"
              >
                <span>+</span> 폴더 등록
              </button>
            )}
          </div>
        </aside>

        {/* 우측 메인: 파일 목록 */}
        <main className="flex-1 flex flex-col overflow-hidden">
          {selectedFolder ? (
            <>
              {/* 파일 영역 헤더 */}
              <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <span className="font-medium text-sm text-slate-800">{selectedFolder.label}</span>
                  {selectedFolder.description && (
                    <span className="text-xs text-slate-400">{selectedFolder.description}</span>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setShowNewFileModal(true)}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    <span>+</span> 새 파일 만들기
                  </button>
                  <button
                    onClick={() => {
                      if (confirm(`"${selectedFolder.label}" 폴더 등록을 삭제하시겠습니까? NAS 파일은 삭제되지 않습니다.`)) {
                        deleteFolder.mutate(selectedFolder.folderId, {
                          onSuccess: () => setSelectedFolder(null),
                        })
                      }
                    }}
                    className="text-xs text-slate-400 hover:text-red-500 px-2 py-1.5 rounded hover:bg-red-50 transition-colors"
                  >
                    폴더 등록 삭제
                  </button>
                </div>
              </div>

              {/* 파일 목록 */}
              <div className="flex-1 overflow-y-auto">
                {filesLoading && (
                  <div className="p-6 space-y-3">
                    {[1, 2, 3].map((i) => (
                      <div key={i} className="h-10 animate-pulse rounded bg-slate-100" />
                    ))}
                  </div>
                )}

                {filesError && (
                  <div className="p-6">
                    <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
                      파일 목록을 불러오지 못했습니다
                    </div>
                  </div>
                )}

                {!filesLoading && !filesError && files && files.length === 0 && (
                  <div className="flex flex-col items-center justify-center py-20 text-slate-400">
                    <svg width="40" height="40" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                    </svg>
                    <p className="mt-3 text-sm font-medium">파일이 없습니다</p>
                    <p className="text-xs mt-1">새 파일을 만들거나 NAS에 직접 파일을 추가하세요</p>
                  </div>
                )}

                {!filesLoading && !filesError && files && files.length > 0 && (
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-slate-100 bg-slate-50">
                        <th className="text-left px-6 py-2 text-xs font-medium text-slate-500 w-1/2">이름</th>
                        <th className="text-right px-4 py-2 text-xs font-medium text-slate-500">크기</th>
                        <th className="text-left px-4 py-2 text-xs font-medium text-slate-500">수정일</th>
                        <th className="px-4 py-2 text-xs font-medium text-slate-500 text-center">작업</th>
                      </tr>
                    </thead>
                    <tbody>
                      {files.map((file) => (
                        <tr key={file.fileKey} className="border-b border-slate-50 hover:bg-slate-50 transition-colors">
                          <td className="px-6 py-3">
                            <div className="flex items-center gap-2">
                              <FileIcon ext={file.extension} />
                              <span className="text-slate-800">{file.name}</span>
                            </div>
                          </td>
                          <td className="px-4 py-3 text-right text-slate-500 text-xs">
                            {formatSize(file.size)}
                          </td>
                          <td className="px-4 py-3 text-slate-500 text-xs">
                            {formatDate(file.lastModified)}
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex items-center justify-center gap-1">
                              <button
                                onClick={() => setViewingFile({ file, mode: 'view' })}
                                className="text-xs px-2 py-1 rounded text-blue-600 hover:bg-blue-50 transition-colors"
                              >
                                보기
                              </button>
                              {file.extension !== 'pdf' && (
                                <button
                                  onClick={() => setViewingFile({ file, mode: 'edit' })}
                                  className="text-xs px-2 py-1 rounded text-slate-600 hover:bg-slate-100 transition-colors"
                                >
                                  편집
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            </>
          ) : (
            <div className="flex flex-col items-center justify-center flex-1 text-slate-400">
              <svg width="40" height="40" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
              </svg>
              <p className="mt-3 text-sm font-medium">폴더를 선택하세요</p>
              <p className="text-xs mt-1">좌측에서 폴더를 선택하면 파일 목록이 표시됩니다</p>
            </div>
          )}
        </main>
      </div>

      {/* 파일 뷰어 */}
      {viewingFile && (
        <FileViewer
          file={viewingFile.file}
          mode={viewingFile.mode}
          onClose={() => setViewingFile(null)}
        />
      )}

      {/* 신규 파일 생성 모달 */}
      {showNewFileModal && (
        <NewFileModal
          onConfirm={handleCreateFile}
          onClose={() => setShowNewFileModal(false)}
          isPending={createFile.isPending}
        />
      )}
    </div>
  )
}

function FileIcon({ ext }: { ext: string }) {
  const icons: Record<string, string> = {
    pdf: '📄',
    xlsx: '📊',
    xls: '📊',
    docx: '📝',
    doc: '📝',
    hwp: '📋',
    hwpx: '📋',
    pptx: '📑',
    ppt: '📑',
  }
  return <span className="text-sm">{icons[ext.toLowerCase()] ?? '📎'}</span>
}
