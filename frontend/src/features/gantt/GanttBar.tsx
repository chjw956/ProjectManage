import { dateRangeWidth, dateToOffset } from './gantt-utils'

interface GanttBarProps {
  plannedStart: string | null
  plannedEnd: string | null
  actualStart: string | null
  actualEnd: string | null
  delayed: boolean
  rangeStart: string
  isProcess?: boolean
}

const TODAY_ISO = new Date().toISOString().slice(0, 10)
const ROW_H = 44  // px (h-11)

export function GanttBar({
  plannedStart, plannedEnd, actualStart, actualEnd, delayed, rangeStart, isProcess,
}: GanttBarProps) {
  if (!plannedStart || !plannedEnd) return null

  const pLeft = dateToOffset(plannedStart, rangeStart)
  const pWidth = Math.max(dateRangeWidth(plannedStart, plannedEnd, rangeStart), 4)

  const hasActual = !!actualStart
  const aLeft = hasActual ? dateToOffset(actualStart, rangeStart) : null
  const aWidth = hasActual
    ? Math.max(dateRangeWidth(actualStart, actualEnd ?? TODAY_ISO, rangeStart), 4)
    : null

  // 공정 행: 얇은 배경 막대만
  if (isProcess) {
    return (
      <div className="relative w-full h-full flex items-center">
        <div
          className="absolute h-1.5 rounded-full bg-slate-300"
          style={{ left: pLeft, width: pWidth }}
        />
      </div>
    )
  }

  const planTop  = Math.round(ROW_H / 2) - 12
  const actualTop = Math.round(ROW_H / 2) + 1
  const barH = 9
  const actualColor = delayed ? 'bg-red-400' : 'bg-blue-500'

  return (
    <div className="relative w-full" style={{ height: ROW_H }}>
      {/* 계획 막대 — 테두리만 */}
      <div
        data-testid="planned-bar"
        className="absolute rounded border-2 border-blue-400 bg-blue-50"
        style={{ left: pLeft, width: pWidth, top: planTop, height: barH }}
      />

      {/* 실제 막대 — 채움 (actualEnd 없으면 오늘까지) */}
      {hasActual && aLeft !== null && aWidth !== null && (
        <div
          data-testid="actual-bar"
          className={`absolute rounded ${actualColor} ${!actualEnd ? 'opacity-80' : ''}`}
          style={{ left: aLeft, width: aWidth, top: actualTop, height: barH }}
        />
      )}
    </div>
  )
}
