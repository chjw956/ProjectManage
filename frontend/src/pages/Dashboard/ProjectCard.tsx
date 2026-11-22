import { Link } from 'react-router-dom'
import { displayDDay, formatDate } from '@/lib/date'
import type { ProjectSummaryResponse } from '@/api/generated/model'

interface ProjectCardProps {
  project: ProjectSummaryResponse
}

const SIGNAL_STYLE = {
  DANGER:  { dot: 'bg-red-500',    badge: 'bg-red-50 text-red-700 border-red-200',    label: '위험' },
  CAUTION: { dot: 'bg-orange-400', badge: 'bg-orange-50 text-orange-700 border-orange-200', label: '주의' },
  NORMAL:  { dot: 'bg-emerald-500',badge: 'bg-emerald-50 text-emerald-700 border-emerald-200', label: '정상' },
} as const

const BORDER_LEFT = {
  DANGER:  'border-l-red-500',
  CAUTION: 'border-l-orange-400',
  NORMAL:  'border-l-emerald-500',
} as const

export function ProjectCard({ project }: ProjectCardProps) {
  const { projectId, name, type, phase, progress, openIssueCount, statusSignal, nextMilestone } = project

  const signalKey = (statusSignal?.status ?? 'NORMAL') as keyof typeof SIGNAL_STYLE
  const signal = SIGNAL_STYLE[signalKey]
  const typeLabel = (type ?? 'INTERNAL') === 'GOV' ? '정부' : '사내'

  return (
    <div className={`bg-white rounded-xl border border-slate-200 border-l-4 ${BORDER_LEFT[signalKey]} shadow-sm hover:shadow-md transition-shadow flex flex-col`}>
      {/* 카드 헤더 */}
      <div className="p-5 pb-4">
        <div className="flex items-start justify-between gap-2 mb-3">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">
              {typeLabel}
            </span>
            <span className="text-xs text-slate-500">{phase}</span>
          </div>
          {/* 상태 신호 배지 */}
          <span className={`flex items-center gap-1.5 text-xs font-medium px-2 py-0.5 rounded-full border ${signal.badge}`}>
            <span className={`w-1.5 h-1.5 rounded-full ${signal.dot}`} />
            {signal.label}
          </span>
        </div>

        <h2 className="text-base font-semibold text-slate-900 leading-snug">{name}</h2>

        {/* 상태 사유 */}
        {(statusSignal?.reasons ?? []).length > 0 && (
          <p className="mt-1 text-xs text-slate-500 truncate">
            {statusSignal?.reasons?.[0]}
          </p>
        )}
      </div>

      {/* 진척률 */}
      <div className="px-5 pb-4">
        <div className="flex justify-between text-xs text-slate-500 mb-1.5">
          <span>진척률</span>
          <span className="font-semibold text-slate-700">{progress ?? 0}%</span>
        </div>
        <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100">
          <div
            className="h-full rounded-full bg-blue-500 transition-all duration-500"
            style={{ width: `${progress ?? 0}%` }}
          />
        </div>
      </div>

      {/* 구분선 */}
      <div className="border-t border-slate-100" />

      {/* 다음 마일스톤 + 이슈 */}
      <div className="px-5 py-3 flex items-center justify-between gap-2">
        <div className="text-xs text-slate-500 min-w-0">
          {nextMilestone ? (
            <div className="flex items-center gap-1.5 min-w-0">
              <svg width="12" height="12" viewBox="0 0 12 12" fill="none" className="shrink-0 text-slate-400">
                <path d="M6 1L7.5 4.5H11L8.25 6.75L9.5 10.5L6 8.5L2.5 10.5L3.75 6.75L1 4.5H4.5L6 1Z" fill="currentColor" />
              </svg>
              <span className="truncate font-medium text-slate-700">{nextMilestone.name}</span>
              <span className="shrink-0">{formatDate(nextMilestone.plannedDate)}</span>
            </div>
          ) : (
            <span>다음 마일스톤 없음</span>
          )}
        </div>
        {nextMilestone && (
          <span
            className={`text-xs font-bold shrink-0 ${
              (nextMilestone.dDay ?? 0) > 0 ? 'text-red-500' : 'text-blue-600'
            }`}
          >
            {displayDDay(nextMilestone.dDay ?? 0)}
          </span>
        )}
      </div>

      {/* 푸터 */}
      <div className="px-5 py-3 border-t border-slate-100 bg-slate-50 rounded-b-xl flex items-center justify-between">
        <div className="flex items-center gap-1 text-xs text-slate-500">
          <svg width="13" height="13" viewBox="0 0 13 13" fill="none" className="text-slate-400">
            <circle cx="6.5" cy="6.5" r="5.5" stroke="currentColor" strokeWidth="1.2" />
            <path d="M6.5 3.5V6.5L8.5 8" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
          </svg>
          열린 이슈{' '}
          <span className={`font-bold ${(openIssueCount ?? 0) > 0 ? 'text-orange-500' : 'text-slate-700'}`}>
            {openIssueCount ?? 0}
          </span>
          건
        </div>
        <div className="flex items-center gap-3">
          <Link
            to={`/projects/${projectId}/home`}
            className="flex items-center gap-1 text-xs font-medium text-slate-500 hover:text-slate-800 transition-colors"
          >
            사업 홈
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
              <path d="M2.5 6H9.5M9.5 6L6.5 3M9.5 6L6.5 9" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </Link>
          <Link
            to={`/projects/${projectId}/wbs`}
            className="flex items-center gap-1 text-xs font-medium text-blue-600 hover:text-blue-800 transition-colors"
          >
            WBS/간트
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
              <path d="M2.5 6H9.5M9.5 6L6.5 3M9.5 6L6.5 9" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </Link>
        </div>
      </div>
    </div>
  )
}
