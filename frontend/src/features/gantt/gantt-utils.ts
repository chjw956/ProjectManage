import { addDays, differenceInCalendarDays, format, parseISO, startOfWeek } from 'date-fns'

/**
 * 간트 타임라인.
 * - start: 첫 주 눈금(월요일). 막대·오늘선·눈금이 모두 이 날짜를 0으로 삼는다.
 * - ticks: 주 눈금(월요일) 목록. 열 i는 [ticks[i], ticks[i] + 7일)을 덮는다.
 * - totalDays: ticks.length × 7
 *
 * 위치는 백분율로 계산하므로 "주 단위"(고정 px 폭)·"기간 축소"(화면 폭) 모두 같은 함수로 그린다.
 */
export interface Timeline {
  start: string
  ticks: string[]
  totalDays: number
}

/** 패딩(일): 가장 이른·늦은 날짜 양쪽 여백 */
const PAD_DAYS = 14

/** 로컬 날짜를 yyyy-MM-dd로. (toISOString은 UTC라 KST에서 하루 밀린다) */
export function toIsoDate(d: Date): string {
  return format(d, 'yyyy-MM-dd')
}

export function todayIso(): string {
  return toIsoDate(new Date())
}

/** 날짜 목록으로 타임라인을 만든다. 날짜가 없으면 오늘 기준 -2주 ~ +8주. */
export function buildTimeline(dates: (string | null | undefined)[], today: string = todayIso()): Timeline {
  const valid = dates.filter((d): d is string => !!d).map((d) => parseISO(d))
  const t = parseISO(today)
  const min = valid.length ? new Date(Math.min(...valid.map((d) => d.getTime()))) : t
  const max = valid.length ? new Date(Math.max(...valid.map((d) => d.getTime()))) : addDays(t, 7 * 6)

  const first = startOfWeek(addDays(min, -PAD_DAYS), { weekStartsOn: 1 })
  const last = addDays(max, PAD_DAYS)

  const ticks: string[] = []
  for (let cur = first; cur <= last; cur = addDays(cur, 7)) {
    ticks.push(toIsoDate(cur))
  }
  return { start: ticks[0], ticks, totalDays: ticks.length * 7 }
}

/** 날짜의 왼쪽 위치(%). 범위 밖이면 0 미만·100 초과가 될 수 있다. */
export function datePct(date: string, tl: Timeline): number {
  return (differenceInCalendarDays(parseISO(date), parseISO(tl.start)) / tl.totalDays) * 100
}

/** start~end(양 끝 포함) 막대 너비(%). end < start면 0. */
export function spanPct(start: string, end: string, tl: Timeline): number {
  const days = differenceInCalendarDays(parseISO(end), parseISO(start)) + 1
  return (Math.max(0, days) / tl.totalDays) * 100
}

/** 눈금 라벨: 월이 바뀌는 눈금은 "26.08", 나머지는 showDays일 때만 "8/10". */
export function tickLabel(ticks: string[], i: number, showDays: boolean): { text: string; isMonth: boolean } | null {
  const tick = ticks[i]
  const isMonth = i === 0 || tick.slice(5, 7) !== ticks[i - 1].slice(5, 7)
  // 첫 눈금 바로 뒤(2눈금 이내)에 월이 바뀌면 첫 라벨은 생략해 라벨이 겹치지 않게 한다
  if (i === 0 && ticks.slice(1, 3).some((t) => t.slice(5, 7) !== tick.slice(5, 7))) {
    return showDays ? { text: `${Number(tick.slice(5, 7))}/${Number(tick.slice(8, 10))}`, isMonth: false } : null
  }
  if (isMonth) return { text: `${tick.slice(2, 4)}.${tick.slice(5, 7)}`, isMonth: true }
  if (!showDays) return null
  return { text: `${Number(tick.slice(5, 7))}/${Number(tick.slice(8, 10))}`, isMonth: false }
}

/** 간트 행들이 공유하는 레이아웃. widthPx가 있으면 "주 단위"(고정 폭), 없으면 "기간 축소"(화면 폭). */
export interface GanttLayout {
  timeline: Timeline
  widthPx?: number
  todayPct: number
}
