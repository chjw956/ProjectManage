import { Link, useParams, useSearchParams } from 'react-router-dom'
import { useGetGantt } from '@/api/generated/gantt'
import { useListMilestones } from '@/api/generated/milestone'
import { Badge } from '@/components/Badge'
import { GanttView } from '@/features/gantt/GanttView'
import { WbsToolbar } from './WbsToolbar'

export function WbsPage() {
  const { projectId: projectIdStr } = useParams<{ projectId: string }>()
  const projectId = Number(projectIdStr)
  const [searchParams] = useSearchParams()

  const view         = (searchParams.get('view')      ?? 'gantt') as 'gantt' | 'list'
  const scale        = (searchParams.get('scale')     ?? 'week')  as 'week' | 'fit'
  const q            = searchParams.get('q')          ?? ''
  const deptFilter   = searchParams.get('dept')       ?? ''
  const statusFilter = searchParams.get('taskStatus') ?? ''

  const { data: gantt,      isLoading: ganttLoading, isError: ganttError } = useGetGantt(projectId)
  const { data: milestones = [], isLoading: msLoading } = useListMilestones(projectId)

  /* ── 필터 ── */
  const allProcesses = gantt?.processes ?? []

  const filteredProcesses = allProcesses
    .map((p) => ({
      ...p,
      subtasks: (p.subtasks ?? []).filter((t) => {
        if (q) {
          const lq = q.toLowerCase()
          if (
            !(t.name ?? '').toLowerCase().includes(lq) &&
            !(t.dept ?? '').toLowerCase().includes(lq) &&
            !(t.assignee ?? '').toLowerCase().includes(lq)
          ) return false
        }
        if (deptFilter && t.dept !== deptFilter) return false
        if (statusFilter && t.status !== statusFilter) return false
        return true
      }),
    }))
    .filter((p) => {
      if (q) {
        const lq = q.toLowerCase()
        return (p.name ?? '').toLowerCase().includes(lq) || p.subtasks.length > 0
      }
      return true
    })

  const totalCount    = allProcesses.reduce((acc, p) => acc + (p.subtasks ?? []).length, 0)
  const filteredCount = filteredProcesses.reduce((acc, p) => acc + p.subtasks.length, 0)
  const filteredGantt = gantt ? { ...gantt, processes: filteredProcesses } : undefined

  // 부서 목록 (필터 드롭다운용)
  const depts = [...new Set(
    allProcesses.flatMap((p) => (p.subtasks ?? []).map((t) => t.dept).filter(Boolean))
  )] as string[]

  /* ── 로딩 / 에러 ── */
  if (ganttLoading || msLoading) {
    return (
      <div className="flex flex-col flex-1">
        <div className="bg-white border-b border-slate-200 px-8 py-5">
          <div className="h-5 w-48 animate-pulse rounded bg-slate-200" />
        </div>
        <div className="flex-1 p-8 space-y-3">
          {[1, 2, 3].map((i) => <div key={i} className="h-11 animate-pulse rounded bg-slate-100" />)}
        </div>
      </div>
    )
  }

  if (ganttError || !gantt) {
    return (
      <div className="flex flex-col flex-1">
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center text-slate-500">
            <p className="text-lg font-medium">WBS 데이터를 불러오지 못했습니다</p>
            <Link to="/dashboard" className="mt-3 inline-block text-sm text-blue-600 hover:underline">
              대시보드로 돌아가기
            </Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-screen">
      {/* 페이지 헤더 */}
      <header className="bg-white border-b border-slate-200 px-8 py-4 shrink-0">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link to="/dashboard" className="text-slate-400 hover:text-slate-600 transition-colors">
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <path d="M10 3L5 8l5 5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </Link>
            <div>
              <h1 className="text-base font-semibold text-slate-900">WBS / 간트 차트</h1>
              <p className="text-xs text-slate-500 mt-0.5">
                프로젝트 #{projectId} · 전체 진척률{' '}
                <strong className="text-slate-700">{gantt.progress ?? 0}%</strong>
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 text-xs text-slate-500">
            <span>마일스톤 <strong className="text-slate-700">{milestones.length}</strong>개</span>
          </div>
        </div>
      </header>

      {/* 툴바 */}
      <WbsToolbar totalCount={totalCount} filteredCount={filteredCount} depts={depts} />

      {/* 본문 */}
      <div className="flex-1 overflow-hidden">
        {filteredProcesses.length === 0 ? (
          <div className="flex items-center justify-center h-full text-slate-400">
            <div className="text-center">
              <svg width="40" height="40" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1} className="mx-auto mb-3">
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <p className="font-medium">검색 결과가 없습니다</p>
            </div>
          </div>
        ) : view === 'list' ? (
          /* ── 목록 뷰 ── */
          <div className="overflow-auto h-full">
            <table className="w-full text-sm border-collapse">
              <thead className="sticky top-0 z-10">
                <tr className="bg-slate-50 border-b border-slate-200 text-xs font-semibold text-slate-600 uppercase tracking-wide">
                  <th className="px-5 py-3 text-left">공정 / Task</th>
                  <th className="px-3 py-3 text-left">담당 부서</th>
                  <th className="px-3 py-3 text-left">담당자</th>
                  <th className="px-3 py-3 text-left">상태</th>
                  <th className="px-3 py-3 text-right">진행률</th>
                </tr>
              </thead>
              <tbody>
                {filteredProcesses.map((p) => (
                  <>
                    <tr
                      key={`proc-${p.taskId}`}
                      className="bg-slate-50 border-b border-slate-200"
                    >
                      <td className="px-5 py-2.5 font-semibold text-slate-800" colSpan={5}>
                        <span className="flex items-center gap-2">
                          <span className="w-1 h-4 rounded-full bg-blue-500 inline-block" />
                          {p.name}
                        </span>
                      </td>
                    </tr>
                    {p.subtasks.map((t) => (
                      <tr key={t.taskId} className="border-b border-slate-100 hover:bg-blue-50 transition-colors">
                        <td className="px-5 py-2.5 pl-10 text-slate-700">
                          {t.delayed && (
                            <span className="inline-block w-1.5 h-1.5 rounded-full bg-red-400 mr-1.5 align-middle" />
                          )}
                          {t.name ?? '—'}
                        </td>
                        <td className="px-3 py-2.5 text-slate-500">{t.dept || '—'}</td>
                        <td className="px-3 py-2.5 text-slate-500">{t.assignee || '—'}</td>
                        <td className="px-3 py-2.5">
                          <Badge status={t.status ?? 'PENDING'} delayed={t.delayed ?? false} />
                        </td>
                        <td className="px-3 py-2.5 text-right">
                          <div className="inline-flex items-center gap-2">
                            <div className="w-16 h-1.5 rounded-full bg-slate-100 overflow-hidden">
                              <div
                                className={`h-full rounded-full ${(t.delayed ?? false) ? 'bg-red-400' : 'bg-blue-500'}`}
                                style={{ width: `${t.progress ?? 0}%` }}
                              />
                            </div>
                            <span className="text-xs font-medium text-slate-600 w-8 text-right">
                              {t.progress ?? 0}%
                            </span>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          /* ── 간트 뷰 ── */
          filteredGantt && (
            <GanttView
              gantt={filteredGantt}
              milestones={milestones}
              projectId={projectId}
              scale={scale}
            />
          )
        )}
      </div>
    </div>
  )
}
