# API 계약 (ProjTrack)

Base URL: `/api/v1`

---

## 프로젝트 (Project)

### GET /api/v1/projects
포트폴리오 대시보드용 사업 목록 조회.

**응답 `200 OK`**
```json
[
  {
    "projectId": 1,
    "name": "스마트 팩토리 구축 사업",
    "type": "INTERNAL",
    "phase": "실행",
    "startDate": "2026-03-01",
    "endDate": "2027-02-28",
    "progress": 45,
    "openIssueCount": 2,
    "statusSignal": {
      "status": "CAUTION",
      "reasons": ["마일스톤 1주 지연"]
    },
    "nextMilestone": {
      "name": "전문위원회(2차)",
      "plannedDate": "2026-11-30",
      "dDay": -9
    }
  }
]
```

**필드**

| 필드 | 타입 | 설명 |
|------|------|------|
| `projectId` | number | 사업 ID |
| `name` | string | 사업명 |
| `type` | `INTERNAL` \| `GOV` | 사업 유형 (사내/정부) |
| `phase` | string | 현재 단계 |
| `startDate` | string (ISO date) | 사업 시작일 |
| `endDate` | string (ISO date) | 사업 종료일 |
| `progress` | number (0–100) | 진척률 (%) |
| `openIssueCount` | number | 열린 이슈 수 |
| `statusSignal.status` | `NORMAL` \| `CAUTION` \| `DANGER` | 상태 신호 |
| `statusSignal.reasons` | string[] | 상태 판단 사유 목록 |
| `nextMilestone` | object \| null | 다음 마일스톤 요약 |

---

### GET /api/v1/projects/{id}
사업 홈 요약 조회. 대시보드보다 상세한 정보를 포함하며, 최근 타임라인 이벤트를 함께 반환한다.

**경로 파라미터**

| 파라미터 | 타입 | 설명 |
|----------|------|------|
| `id` | number | 사업 ID |

**응답 `200 OK`**
```json
{
  "projectId": 1,
  "name": "스마트 팩토리 구축 사업",
  "type": "INTERNAL",
  "phase": "실행",
  "status": "CAUTION",
  "startDate": "2026-03-01",
  "endDate": "2027-02-28",
  "summary": "IoT 기반 스마트 팩토리 구축으로 생산 효율 30% 향상 목표",
  "progress": 45,
  "openIssueCount": 2,
  "statusSignal": {
    "status": "CAUTION",
    "reasons": ["마일스톤 1주 지연", "이슈 2건 미해결"]
  },
  "nextMilestone": {
    "name": "전문위원회(2차)",
    "plannedDate": "2026-11-30",
    "dDay": -9
  },
  "recentEvents": [
    {
      "eventId": 101,
      "eventDate": "2026-11-15",
      "type": "DECISION",
      "summary": "2차 PoC 범위를 설비예지보전으로 한정"
    },
    {
      "eventId": 100,
      "eventDate": "2026-11-08",
      "type": "WEEKLY",
      "summary": "주간 업데이트: 1단계 개발 완료, 2단계 착수"
    }
  ]
}
```

**추가 필드 (목록 대비)**

| 필드 | 타입 | 설명 |
|------|------|------|
| `status` | string | 사업 상태 (내부 상태값) |
| `summary` | string | 한 줄 요약 |
| `recentEvents` | array | 최근 타임라인 이벤트 (최대 5건, 최신순) |
| `recentEvents[].eventId` | number | 이벤트 ID |
| `recentEvents[].eventDate` | string (ISO date) | 이벤트 발생일 |
| `recentEvents[].type` | string | 이벤트 유형 (`DECISION`, `WEEKLY`, `MILESTONE`, `ISSUE`, `CHANGE`, `KICKOFF`, `MEETING`, `SUBMIT`) |
| `recentEvents[].summary` | string | 이벤트 한 줄 요약 |

**오류 응답**

| 코드 | 설명 |
|------|------|
| `403 Forbidden` | 접근 권한 없음 (보안등급 "기밀" 사업은 참여자만 조회 가능) |
| `404 Not Found` | 존재하지 않는 사업 ID |

---

## 마일스톤 (Milestone)

### GET /api/v1/projects/{projectId}/milestones
사업의 마일스톤 목록 조회.

**응답 `200 OK`**
```json
[
  {
    "milestoneId": 1,
    "projectId": 1,
    "name": "전문위원회(1차)",
    "type": "REVIEW",
    "plannedDate": "2026-10-30",
    "actualDate": "2026-10-30",
    "status": "DONE",
    "dDay": 22
  },
  {
    "milestoneId": 2,
    "projectId": 1,
    "name": "전문위원회(2차)",
    "type": "REVIEW",
    "plannedDate": "2026-11-30",
    "actualDate": null,
    "status": "TODO",
    "dDay": -9
  }
]
```

**필드**

| 필드 | 타입 | 설명 |
|------|------|------|
| `milestoneId` | number | 마일스톤 ID |
| `projectId` | number | 사업 ID |
| `name` | string | 마일스톤 명칭 |
| `type` | string | 유형 (`REVIEW`, `SUBMIT`, `ESTABLISH` 등) |
| `plannedDate` | string (ISO date) | 계획일 |
| `actualDate` | string (ISO date) \| null | 실제 완료일 |
| `status` | `TODO` \| `IN_PROGRESS` \| `DONE` | 상태 |
| `dDay` | number | D-day (음수=남은 일수, 양수=초과일수, 0=당일) |
