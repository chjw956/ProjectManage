import type { MilestoneResponse } from '@/api/generated/model'

export const milestonesFixture: MilestoneResponse[] = [
  {
    milestoneId: 1,
    projectId: 1,
    name: '전문위원회(1차)',
    type: 'REVIEW',
    plannedDate: '2026-10-30',
    actualDate: '2026-10-30',
    status: 'DONE',
    dDay: 22,
  },
  {
    milestoneId: 2,
    projectId: 1,
    name: '전문위원회(2차)',
    type: 'REVIEW',
    plannedDate: '2026-11-30',
    actualDate: undefined,
    status: 'TODO',
    dDay: -9,
  },
  {
    milestoneId: 3,
    projectId: 1,
    name: '기업결합 심사',
    type: 'SUBMIT',
    plannedDate: '2027-02-15',
    actualDate: undefined,
    status: 'TODO',
    dDay: -86,
  },
  {
    milestoneId: 4,
    projectId: 1,
    name: '중국법인 설립',
    type: 'ESTABLISH',
    plannedDate: '2027-02-28',
    actualDate: undefined,
    status: 'TODO',
    dDay: -99,
  },
]
