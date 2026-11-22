import { useState } from 'react'
import { useListProjects } from '@/api/generated/project'
import { ProjectCard } from './ProjectCard'
import { NewProjectModal } from './NewProjectModal'

export function Dashboard() {
  const { data: projects, isLoading, isError } = useListProjects()
  const [modalOpen, setModalOpen] = useState(false)

  return (
    <div className="flex flex-col flex-1">
      {/* 헤더 */}
      <header className="bg-white border-b border-slate-200 px-8 py-5">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-lg font-semibold text-slate-900">포트폴리오 대시보드</h1>
            <p className="text-sm text-slate-500 mt-0.5">전체 사업 현황을 한눈에 확인합니다</p>
          </div>
          <div className="flex items-center gap-4">
            {!isLoading && !isError && projects && (
              <div className="flex items-center gap-4 text-sm text-slate-500">
                <span>전체 <strong className="text-slate-800">{projects.length}</strong>건</span>
                <span>
                  주의/위험{' '}
                  <strong className="text-orange-600">
                    {projects.filter((p) => p.statusSignal?.status !== 'NORMAL').length}
                  </strong>
                  건
                </span>
              </div>
            )}
            <button
              onClick={() => setModalOpen(true)}
              className="flex items-center gap-1.5 rounded-md bg-blue-600 px-3.5 py-2 text-sm font-medium text-white hover:bg-blue-700"
            >
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
                <path d="M7 1v12M1 7h12" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
              </svg>
              새 프로젝트 등록
            </button>
          </div>
        </div>
      </header>

      {modalOpen && <NewProjectModal onClose={() => setModalOpen(false)} />}

      {/* 본문 */}
      <main className="flex-1 p-8">
        {isLoading && (
          <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-52 animate-pulse rounded-xl bg-slate-200" />
            ))}
          </div>
        )}

        {isError && (
          <div className="rounded-xl border border-red-200 bg-red-50 p-5 text-sm text-red-700">
            사업 목록을 불러오지 못했습니다. 잠시 후 다시 시도해 주세요.
          </div>
        )}

        {!isLoading && !isError && (!projects || projects.length === 0) && (
          <div className="flex flex-col items-center justify-center py-24 text-slate-400">
            <svg width="48" height="48" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
            </svg>
            <p className="mt-3 font-medium">등록된 사업이 없습니다</p>
          </div>
        )}

        {!isLoading && !isError && projects && projects.length > 0 && (
          <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
            {projects.map((project) => (
              <ProjectCard key={project.projectId} project={project} />
            ))}
          </div>
        )}
      </main>
    </div>
  )
}
