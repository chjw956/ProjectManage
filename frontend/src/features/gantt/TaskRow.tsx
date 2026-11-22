import { useState } from 'react'
import { Badge } from '@/components/Badge'
import type { GanttTaskRow } from '@/api/generated/model'
import { GanttBar } from './GanttBar'
import { ChangeScheduleModal } from './ChangeScheduleModal'
import { WbsItemDetailModal } from './WbsItemDetailModal'
import { TimelineCell } from './ProcessRow'

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
  const [showModal, setShowModal] = useState(false)
  const [showDetail, setShowDetail] = useState(false)
  const delayed = task.delayed ?? false

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
              onClick={() => setShowDetail(true)}
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
          <div data-testid="gantt-bar-area" className="cursor-pointer h-full" onClick={() => setShowModal(true)}>
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

      {showDetail && (
        <WbsItemDetailModal
          kind="task"
          task={task}
          processName={processName}
          onClose={() => setShowDetail(false)}
          onChangeSchedule={() => {
            setShowDetail(false)
            setShowModal(true)
          }}
        />
      )}

      {showModal && (
        <ChangeScheduleModal
          projectId={projectId}
          taskId={task.taskId ?? 0}
          initialStart={task.plannedStart ?? null}
          initialEnd={task.plannedEnd ?? null}
          onClose={() => setShowModal(false)}
        />
      )}
    </>
  )
}
