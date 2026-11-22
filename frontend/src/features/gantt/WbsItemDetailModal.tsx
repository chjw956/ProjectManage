import { Badge } from '@/components/Badge'
import { Modal, dangerButtonClass, primaryButtonClass, secondaryButtonClass } from '@/components/Modal'
import type { GanttProcessRow, GanttTaskRow } from '@/api/generated/model'
import { formatDate } from '@/lib/date'
import { formatMillions } from '@/lib/money'

type WbsItemDetailModalProps = {
  onClose: () => void
  onEdit: () => void
  onDelete: () => void
} & (
  | { kind: 'task'; task: GanttTaskRow; processName?: string; onChangeSchedule: () => void }
  /** subtaskCount: 검색·필터와 무관한 전체 세부 Task 수 */
  | { kind: 'process'; process: GanttProcessRow; subtaskCount: number }
)

/** 공정·세부 Task 상세 보기. 값은 간트 응답을 그대로 표시하고, 수정·삭제·일정 변경 창으로 이어준다. */
export function WbsItemDetailModal(props: WbsItemDetailModalProps) {
  const isTask = props.kind === 'task'
  const item = isTask ? props.task : props.process

  return (
    <Modal
      title={item.name}
      subtitle={isTask ? `세부 Task${props.processName ? ` · ${props.processName}` : ''}` : '공정'}
      onClose={props.onClose}
      footer={
        <>
          <button type="button" onClick={props.onDelete} className={`${dangerButtonClass} mr-auto`}>
            삭제
          </button>
          <button type="button" onClick={props.onEdit} className={secondaryButtonClass}>
            정보 수정
          </button>
          {isTask && (
            <button type="button" onClick={props.onChangeSchedule} className={primaryButtonClass}>
              일정 변경
            </button>
          )}
        </>
      }
    >
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
            <Field label="세부 Task">{props.subtaskCount}건</Field>
            <Field label="공사 여부">{props.process.work ? '공사' : '비공사'}</Field>
            <Field label="금액">{formatMillions(props.process.amount)}</Field>
          </>
        )}
      </dl>
    </Modal>
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
