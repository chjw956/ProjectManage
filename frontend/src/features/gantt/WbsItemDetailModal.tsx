import { useEffect, useId } from 'react'
import { Badge } from '@/components/Badge'
import type { GanttProcessRow, GanttTaskRow } from '@/api/generated/model'
import { formatDate } from '@/lib/date'
import { formatMillions } from '@/lib/money'

type WbsItemDetailModalProps = {
  onClose: () => void
} & (
  | { kind: 'task'; task: GanttTaskRow; processName?: string; onChangeSchedule: () => void }
  | { kind: 'process'; process: GanttProcessRow }
)

/** 공정·세부 Task 상세 보기 (조회 전용). 값은 간트 응답을 그대로 표시한다. */
export function WbsItemDetailModal(props: WbsItemDetailModalProps) {
  const { onClose } = props
  const titleId = useId()

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [onClose])

  const isTask = props.kind === 'task'
  const item = isTask ? props.task : props.process

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={onClose}>
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className="w-full max-w-lg rounded-lg bg-white shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-4 border-b border-slate-100 px-6 py-4">
          <div className="min-w-0">
            <p className="text-xs text-slate-500">
              {isTask ? `세부 Task${props.processName ? ` · ${props.processName}` : ''}` : '공정'}
            </p>
            <h2 id={titleId} className="mt-0.5 text-base font-semibold text-slate-900 break-words">
              {item.name}
            </h2>
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

        <dl className="grid grid-cols-2 gap-x-6 gap-y-4 px-6 py-5 text-sm">
          <Field label="상태">
            <Badge status={item.status ?? 'PENDING'} delayed={isTask && (props.task.delayed ?? false)} />
          </Field>
          <Field label="진행률">
            <div className="flex items-center gap-2">
              <div className="h-1.5 w-24 overflow-hidden rounded-full bg-slate-100">
                <div className="h-full rounded-full bg-blue-500" style={{ width: `${item.progress ?? 0}%` }} />
              </div>
              <span className="text-slate-700">{item.progress ?? 0}%</span>
            </div>
          </Field>
          <Field label="담당 부서">{item.dept || '—'}</Field>
          <Field label="담당자">{item.assignee || '—'}</Field>
          <Field label="계획 기간">
            {formatDate(item.plannedStart)} ~ {formatDate(item.plannedEnd)}
          </Field>

          {isTask ? (
            <Field label="실제 기간">
              {props.task.actualStart
                ? `${formatDate(props.task.actualStart)} ~ ${props.task.actualEnd ? formatDate(props.task.actualEnd) : '진행 중'}`
                : '미착수'}
            </Field>
          ) : (
            <>
              <Field label="세부 Task">{props.process.subtasks?.length ?? 0}건</Field>
              <Field label="공사 여부">{props.process.work ? '공사' : '비공사'}</Field>
              <Field label="금액">{formatMillions(props.process.amount)}</Field>
            </>
          )}
        </dl>

        {isTask && (
          <div className="flex justify-end border-t border-slate-100 px-6 py-4">
            <button
              type="button"
              onClick={props.onChangeSchedule}
              className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
            >
              일정 변경
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <dt className="text-xs text-slate-400">{label}</dt>
      <dd className="mt-1 text-slate-800">{children}</dd>
    </div>
  )
}
