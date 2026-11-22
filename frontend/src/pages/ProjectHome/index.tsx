import { Link, useParams } from 'react-router-dom'
import { useGetHome } from '@/api/generated/project'
import { useListMilestones } from '@/api/generated/milestone'
import { displayDDay, formatDate } from '@/lib/date'
import type { MilestoneResponse } from '@/api/generated/model'

const SIGNAL_STYLE = {
  DANGER:  { dot: 'bg-red-500',     badge: 'bg-red-50 text-red-700 border-red-200',         label: '위험', banner: 'bg-red-50 border-red-200 text-red-800' },
  CAUTION: { dot: 'bg-orange-400',  badge: 'bg-orange-50 text-orange-700 border-orange-200', label: '주의', banner: 'bg-orange-50 border-orange-200 text-orange-800' },
  NORMAL:  { dot: 'bg-emerald-500', badge: 'bg-emerald-50 text-emerald-700 border-emerald-200', label: '정상', banner: '' },
} as const

const EVENT_TYPE_LABEL: Record<string, string> = {
  DECISION: '결정',
  WEEKLY: '주간 업데이트',
  MILESTONE: '마일스톤',
  ISSUE: '이슈',
  CHANGE: '변경',
  KICKOFF: '착수',
  MEETING: '회의',
  SUBMIT: '제출',
}

function MilestoneItem({ milestone }: { milestone: MilestoneResponse }) {
  const isDone = milestone.status === 'DONE'

  return (
    <div className="flex items-start gap-3 py-3">
      <div className={`mt-0.5 w-5 h-5 rounded-full flex items-center justify-center shrink-0 ${
        isDone ? 'bg-emerald-100 text-emerald-600' : 'bg-slate-100 text-slate-500'
      }`}>
        {isDone ? (
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
            <path d="M2 6L5 9L10 3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        ) : (
          <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
            <circle cx="5" cy="5" r="3" stroke="currentColor" strokeWidth="1.5" />
          </svg>
        )}
      </div>

      <div className="flex-1 min-w-0">
        <span className={`text-sm font-medium ${isDone ? 'text-slate-400 line-through' : 'text-slate-800'}`}>
          {milestone.name}
        </span>
        <div className="flex items-center gap-2 mt-0.5">
          <span className="text-xs text-slate-500">
            {isDone
              ? `완료 ${formatDate(milestone.actualDate)}`
              : `계획 ${formatDate(milestone.plannedDate)}`}
          </span>
          {!isDone && milestone.dDay !== undefined && (
            <span className={`text-xs font-bold ${
              (milestone.dDay ?? 0) > 0 ? 'text-red-500' : 'text-blue-600'
            }`}>
              {displayDDay(milestone.dDay ?? 0)}
            </span>
          )}
        </div>
      </div>
    </div>
  )
}

