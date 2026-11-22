import type { IssueResponse } from '@/api/generated/model'

/** 사업 1의 열린 이슈 (projects/projectHome 픽스처의 openIssueCount=2와 일치) */
export const openIssuesFixture: IssueResponse[] = [
  {
    issueId: 1,
    title: '가상 보안 요건 추가 대응',
    grade: 'HIGH',
    status: 'OPEN',
    assignee: '담당자A',
    occurredAt: '2026-11-10',
    targetDate: '2026-11-15',
    response: '관련 부서 협의 중',
    overdue: true,
  },
  {
    issueId: 2,
    title: '가상 레거시 인터페이스 명세 미확인',
    grade: 'MID',
    status: 'IN_PROGRESS',
    assignee: '담당자B',
    occurredAt: '2026-03-10',
    targetDate: '2026-12-31',
    overdue: false,
  },
]
