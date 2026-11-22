import type { ProjectSummaryResponse } from '@/api/generated/model'

export const projectsFixture: ProjectSummaryResponse[] = [
  {
    projectId: 1,
    name: '스마트 팩토리 구축 사업',
    type: 'INTERNAL',
    phase: '실행',
    startDate: '2026-03-01',
    endDate: '2027-02-28',
    progress: 45,
    openIssueCount: 2,
    statusSignal: { status: 'CAUTION', reasons: ['마일스톤 1주 지연'] },
    nextMilestone: {
      name: '전문위원회(2차)',
      plannedDate: '2026-11-30',
      dDay: -9,
    },
  },
  {
    projectId: 2,
    name: 'AI 품질 검사 R&D',
    type: 'GOV',
    phase: '계획',
    startDate: '2026-06-01',
    endDate: '2028-05-31',
    progress: 10,
    openIssueCount: 0,
    statusSignal: { status: 'NORMAL', reasons: [] },
    nextMilestone: {
      name: '기업결합 심사',
      plannedDate: '2027-02-15',
      dDay: -86,
    },
  },
  {
    projectId: 3,
    name: '수출 승인 갱신',
    type: 'INTERNAL',
    phase: '완료',
    startDate: '2026-01-01',
    endDate: '2026-10-31',
    progress: 100,
    openIssueCount: 0,
    statusSignal: { status: 'NORMAL', reasons: [] },
    nextMilestone: undefined,
  },
]

/** D-day가 양수(기한 초과)인 프로젝트 픽스처 */
export const overdueProjectFixture: ProjectSummaryResponse = {
  projectId: 99,
  name: '지연 사업',
  type: 'INTERNAL',
  phase: '실행',
  startDate: '2025-01-01',
  endDate: '2025-12-31',
  progress: 30,
  openIssueCount: 5,
  statusSignal: { status: 'DANGER', reasons: ['마일스톤 2주 초과 지연'] },
  nextMilestone: {
    name: '중간 보고',
    plannedDate: '2026-09-30',
    dDay: 82,
  },
}
