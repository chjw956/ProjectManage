import { formatGanttTick } from '@/lib/date'
import { WEEK_COL_WIDTH_PX } from '@/lib/constants'
import { buildWeekTicks, dateToOffset } from './gantt-utils'

const TODAY_ISO = new Date().toISOString().slice(0, 10)

interface GanttTimelineHeaderProps {
  rangeStart: string
  rangeEnd: string
  scale: 'week' | 'fit'
  totalWidth: number
}

/** 간트 타임라인 헤더 — 주눈금 + 오늘 기준선 */
export function GanttTimelineHeader({
  rangeStart,
  rangeEnd,
  scale,
  totalWidth,
}: GanttTimelineHeaderProps) {
  const ticks = buildWeekTicks(rangeStart, rangeEnd)
  const todayOffset = dateToOffset(TODAY_ISO, rangeStart)

  if (scale === 'fit') {
    // 기간 축소: 열 너비를 1fr로 균등 분할
    return (
      <div className="relative flex border-b border-gray-200 bg-gray-50">
        {ticks.map((tick) => (
          <div
            key={tick}
            className="flex-1 border-r border-gray-100 py-1 text-center text-xs text-gray-500"
          >
            {formatGanttTick(tick)}
          </div>
        ))}
        {/* 오늘 기준선 */}
        <div
          className="pointer-events-none absolute top-0 h-full w-px bg-red-500"
          style={{ left: `${(todayOffset / totalWidth) * 100}%` }}
        />
      </div>
    )
  }

  // 주 단위: 1주 = WEEK_COL_WIDTH_PX px
  return (
    <div className="relative flex border-b border-gray-200 bg-gray-50" style={{ minWidth: totalWidth }}>
      {ticks.map((tick) => (
        <div
          key={tick}
          className="border-r border-gray-100 py-1 text-center text-xs text-gray-500"
          style={{ width: WEEK_COL_WIDTH_PX, flexShrink: 0 }}
        >
          {formatGanttTick(tick)}
        </div>
      ))}
      {/* 오늘 기준선 */}
      <div
        data-testid="today-line"
        className="pointer-events-none absolute top-0 h-full w-px bg-red-500"
        style={{ left: todayOffset }}
      />
    </div>
  )
}
