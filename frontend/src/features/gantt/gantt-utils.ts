import { differenceInDays, parseISO } from 'date-fns'
import { WEEK_COL_WIDTH_PX } from '@/lib/constants'

/**
 * 날짜를 타임라인 시작일 기준 px 오프셋으로 변환.
 * 1주 = WEEK_COL_WIDTH_PX px
 */
export function dateToOffset(dateStr: string, rangeStart: string): number {
  const days = differenceInDays(parseISO(dateStr), parseISO(rangeStart))
  return Math.round((days / 7) * WEEK_COL_WIDTH_PX)
}

/**
 * 두 날짜 사이의 막대 너비(px).
 * 최소 4px 보장.
 */
export function dateRangeWidth(
  startStr: string,
  endStr: string,
  rangeStart: string,
): number {
  const startOffset = dateToOffset(startStr, rangeStart)
  const endOffset = dateToOffset(endStr, rangeStart)
  const raw = endOffset - startOffset + Math.round(WEEK_COL_WIDTH_PX / 7)
  return Math.max(4, raw)
}

/**
 * 간트 범위 계산.
 * processes의 모든 plannedStart/End, actualStart/End를 모아 최솟값·최댓값을 구한다.
 * 패딩은 양쪽 2주.
 */
export function calcTimelineRange(dates: (string | null)[]): { start: string; end: string } {
  const valid = dates.filter((d): d is string => !!d).map((d) => parseISO(d))
  if (valid.length === 0) {
    const today = new Date()
    const pad = new Date(today)
    pad.setDate(pad.getDate() - 14)
    const padEnd = new Date(today)
    padEnd.setDate(padEnd.getDate() + 14 * 4)
    return {
      start: formatIso(pad),
      end: formatIso(padEnd),
    }
  }
  const min = new Date(Math.min(...valid.map((d) => d.getTime())))
  const max = new Date(Math.max(...valid.map((d) => d.getTime())))
  min.setDate(min.getDate() - 14)
  max.setDate(max.getDate() + 14)
  return { start: formatIso(min), end: formatIso(max) }
}

function formatIso(d: Date): string {
  return d.toISOString().slice(0, 10)
}

/**
 * 주눈금 목록 생성 (타임라인 범위 내 월요일 기준).
 */
export function buildWeekTicks(rangeStart: string, rangeEnd: string): string[] {
  const ticks: string[] = []
  const start = parseISO(rangeStart)
  const end = parseISO(rangeEnd)

  // 첫 월요일로 맞춤
  const cur = new Date(start)
  const dow = cur.getDay()
  if (dow !== 1) {
    cur.setDate(cur.getDate() + ((8 - dow) % 7))
  }

  while (cur <= end) {
    ticks.push(formatIso(cur))
    cur.setDate(cur.getDate() + 7)
  }
  return ticks
}
