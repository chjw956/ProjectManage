import { useState } from 'react'
import { useDeleteTask } from '@/api/generated/task'
import { Badge } from '@/components/Badge'
import type { GanttTaskRow } from '@/api/generated/model'
import { GanttBar } from './GanttBar'
import { ChangeScheduleModal } from './ChangeScheduleModal'
import { WbsItemDetailModal } from './WbsItemDetailModal'
import { TimelineCell } from './ProcessRow'
import { TaskFormModal } from './TaskFormModal'
import { DeleteConfirmModal } from './DeleteConfirmModal'
import { useInvalidateWbs } from './useInvalidateWbs'
import { formatDate } from '@/lib/date'

interface TaskRowProps {
  task: GanttTaskRow
  processName?: string
  projectId: number
  rangeStart: string
  scale: 'week' | 'fit'
  ticks: string[]
  totalWidth: number | undefined
  todayOffset: number
  leftW: number
  isLastInGroup?: boolean
}

export function TaskRow({ task, processName, projectId, rangeStart, scale, ticks, totalWidth, todayOffset, leftW, isLastInGroup }: TaskRowProps) {
  const [modal, setModal] = useState<null | 'detail' | 'edit' | 'delete' | 'schedule'>(null)
  const close = () => setModal(null)
  const delayed = task.delayed ?? false
  const taskId = task.taskId ?? 0

  const invalidate = useInvalidateWbs(projectId)
  const deleteTask = useDeleteTask({
    mutation: {
      onSuccess: async () => {
        await invalidate()
        close()
      },
    },
  })

  return (
    <>
      <div className={`flex border-b ${isLastInGroup ? 'border-slate-200' : 'border-slate-100'} hover:bg-blue-50 group`}>
        {/* 왼쪽 고정 셀 — sticky */}
        <div
          className="flex shrink-0 items-center sticky left-0 z-10 bg-white group-hover:bg-blue-50 border-r border-slate-200"
          style={{ width: leftW }}
        >
          <div className="flex w-52 items-center gap-1.5 px-4 py-0 h-11 pl-10">
            {delayed && (
              <span className="shrink-0 w-1.5 h-1.5 rounded-full bg-red-400" title="지연" />
            )}
            <button
              type="button"
              onClick={() => setModal('detail')}
              title={`${task.name} 상세 보기`}
              className={`truncate text-left text-sm cursor-pointer hover:underline ${delayed ? 'text-red-700' : 'text-slate-700 hover:text-blue-700'}`}
            >
              {task.name}
            </button>
          </div>
          <div className="w-24 px-2 text-xs text-slate-500 truncate">{task.dept || '—'}</div>
          <div className="w-20 px-2 text-xs text-slate-500 truncate">{task.assignee || '—'}</div>
          <div className="w-20 px-2">
            <Badge status={task.status ?? 'PENDING'} delayed={delayed} />
          </div>
          <div className="w-16 px-2 text-right">
            <span className={`text-xs font-medium ${delayed ? 'text-red-600' : 'text-slate-600'}`}>
              {task.progress ?? 0}%
            </span>
          </div>
        </div>

        {/* 오른쪽 간트 셀 */}
        <TimelineCell
          scale={scale}
          ticks={ticks}
          totalWidth={totalWidth}
          todayOffset={todayOffset}
        >
          <div data-testid="gantt-bar-area" className="cursor-pointer h-full" onClick={() => setModal('schedule')}>
            <GanttBar
              plannedStart={task.plannedStart ?? null}
              plannedEnd={task.plannedEnd ?? null}
              actualStart={task.actualStart ?? null}
              actualEnd={task.actualEnd ?? null}
              delayed={delayed}
              rangeStart={rangeStart}
            />
          </div>
        </TimelineCell>
      </div>

      {modal === 'detail' && (
        <WbsItemDetailModal
          kind="task"
          task={task}
          processName={processName}
          onClose={close}
          onChangeSchedule={() => setModal('schedule')}
          onEdit={() => setModal('edit')}
          onDelete={() => setModal('delete')}
        />
      )}

      {modal === 'edit' && (
        <TaskFormModal
          projectId={projectId}
          mode={{ type: 'edit', kind: 'task', target: { taskId, name: task.name ?? '', dept: task.dept, assignee: task.assignee } }}
          onClose={close}
        />
      )}

      {modal === 'delete' && (
        <DeleteConfirmModal
          title="세부 Task 삭제"
          targetName={task.name ?? ''}
          details={<>{processName && `${processName} · `}계획 {formatDate(task.plannedStart)} ~ {formatDate(task.plannedEnd)}</>}
          isPending={deleteTask.isPending}
          error={deleteTask.error}
          onConfirm={(reason) => deleteTask.mutate({ projectId, taskId, data: { reason } })}
          onClose={close}
        />
      )}

      {modal === 'schedule' && (
        <ChangeScheduleModal
          projectId={projectId}
          taskId={taskId}
          initialStart={task.plannedStart ?? null}
          initialEnd={task.plannedEnd ?? null}
          onClose={close}
        />
      )}
    </>
  )
}
