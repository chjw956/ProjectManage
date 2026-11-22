import { datePct, spanPct, todayIso, type Timeline } from './gantt-utils'

interface GanttBarProps {
  plannedStart: string | null
  plannedEnd: string | null
  actualStart: string | null
  actualEnd: string | null
  delayed: boolean
  timeline: Timeline
  isProcess?: boolean
}

const ROW_H = 44  // px (h-11)
const MIN_BAR_PX = 3

/** 계획(테두리)·실제(채움) 막대. 위치·너비는 타임라인 대비 %로 그려 주 단위·기간 축소 모두 같은 기준을 쓴다. */
export function GanttBar({
  plannedStart, plannedEnd, actualStart, actualEnd, delayed, timeline, isProcess,
}: GanttBarProps) {
  if (!plannedStart || !plannedEnd) return null

  const planned = { left: `${datePct(plannedStart, timeline)}%`, width: `${spanPct(plannedStart, plannedEnd, timeline)}%` }

  // 공정 행: 얇은 요약 막대만
  if (isProcess) {
    return (
      <div className="relative w-full h-full flex items-center">
        <div
          data-testid="process-bar"
          className="absolute h-1.5 rounded-full bg-slate-300"
          style={{ ...planned, minWidth: MIN_BAR_PX }}
        />
      </div>
    )
  }

  // 실제 막대 — actualEnd 없으면 오늘까지
  const actual = actualStart
    ? {
        left: `${datePct(actualStart, timeline)}%`,
        width: `${spanPct(actualStart, actualEnd ?? todayIso(), timeline)}%`,
      }
    : null

  const planTop = Math.round(ROW_H / 2) - 12
  const actualTop = Math.round(ROW_H / 2) + 1
  const barH = 9
  const actualColor = delayed ? 'bg-red-400' : 'bg-blue-500'

  return (
    <div className="relative w-full" style={{ height: ROW_H }}>
      <div
        data-testid="planned-bar"
        className="absolute rounded border-2 border-blue-400 bg-blue-50"
        style={{ ...planned, minWidth: MIN_BAR_PX, top: planTop, height: barH }}
      />
      {actual && (
        <div
          data-testid="actual-bar"
          className={`absolute rounded ${actualColor} ${!actualEnd ? 'opacity-80' : ''}`}
          style={{ ...actual, minWidth: MIN_BAR_PX, top: actualTop, height: barH }}
        />
      )}
    </div>
  )
}
