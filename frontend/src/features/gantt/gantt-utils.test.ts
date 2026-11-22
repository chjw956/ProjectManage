import { buildTimeline, datePct, spanPct, tickLabel } from './gantt-utils'

describe('buildTimeline', () => {
  it('첫 눈금은 (최소일 - 14일)이 속한 주의 월요일이고, 이후 7일 간격', () => {
    // 2026-08-03(월) - 14일 = 2026-07-20(월)
    const tl = buildTimeline(['2026-08-03', '2026-10-04'], '2026-11-22')
    expect(tl.start).toBe('2026-07-20')
    expect(tl.ticks[1]).toBe('2026-07-27')
    expect(new Date(tl.start).getDay()).toBe(1)
  })

  it('최소일 - 14일이 월요일이 아니면 그 이전 월요일부터 시작 (막대가 첫 열보다 앞서지 않음)', () => {
    // 2026-08-06(목) - 14일 = 2026-07-23(목) → 그 주 월요일 2026-07-20
    const tl = buildTimeline(['2026-08-06'], '2026-11-22')
    expect(tl.start).toBe('2026-07-20')
    expect(datePct('2026-08-06', tl)).toBeGreaterThan(0)
  })

  it('마지막 눈금 주는 (최대일 + 14일)을 덮고, totalDays = 눈금 수 × 7', () => {
    const tl = buildTimeline(['2026-08-03', '2026-10-04'], '2026-11-22')
    const lastTick = tl.ticks[tl.ticks.length - 1]
    expect(lastTick <= '2026-10-18').toBe(true)
    expect(datePct('2026-10-18', tl)).toBeLessThan(100)
    expect(tl.totalDays).toBe(tl.ticks.length * 7)
  })

  it('날짜가 없으면 오늘 기준으로 범위를 만든다', () => {
    const tl = buildTimeline([null, undefined], '2026-11-22')
    const todayPct = datePct('2026-11-22', tl)
    expect(todayPct).toBeGreaterThan(0)
    expect(todayPct).toBeLessThan(100)
  })
})

describe('datePct / spanPct', () => {
  // 4주 = 28일 타임라인
  const tl = { start: '2026-08-03', ticks: ['2026-08-03', '2026-08-10', '2026-08-17', '2026-08-24'], totalDays: 28 }

  it('시작일은 0%, 2주 뒤는 50%', () => {
    expect(datePct('2026-08-03', tl)).toBe(0)
    expect(datePct('2026-08-17', tl)).toBe(50)
  })

  it('막대 너비는 양 끝 포함 일수 기준 (7일 = 25%)', () => {
    expect(spanPct('2026-08-03', '2026-08-09', tl)).toBe(25)
  })

  it('하루짜리도 1일 너비, 종료 < 시작이면 0', () => {
    expect(spanPct('2026-08-03', '2026-08-03', tl)).toBeCloseTo(100 / 28)
    expect(spanPct('2026-08-10', '2026-08-03', tl)).toBe(0)
  })

  it('막대 위치는 눈금 위치와 같은 기준 (2번째 눈금 = 25%)', () => {
    expect(datePct(tl.ticks[1], tl)).toBe(25)
  })
})

describe('tickLabel', () => {
  const ticks = ['2026-08-10', '2026-08-17', '2026-08-24', '2026-08-31', '2026-09-07', '2026-09-14']

  it('첫 눈금과 월이 바뀌는 눈금은 "yy.MM"', () => {
    expect(tickLabel(ticks, 0, false)).toEqual({ text: '26.08', isMonth: true })
    expect(tickLabel(ticks, 4, false)).toEqual({ text: '26.09', isMonth: true })
  })

  it('첫 눈금 직후(2눈금 이내)에 월이 바뀌면 첫 월 라벨은 생략해 겹치지 않게 한다', () => {
    const t = ['2026-12-29', '2027-01-05', '2027-01-12']
    expect(tickLabel(t, 0, false)).toBeNull()
    expect(tickLabel(t, 0, true)).toEqual({ text: '12/29', isMonth: false })
    expect(tickLabel(t, 1, false)).toEqual({ text: '27.01', isMonth: true })
  })

  it('나머지 눈금은 showDays일 때만 "M/d"', () => {
    expect(tickLabel(ticks, 3, false)).toBeNull()
    expect(tickLabel(ticks, 3, true)).toEqual({ text: '8/31', isMonth: false })
  })
})
