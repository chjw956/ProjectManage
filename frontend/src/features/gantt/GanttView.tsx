import type { GanttResponse, MilestoneResponse } from '@/api/generated/model'
import { WEEK_COL_WIDTH_PX } from '@/lib/constants'
import { formatGanttTick } from '@/lib/date'
import { MilestoneBar } from './MilestoneBar'
import { ProcessRow } from './ProcessRow'
import { buildWeekTicks, calcTimelineRange, dateToOffset } from './gantt-utils'

const TODAY_ISO = new Date().toISOString().slice(0, 10)

const LEFT_W = 480 // 왼쪽 고정 패널 너비 (px)

interface GanttViewProps {
  gantt: GanttResponse
  milestones: MilestoneResponse[]
  projectId: number
  scale: 'week' | 'fit'
}

export function GanttView({ gantt, milestones, projectId, scale }: GanttViewProps) {
  const processes = gantt.processes ?? []
  const allDates: (string | null)[] = processes.flatMap((p) => [
    p.plannedStart ?? null,
    p.plannedEnd ?? null,
    ...(p.subtasks ?? []).flatMap((t) => [
      t.plannedStart ?? null,
      t.plannedEnd ?? null,
      t.actualStart ?? null,
      t.actualEnd ?? null,
    ]),
  ])
  const { start: rangeStart, end: rangeEnd } = calcTimelineRange(allDates)
  const ticks = buildWeekTicks(rangeStart, rangeEnd)
  const totalWidth = scale === 'week' ? ticks.length * WEEK_COL_WIDTH_PX : undefined
  const todayOffset = dateToOffset(TODAY_ISO, rangeStart)

  return (
    <div className="flex flex-col flex-1 overflow-hidden">
      {/* 마일스톤 칩 바 */}
      <MilestoneBar milestones={milestones} />

      {/* 범례 */}
      <div className="flex items-center gap-4 px-4 py-2 text-xs text-slate-500 border-b border-slate-200 bg-white">
        <span className="flex items-center gap-1.5">
          <span className="inline-block h-3 w-6 rounded border-2 border-blue-400 bg-blue-50" />
          계획
        </span>
        <span className="flex items-center gap-1.5">
          <span className="inline-block h-3 w-6 rounded bg-blue-500" />
          실제
        </span>
        <span className="flex items-center gap-1.5">
          <span className="inline-block h-3 w-6 rounded bg-red-400" />
          지연
        </span>
        <span className="flex items-center gap-1.5">
          <span className="inline-block h-3 w-0.5 bg-red-500" />
          오늘
        </span>
      </div>

      {/* 헤더 행 — sticky */}
      <div className="flex border-b border-slate-300 bg-slate-50 sticky top-0 z-20 text-xs font-semibold text-slate-600 uppercase tracking-wide">
        {/* 왼쪽 고정 헤더 */}
        <div
          className="flex shrink-0 items-center border-r border-slate-200 bg-slate-50"
          style={{ width: LEFT_W }}
        >
          <div className="w-52 px-4 py-2.5">공정 / Task</div>
          <div className="w-24 px-2 py-2.5">부서</div>
          <div className="w-20 px-2 py-2.5">담당자</div>
          <div className="w-20 px-2 py-2.5">상태</div>
          <div className="w-16 px-2 py-2.5 text-right">진행률</div>
        </div>

        {/* 타임라인 헤더 */}
        <div className="flex-1 overflow-hidden">
          <div
            className="relative flex h-full"
            style={totalWidth ? { width: totalWidth } : { display: 'flex' }}
          >
            {ticks.map((tick, i) => (
              <div
                key={tick}
                className={`border-r border-slate-200 py-2.5 text-center ${scale === 'week' ? '' : 'flex-1'}`}
                style={scale === 'week' ? { width: WEEK_COL_WIDTH_PX, flexShrink: 0 } : {}}
              >
                {/* 월 경계에 월 표기 */}
                {i === 0 || tick.slice(5, 7) !== ticks[i - 1]?.slice(5, 7)
                  ? <span className="text-slate-500">{tick.slice(2, 4)}.{tick.slice(5, 7)}</span>
                  : <span className="text-slate-400">{formatGanttTick(tick)}</span>
                }
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 본문 — 단일 스크롤 컨테이너 */}
      <div className="flex-1 overflow-auto">
        <div style={totalWidth ? { minWidth: LEFT_W + totalWidth } : {}}>
          {processes.map((process, idx) => (
            <ProcessRow
              key={process.taskId}
              process={process}
              projectId={projectId}
              rangeStart={rangeStart}
              scale={scale}
              ticks={ticks}
              totalWidth={totalWidth}
              todayOffset={todayOffset}
              leftW={LEFT_W}
              isLast={idx === processes.length - 1}
            />
          ))}
        </div>
      </div>
    </div>
  )
}
