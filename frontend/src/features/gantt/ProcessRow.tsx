import { useState } from 'react'
import { Badge } from '@/components/Badge'
import { WEEK_COL_WIDTH_PX } from '@/lib/constants'
import { formatDate } from '@/lib/date'
import type { GanttProcessRow } from '@/api/generated/model'
import { GanttBar } from './GanttBar'
import { TaskRow } from './TaskRow'
import { WbsItemDetailModal } from './WbsItemDetailModal'

interface ProcessRowProps {
  process: GanttProcessRow
  projectId: number
  rangeStart: string
  scale: 'week' | 'fit'
  ticks: string[]
  totalWidth: number | undefined
  todayOffset: number
  leftW: number
  isLast?: boolean
  defaultExpanded?: boolean
}

export function ProcessRow({
  process, projectId, rangeStart, scale, ticks, totalWidth, todayOffset, leftW, isLast, defaultExpanded = true,
}: ProcessRowProps) {
  const [expanded, setExpanded] = useState(defaultExpanded)
  const [showDetail, setShowDetail] = useState(false)
  const subtasks = process.subtasks ?? []

  return (
    <>
      {/* 공정 행 */}
      <div className={`flex border-b ${isLast && !expanded ? 'border-slate-200' : 'border-slate-200'} bg-slate-50 hover:bg-slate-100 group`}>
        {/* 왼쪽 고정 셀 — sticky */}
        <div
          className="flex shrink-0 items-center sticky left-0 z-10 bg-slate-50 group-hover:bg-slate-100 border-r border-slate-200"
          style={{ width: leftW }}
        >
          <div className="flex w-52 items-center gap-2 px-4 py-0 h-11">
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
              onClick={() => setShowDetail(true)}
              title={`${process.name} 상세 보기`}
              className="truncate text-left text-sm font-semibold text-slate-800 cursor-pointer hover:text-blue-700 hover:underline"
            >
              {process.name}
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
        <TimelineCell scale={scale} ticks={ticks} totalWidth={totalWidth} todayOffset={todayOffset} isProcess>
          <GanttBar
            plannedStart={process.plannedStart ?? null}
            plannedEnd={process.plannedEnd ?? null}
            actualStart={null}
            actualEnd={null}
            delayed={false}
            rangeStart={rangeStart}
            isProcess
          />
        </TimelineCell>
      </div>

      {showDetail && (
        <WbsItemDetailModal kind="process" process={process} onClose={() => setShowDetail(false)} />
      )}

      {/* 세부 Task */}
      {expanded && subtasks.map((task, idx) => (
        <TaskRow
          key={task.taskId}
          task={task}
          processName={process.name}
          projectId={projectId}
          rangeStart={rangeStart}
          scale={scale}
          ticks={ticks}
          totalWidth={totalWidth}
          todayOffset={todayOffset}
          leftW={leftW}
          isLastInGroup={idx === subtasks.length - 1}
        />
      ))}
    </>
  )
}

/** 타임라인 배경 그리드 셀 (공통) */
export function TimelineCell({
  scale, ticks, totalWidth, todayOffset, isProcess, children,
}: {
  scale: 'week' | 'fit'
  ticks: string[]
  totalWidth: number | undefined
  todayOffset: number
  isProcess?: boolean
  children: React.ReactNode
}) {
  return (
    <div
      className="relative flex-1"
      style={totalWidth ? { width: totalWidth, flexShrink: 0 } : {}}
    >
      {/* 그리드 세로선 */}
      <div className={`absolute inset-0 flex pointer-events-none ${scale === 'fit' ? '' : ''}`}>
        {ticks.map((tick) => (
          <div
            key={tick}
            className={`border-r border-slate-100 ${isProcess ? 'bg-slate-50' : 'bg-white'} ${scale === 'fit' ? 'flex-1' : ''}`}
            style={scale === 'week' ? { width: WEEK_COL_WIDTH_PX, flexShrink: 0 } : {}}
          />
        ))}
      </div>

      {/* 오늘 기준선 */}
      <div
        data-testid="today-line"
        className="pointer-events-none absolute top-0 bottom-0 w-px bg-red-400 z-10"
        style={
          scale === 'week'
            ? { left: todayOffset }
            : totalWidth
              ? { left: `${(todayOffset / totalWidth) * 100}%` }
              : { display: 'none' }
        }
      />

      {/* 실제 콘텐츠 (막대) */}
      <div className="relative h-full z-10">{children}</div>
    </div>
  )
}
