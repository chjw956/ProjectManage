import { useEffect, useId } from 'react'
import { useListIssues } from '@/api/generated/issue'
import type { IssueResponse } from '@/api/generated/model'
import { formatDate } from '@/lib/date'

const GRADE_STYLE: Record<string, { label: string; className: string }> = {
  HIGH: { label: '상', className: 'bg-red-50 text-red-700 border-red-200' },
  MID: { label: '중', className: 'bg-orange-50 text-orange-700 border-orange-200' },
  LOW: { label: '하', className: 'bg-slate-50 text-slate-600 border-slate-200' },
}

const STATUS_LABEL: Record<string, string> = {
  OPEN: '미착수',
  IN_PROGRESS: '진행중',
}

interface OpenIssuesModalProps {
  projectId: number
  projectName?: string
  onClose: () => void
}

/** 사업의 열린 이슈(CLOSED 제외) 조회 모달. 대시보드 카드·사업 홈에서 공용으로 쓴다. */
export function OpenIssuesModal({ projectId, projectName, onClose }: OpenIssuesModalProps) {
  const titleId = useId()
  const { data, isLoading, isError } = useListIssues(projectId, { status: 'open' })

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [onClose])

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className="flex max-h-[80vh] w-full max-w-2xl flex-col rounded-lg bg-white shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-4 border-b border-slate-100 px-6 py-4">
          <div>
            <h2 id={titleId} className="text-base font-semibold text-slate-900">
              열린 이슈{data ? ` ${data.length}건` : ''}
            </h2>
            {projectName && <p className="mt-0.5 text-xs text-slate-500">{projectName}</p>}
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="닫기"
            className="rounded p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
              <path d="M4 4L12 12M12 4L4 12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
          </button>
        </div>

        <div className="overflow-y-auto px-6 py-4">
          {isLoading && (
            <div className="space-y-3" data-testid="issues-loading">
              {[1, 2].map((i) => (
                <div key={i} className="h-20 animate-pulse rounded-lg bg-slate-100" />
              ))}
            </div>
          )}

          {isError && (
            <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
              이슈 목록을 불러오지 못했습니다. 잠시 후 다시 시도해 주세요.
            </div>
          )}

          {data && data.length === 0 && (
            <p className="py-10 text-center text-sm text-slate-400">열린 이슈가 없습니다.</p>
          )}

          {data && data.length > 0 && (
            <ul className="space-y-3">
              {data.map((issue) => (
                <IssueItem key={issue.issueId} issue={issue} />
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  )
}

function IssueItem({ issue }: { issue: IssueResponse }) {
  const grade = GRADE_STYLE[issue.grade ?? ''] ?? { label: issue.grade ?? '—', className: GRADE_STYLE.LOW.className }

  return (
    <li className="rounded-lg border border-slate-200 p-4">
      <div className="flex items-start gap-2">
        <span
          className={`shrink-0 rounded-full border px-2 py-0.5 text-xs font-medium ${grade.className}`}
        >
          등급 {grade.label}
        </span>
        <p className="flex-1 text-sm font-medium text-slate-900">{issue.title}</p>
        <span className="shrink-0 rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-600">
          {STATUS_LABEL[issue.status ?? ''] ?? issue.status}
        </span>
      </div>

      <dl className="mt-3 grid grid-cols-3 gap-2 text-xs">
        <div>
          <dt className="text-slate-400">담당자</dt>
          <dd className="text-slate-700">{issue.assignee || '—'}</dd>
        </div>
        <div>
          <dt className="text-slate-400">발생일</dt>
          <dd className="text-slate-700">{formatDate(issue.occurredAt)}</dd>
        </div>
        <div>
          <dt className="text-slate-400">목표일</dt>
          <dd className={issue.overdue ? 'font-medium text-red-600' : 'text-slate-700'}>
            {formatDate(issue.targetDate)}
            {issue.overdue && (
              <span className="ml-1 rounded bg-red-50 px-1 py-0.5 text-[11px] text-red-600">기한 초과</span>
            )}
          </dd>
        </div>
      </dl>

      {issue.response && (
        <p className="mt-3 rounded bg-slate-50 px-3 py-2 text-xs text-slate-600">
          <span className="font-medium text-slate-500">대응 방안 </span>
          {issue.response}
        </p>
      )}
    </li>
  )
}