export function ProjectHome() {
  const { projectId: projectIdStr } = useParams<{ projectId: string }>()
  const projectId = Number(projectIdStr)

  const { data: home, isLoading: homeLoading, isError: homeError } = useGetHome(projectId)
  const { data: milestones = [], isLoading: msLoading } = useListMilestones(projectId)

  if (homeLoading || msLoading) {
    return (
      <div className="flex items-center justify-center h-64 text-slate-500 text-sm">
        로딩 중...
      </div>
    )
  }

  if (homeError || !home) {
    return (
      <div className="flex items-center justify-center h-64 text-red-500 text-sm">
        사업 홈 데이터를 불러오지 못했습니다
      </div>
    )
  }

  const signalKey = (home.statusSignal?.status ?? 'NORMAL') as keyof typeof SIGNAL_STYLE
  const signal = SIGNAL_STYLE[signalKey]
  const typeLabel = (home.type ?? 'INTERNAL') === 'GOV' ? '정부' : '사내'
  const showBanner = signalKey === 'CAUTION' || signalKey === 'DANGER'
  const reasons = home.statusSignal?.reasons ?? []
  const recentEvents = (home.recentEvents ?? []).slice(0, 5)

  return (
    <div className="flex flex-col min-h-0">
      {/* 헤더 */}
      <div className="bg-white border-b border-slate-200 px-6 py-4">
        <div className="flex items-center gap-2 text-xs text-slate-500 mb-2">
          <Link to="/dashboard" className="flex items-center gap-1 hover:text-slate-800 transition-colors">
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <path d="M9 11L5 7L9 3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            대시보드
          </Link>
        </div>

        <div className="flex items-center gap-3 flex-wrap">
          <h1 className="text-xl font-bold text-slate-900">{home.name}</h1>

          <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">
            {typeLabel}
          </span>

          {home.phase && (
            <span className="text-xs text-slate-500">{home.phase}</span>
          )}

          <div className="ml-auto flex items-center">
            <span className={`flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full border ${signal.badge}`}>
              <span className={`w-1.5 h-1.5 rounded-full ${signal.dot}`} />
              {signal.label}
            </span>
          </div>
        </div>

        {home.summary && (
          <p className="mt-1.5 text-sm text-slate-500">{home.summary}</p>
        )}
      </div>

      {/* 사유 배너 */}
      {showBanner && reasons.length > 0 && (
        <div className={`px-6 py-3 border-b text-sm ${signal.banner}`}>
          <span className="font-medium">판단 사유: </span>
          {reasons.map((r, i) => (
            <span key={i}>
              {i > 0 && ' · '}
              {r}
            </span>
          ))}
        </div>
      )}

      {/* 메인 콘텐츠 */}
      <div className="flex-1 overflow-y-auto p-6 space-y-6">

        {/* 요약 카드 3열 */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-white rounded-xl border border-slate-200 p-5">
            <p className="text-xs text-slate-500 mb-2">진척률</p>
            <div className="flex items-end gap-2 mb-2">
              <span className="text-2xl font-bold text-slate-900">{home.progress ?? 0}%</span>
            </div>
            <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100">
              <div
                className="h-full rounded-full bg-blue-500 transition-all duration-500"
                style={{ width: `${home.progress ?? 0}%` }}
              />
            </div>
          </div>

          <div className="bg-white rounded-xl border border-slate-200 p-5">
            <p className="text-xs text-slate-500 mb-2">사업 기간</p>
            <p className="text-sm font-medium text-slate-800">
              {formatDate(home.startDate)} ~ {formatDate(home.endDate)}
            </p>
          </div>

          <div className="bg-white rounded-xl border border-slate-200 p-5">
            <p className="text-xs text-slate-500 mb-2">열린 이슈</p>
            <p className={`text-2xl font-bold ${(home.openIssueCount ?? 0) > 0 ? 'text-orange-500' : 'text-slate-900'}`}>
              {home.openIssueCount ?? 0}
              <span className="text-sm font-normal text-slate-500 ml-1">건</span>
            </p>
          </div>
        </div>

        {/* 마일스톤 타임라인 */}
        <div className="bg-white rounded-xl border border-slate-200 p-5">
          <h2 className="text-sm font-semibold text-slate-700 mb-1">마일스톤</h2>
          {milestones.length === 0 ? (
            <p className="text-sm text-slate-400 py-4 text-center">등록된 마일스톤이 없습니다</p>
          ) : (
            <div className="divide-y divide-slate-100">
              {milestones.map((m) => (
                <MilestoneItem key={m.milestoneId} milestone={m} />
              ))}
            </div>
          )}
        </div>

        {/* 최근 동향 */}
        <div className="bg-white rounded-xl border border-slate-200 p-5">
          <h2 className="text-sm font-semibold text-slate-700 mb-1">최근 동향</h2>
          {recentEvents.length === 0 ? (
            <p className="text-sm text-slate-400 py-4 text-center">아직 이벤트가 없습니다</p>
          ) : (
            <ul className="divide-y divide-slate-100">
              {recentEvents.map((e) => (
                <li key={e.eventId} className="py-3 flex items-start gap-3">
                  <span className="shrink-0 mt-0.5 text-xs font-medium px-1.5 py-0.5 rounded bg-slate-100 text-slate-500">
                    {EVENT_TYPE_LABEL[e.type ?? ''] ?? e.type}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-slate-800">{e.summary}</p>
                    <p className="text-xs text-slate-400 mt-0.5">{formatDate(e.eventDate)}</p>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* WBS/간트 바로가기 */}
        <div className="flex justify-end">
          <Link
            to={`/projects/${projectId}/wbs`}
            className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors"
          >
            WBS/간트 보기
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <path d="M3 7H11M11 7L7.5 3.5M11 7L7.5 10.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </Link>
        </div>
      </div>
    </div>
  )
}
