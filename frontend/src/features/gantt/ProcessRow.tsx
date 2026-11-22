import { useState } from 'react'
import { useDeleteTask } from '@/api/generated/task'
import { Badge } from '@/components/Badge'
import { formatDate } from '@/lib/date'
import type { GanttProcessRow } from '@/api/generated/model'
import { GanttBar } from './GanttBar'
import type { GanttLayout } from './gantt-utils'
import { TaskRow } from './TaskRow'
import { WbsItemDetailModal } from './WbsItemDetailModal'
import { TaskFormModal } from './TaskFormModal'
import { DeleteConfirmModal } from './DeleteConfirmModal'
import { useInvalidateWbs } from './useInvalidateWbs'

interface ProcessRowProps {
  process: GanttProcessRow
  projectId: number
  layout: GanttLayout
  leftW: number
  isLast?: boolean
  defaultExpanded?: boolean
  /** 검색·필터와 무관한 전체 세부 Task 수 (상세·삭제 경고용). 없으면 표시 중인 수 */
  totalSubtaskCount?: number
}

export function ProcessRow({
  process, projectId, layout, leftW, isLast, defaultExpanded = true,
  totalSubtaskCount,
}: ProcessRowProps) {
  const [expanded, setExpanded] = useState(defaultExpanded)
  const [modal, setModal] = useState<null | 'detail' | 'edit' | 'delete' | 'add-task'>(null)
  const close = () => setModal(null)
  const subtasks = process.subtasks ?? []
  const subtaskCount = totalSubtaskCount ?? subtasks.length
  const processId = process.taskId ?? 0

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
      {/* 공정 행 */}
      <div className={`flex border-b ${isLast && !expanded ? 'border-slate-200' : 'border-slate-200'} bg-slate-50 hover:bg-slate-100 group`}>
        {/* 왼쪽 고정 셀 — sticky */}
        <div
          className="flex shrink-0 items-center sticky left-0 z-20 bg-slate-50 group-hover:bg-slate-100 border-r border-slate-200"
          style={{ width: leftW }}
        >
          <div className="relative flex w-52 items-center gap-2 px-4 py-0 h-11">
            <button
              type="button"
              onClick={() => setExpanded((p) => !p)}
              className="shrink-0 w-5 h-5 rounded flex items-center justify-center text-slate-400 hover:text-slate-700 hover:bg-slate-200 transition-colors"
              aria-label={expanded ? '접기' : '펼치기'}
            >
              <svg
                width="10" height="10" viewBox="0 0 10 10" fill="currentColor"
                className={`transition-transform duration-150 ${expanded ? 'rotate-90' : ''}`}
              >
                <path d="M3 2l4 3-4 3V2z" />
              </svg>
            </button>
            <button
              type="button"
              onClick={() => setModal('detail')}
              title={`${process.name} 상세 보기`}
              className="min-w-0 flex-1 truncate text-left text-sm font-semibold text-slate-800 cursor-pointer hover:text-blue-700 hover:underline"
            >
              {process.name}
            </button>
            <button
              type="button"
              onClick={() => setModal('add-task')}
              aria-label={`${process.name}에 작업 추가`}
              title="세부 Task 추가"
              className="absolute right-1 top-1/2 -translate-y-1/2 rounded border border-blue-200 bg-white px-1.5 py-0.5 text-xs font-medium text-blue-600 opacity-0 shadow-sm hover:bg-blue-50 focus:opacity-100 group-hover:opacity-100"
            >
              + 작업
            </button>
          </div>
          {/* 담당 부서 — 공정 행은 비워둠 (기간 정보로 대체) */}
          <div className="w-24 px-2 text-xs text-slate-500 truncate">
            {formatDate(process.plannedStart)}~
          </div>
          <div className="w-20 px-2 text-xs text-slate-500 truncate">{process.assignee || '—'}</div>
          <div className="w-20 px-2">
            <Badge status={process.status ?? 'PENDING'} />
          </div>
          <div className="w-16 px-2 text-right">
            <span className="text-xs font-semibold text-slate-700">{process.progress ?? 0}%</span>
          </div>
        </div>

        {/* 오른쪽 간트 셀 */}
        <TimelineCell layout={layout} isProcess>
          <GanttBar
            plannedStart={process.plannedStart ?? null}
            plannedEnd={process.plannedEnd ?? null}
            actualStart={null}
            actualEnd={null}
            delayed={false}
            timeline={layout.timeline}
            isProcess
          />
        </TimelineCell>
      </div>

      {modal === 'detail' && (
        <WbsItemDetailModal
          kind="process"
          process={process}
          subtaskCount={subtaskCount}
          onClose={close}
          onEdit={() => setModal('edit')}
          onDelete={() => setModal('delete')}
        />
      )}

      {modal === 'add-task' && (
        <TaskFormModal
          projectId={projectId}
          mode={{ type: 'create-subtask', parentId: processId, parentName: process.name ?? '' }}
          onClose={close}
        />
      )}

      {modal === 'edit' && (
        <TaskFormModal
          projectId={projectId}
          mode={{ type: 'edit', kind: 'process', target: { taskId: processId, name: process.name ?? '', dept: process.dept, assignee: process.assignee } }}
          onClose={close}
        />
      )}

      {modal === 'delete' && (
        <DeleteConfirmModal
          title="공정 삭제"
          targetName={process.name ?? ''}
          details={<>계획 {formatDate(process.plannedStart)} ~ {formatDate(process.plannedEnd)}</>}
          warning={subtaskCount > 0 ? `하위 세부 Task ${subtaskCount}건도 함께 삭제됩니다.` : undefined}
          isPending={deleteTask.isPending}
          error={deleteTask.error}
          onConfirm={(reason) => deleteTask.mutate({ projectId, taskId: processId, data: { reason } })}
          onClose={close}
        />
      )}

      {/* 세부 Task */}
      {expanded && subtasks.map((task, idx) => (
        <TaskRow
          key={task.taskId}
          task={task}
          processName={process.name}
          projectId={projectId}
          layout={layout}
          leftW={leftW}
          isLastInGroup={idx === subtasks.length - 1}
        />
      ))}
    </>
  )
}

/**
 * 타임라인 배경 그리드 셀 (공통).
 * isolate로 쌓임 맥락을 따로 만들어, 내부 막대·오늘선이 왼쪽 고정(sticky) 칸 위로 그려지지 않게 한다.
 */
export function TimelineCell({
  layout, isProcess, children,
}: {
  layout: GanttLayout
  isProcess?: boolean
  children: React.ReactNode
}) {
  const { timeline, widthPx, todayPct } = layout
  const showToday = todayPct >= 0 && todayPct <= 100

  return (
    <div
      data-testid="timeline-cell"
      className={`relative isolate ${widthPx ? 'shrink-0' : 'min-w-0 flex-1'}`}
      style={widthPx ? { width: widthPx } : undefined}
    >
      {/* 그리드 세로선 (열 i = 눈금 i부터 7일) */}
      <div className="pointer-events-none absolute inset-0 flex">
        {timeline.ticks.map((tick) => (
          <div
            key={tick}
            className={`min-w-0 flex-1 basis-0 border-r border-slate-100 ${isProcess ? 'bg-slate-50' : 'bg-white'}`}
          />
        ))}
      </div>

      {/* 오늘 기준선 */}
      {showToday && (
        <div
          data-testid="today-line"
          className="pointer-events-none absolute top-0 bottom-0 z-10 w-px bg-red-400"
          style={{ left: `${todayPct}%` }}
        />
      )}

      {/* 막대 */}
      <div className="relative h-full">{children}</div>
    </div>
  )
}
