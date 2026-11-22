import type { GanttResponse, MilestoneResponse } from '@/api/generated/model'
import { WEEK_COL_WIDTH_PX } from '@/lib/constants'
import { MilestoneBar } from './MilestoneBar'
import { ProcessRow } from './ProcessRow'
import { buildTimeline, datePct, tickLabel, todayIso, type GanttLayout } from './gantt-utils'

const LEFT_W = 480 // 왼쪽 고정 패널 너비 (px)

interface GanttViewProps {
  gantt: GanttResponse
  milestones: MilestoneResponse[]
  projectId: number
  /** fit = 기간 축소(화면 폭에 맞춤, 가로 스크롤 없음), week = 주 단위(1주 = WEEK_COL_WIDTH_PX) */
  scale: 'week' | 'fit'
  /** 공정 ID → 필터와 무관한 전체 세부 Task 수 */
  subtaskCounts?: Record<number, number>
}

export function GanttView({ gantt, milestones, projectId, scale, subtaskCounts }: GanttViewProps) {
  const processes = gantt.processes ?? []
  const timeline = buildTimeline(
    processes.flatMap((p) => [
      p.plannedStart,
      p.plannedEnd,
      ...(p.subtasks ?? []).flatMap((t) => [t.plannedStart, t.plannedEnd, t.actualStart, t.actualEnd]),
    ]),
  )
  const isWeek = scale === 'week'
  const layout: GanttLayout = {
    timeline,
    widthPx: isWeek ? timeline.ticks.length * WEEK_COL_WIDTH_PX : undefined,
    todayPct: datePct(todayIso(), timeline),
  }

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

      {/* 본문 — 단일 스크롤 컨테이너 (헤더도 안에 두어 가로 스크롤을 함께 따라간다) */}
      <div data-testid="gantt-scroll" className="flex-1 overflow-auto">
        <div
          className={isWeek ? '' : 'min-w-full'}
          style={layout.widthPx ? { width: LEFT_W + layout.widthPx } : undefined}
        >
          {/* 헤더 행 — 위쪽 고정. 왼쪽 칸은 가로 스크롤 시에도 고정 */}
          <div className="sticky top-0 z-30 flex border-b border-slate-300 bg-slate-50 text-xs font-semibold text-slate-600 uppercase tracking-wide">
            <div
              className="sticky left-0 z-10 flex shrink-0 items-center border-r border-slate-200 bg-slate-50"
              style={{ width: LEFT_W }}
            >
              <div className="w-52 px-4 py-2.5">공정 / Task</div>
              <div className="w-24 px-2 py-2.5">부서</div>
              <div className="w-20 px-2 py-2.5">담당자</div>
              <div className="w-20 px-2 py-2.5">상태</div>
              <div className="w-16 px-2 py-2.5 text-right">진행률</div>
            </div>

            {/* 타임라인 눈금 — 기간 축소에서는 월 라벨만 표시 */}
            <div
              data-testid="gantt-header-ticks"
              className={`flex ${layout.widthPx ? 'shrink-0' : 'min-w-0 flex-1'}`}
              style={layout.widthPx ? { width: layout.widthPx } : undefined}
            >
              {timeline.ticks.map((tick, i) => {
                const label = tickLabel(timeline.ticks, i, isWeek)
                return (
                  <div
                    key={tick}
                    title={tick}
                    className="min-w-0 flex-1 basis-0 overflow-visible whitespace-nowrap border-r border-slate-200 py-2.5 pl-1 font-normal normal-case"
                  >
                    {label && (
                      <span className={`relative bg-slate-50 pr-1 ${label.isMonth ? 'font-semibold text-slate-600' : 'text-slate-400'}`}>
                        {label.text}
                      </span>
                    )}
                  </div>
                )
              })}
            </div>
          </div>

          {processes.map((process, idx) => (
            <ProcessRow
              key={process.taskId}
              process={process}
              projectId={projectId}
              layout={layout}
              leftW={LEFT_W}
              isLast={idx === processes.length - 1}
              totalSubtaskCount={process.taskId != null ? subtaskCounts?.[process.taskId] : undefined}
            />
          ))}
        </div>
      </div>
    </div>
  )
}
