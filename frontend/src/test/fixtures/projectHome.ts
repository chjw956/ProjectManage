import type { ProjectHomeResponse, MilestoneResponse } from '@/api/generated/model'

export const projectHomeFixture: ProjectHomeResponse = {
  projectId: 1,
  name: '스마트 팩토리 구축 사업',
  type: 'INTERNAL',
  phase: '실행',
  status: 'CAUTION',
  startDate: '2026-03-01',
  endDate: '2027-02-28',
  summary: 'IoT 기반 스마트 팩토리 구축으로 생산 효율 30% 향상 목표',
  progress: 45,
  openIssueCount: 2,
  statusSignal: { status: 'CAUTION', reasons: ['마일스톤 1주 지연', '이슈 2건 미해결'] },
  nextMilestone: {
    name: '전문위원회(2차)',
    plannedDate: '2026-11-30',
    dDay: -9,
  },
  recentEvents: [
    {
      eventId: 1,
      eventDate: '2026-11-15',
      type: 'DECISION',
      summary: '2차 PoC 범위를 설비예지보전으로 한정',
    },
    {
      eventId: 2,
      eventDate: '2026-11-08',
      type: 'WEEKLY',
      summary: '주간 업데이트: 1단계 개발 완료, 2단계 착수',
    },
    {
      eventId: 3,
      eventDate: '2026-10-30',
      type: 'MILESTONE',
      summary: '전문위원회(1차) 통과',
    },
  ],
}

export const govProjectHomeFixture: ProjectHomeResponse = {
  projectId: 2,
  name: 'AI 품질 검사 R&D',
  type: 'GOV',
  phase: '계획',
  status: 'NORMAL',
  startDate: '2026-06-01',
  endDate: '2028-05-31',
  summary: 'AI 기반 불량 검사 시스템 R&D 과제',
  progress: 10,
  openIssueCount: 0,
  statusSignal: { status: 'NORMAL', reasons: [] },
  nextMilestone: undefined,
  recentEvents: [],
}

export const projectHomeMilestonesFixture: MilestoneResponse[] = [
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
]
