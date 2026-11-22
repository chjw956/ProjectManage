import { render, screen } from '@testing-library/react'
import { GanttBar } from './GanttBar'

const RANGE_START = '2026-08-01'

describe('GanttBar', () => {
  it('계획 막대가 렌더링된다', () => {
    render(
      <GanttBar
        plannedStart="2026-08-03"
        plannedEnd="2026-10-04"
        actualStart={null}
        actualEnd={null}
        delayed={false}
        rangeStart={RANGE_START}
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
        rangeStart={RANGE_START}
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
        rangeStart={RANGE_START}
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
        rangeStart={RANGE_START}
      />,
    )
    expect(screen.getByTestId('actual-bar')).toHaveClass('bg-blue-500')
  })

  it('계획 막대의 left 오프셋은 시작일에 비례한다', () => {
    render(
      <GanttBar
        plannedStart="2026-08-10"
        plannedEnd="2026-09-10"
        actualStart={null}
        actualEnd={null}
        delayed={false}
        rangeStart={RANGE_START}
      />,
    )
    const bar = screen.getByTestId('planned-bar')
    // 2026-08-10 is 9 days after 2026-08-01 → offset = round(9/7*80) = round(102.86) = 103
    expect(bar.style.left).toBe('103px')
  })
})
