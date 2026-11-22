import { render, screen } from '@testing-library/react'
import { GanttBar } from './GanttBar'
import type { Timeline } from './gantt-utils'

// 2026-08-03(월)부터 10주 = 70일
const TIMELINE: Timeline = {
  start: '2026-08-03',
  ticks: Array.from({ length: 10 }, (_, i) => new Date(Date.UTC(2026, 7, 3 + i * 7)).toISOString().slice(0, 10)),
  totalDays: 70,
}

describe('GanttBar', () => {
  it('계획 막대가 렌더링된다', () => {
    render(
      <GanttBar
        plannedStart="2026-08-03"
        plannedEnd="2026-10-04"
        actualStart={null}
        actualEnd={null}
        delayed={false}
        timeline={TIMELINE}
      />,
    )
    expect(screen.getByTestId('planned-bar')).toBeInTheDocument()
  })

  it('실제 막대가 renderd된다', () => {
    render(
      <GanttBar
        plannedStart="2026-08-03"
        plannedEnd="2026-10-04"
        actualStart="2026-08-03"
        actualEnd="2026-10-04"
        delayed={false}
        timeline={TIMELINE}
      />,
    )
    expect(screen.getByTestId('actual-bar')).toBeInTheDocument()
  })

  it('지연(delayed=true)이면 실제 막대가 빨간색 클래스를 가진다', () => {
    render(
      <GanttBar
        plannedStart="2026-08-03"
        plannedEnd="2026-10-04"
        actualStart="2026-08-14"
        actualEnd="2026-10-14"
        delayed={true}
        timeline={TIMELINE}
      />,
    )
    expect(screen.getByTestId('actual-bar')).toHaveClass('bg-red-400')
  })

  it('지연이 아니면 실제 막대가 초록 클래스를 가진다', () => {
    render(
      <GanttBar
        plannedStart="2026-08-03"
        plannedEnd="2026-10-04"
        actualStart="2026-08-03"
        actualEnd="2026-10-04"
        delayed={false}
        timeline={TIMELINE}
      />,
    )
    expect(screen.getByTestId('actual-bar')).toHaveClass('bg-blue-500')
  })

  it('계획 막대의 위치·너비는 타임라인 대비 %다', () => {
    render(
      <GanttBar
        plannedStart="2026-08-10"
        plannedEnd="2026-08-23"
        actualStart={null}
        actualEnd={null}
        delayed={false}
        timeline={TIMELINE}
      />,
    )
    const bar = screen.getByTestId('planned-bar')
    // 08-10은 시작 7일 뒤 → 7/70 = 10%, 08-10~08-23 = 14일 → 20%
    expect(bar.style.left).toBe('10%')
    expect(bar.style.width).toBe('20%')
  })

  it('실제 종료일이 없으면 실제 막대는 반투명(진행 중)으로 표시된다', () => {
    render(
      <GanttBar
        plannedStart="2026-08-03"
        plannedEnd="2026-10-04"
        actualStart="2026-08-03"
        actualEnd={null}
        delayed={false}
        timeline={TIMELINE}
      />,
    )
    expect(screen.getByTestId('actual-bar')).toHaveClass('opacity-80')
  })
})
