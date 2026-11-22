import { format, parseISO } from 'date-fns'

/** 날짜를 "2026.10.30" 형식으로 반환 */
export function formatDate(dateStr: string | null | undefined): string {
  if (!dateStr) return '—'
  return format(parseISO(dateStr), 'yyyy.MM.dd')
}

/** 간트 눈금 날짜를 "10/30" 형식으로 반환 */
export function formatGanttTick(dateStr: string): string {
  return format(parseISO(dateStr), 'M/d')
}

/**
 * D-day 표시 변환
 * - dDay < 0: D-|dDay| (예: -5 → "D-5")
 * - dDay = 0: "D-Day"
 * - dDay > 0: D+dDay (예: 82 → "D+82")  — 기한 초과
 */
export function displayDDay(dDay: number): string {
  if (dDay === 0) return 'D-Day'
  if (dDay < 0) return `D-${Math.abs(dDay)}`
  return `D+${dDay}`
}
