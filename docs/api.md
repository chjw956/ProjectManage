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

### POST /api/v1/projects
신규 사업 등록. 증적자료 폴더 경로를 함께 보내면 해당 경로를 사업의 NAS 폴더로 같은 트랜잭션에서 등록한다.
폴더 등록이 실패하면 사업 등록도 롤백된다.

**요청 본문**
```json
{
  "name": "가상 데이터 플랫폼 구축",
  "type": "INTERNAL",
  "phase": "계획",
  "startDate": "2027-01-01",
  "endDate": "2027-12-31",
  "summary": "사내 데이터 통합 플랫폼 구축",
  "evidenceFolderLabel": "증적자료",
  "evidenceFolderPath": "/mnt/nas/가상데이터플랫폼/증적자료"
}
```

| 필드 | 타입 | 필수 | 설명 |
|------|------|------|------|
| `name` | string | ✓ | 사업명 |
| `type` | `INTERNAL` \| `GOV` | ✓ | 사업 유형 |
| `phase` | string \| null | | 현재 단계 |
| `startDate` | string (ISO date) \| null | | 시작일 |
| `endDate` | string (ISO date) \| null | | 종료일 |
| `summary` | string \| null | | 한 줄 요약 |
| `evidenceFolderPath` | string \| null | | 증적자료 폴더 NAS 경로. 허용 루트(`nas.allowed-roots`) 하위여야 한다 |
| `evidenceFolderLabel` | string \| null | `evidenceFolderPath`가 있으면 ✓ | 등록할 폴더 이름 |

**응답 `201 Created`**: `GET /api/v1/projects` 목록 항목과 같은 형식

**오류 응답**

| 코드 | 설명 |
|------|------|
| `400 Bad Request` | 필수값 누락, 경로는 있는데 폴더 이름이 없음, 경로가 허용 루트 밖 |

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

---

## 이슈 (Issue)

### GET /api/v1/projects/{projectId}/issues?status=open
사업의 열린 이슈 목록 조회 (조회 전용). 대시보드 카드·사업 홈의 "열린 이슈" 모달에서 사용한다.

**쿼리 파라미터**

| 파라미터 | 타입 | 설명 |
|----------|------|------|
| `status` | `open` | `open`: CLOSED를 제외한 이슈(OPEN, IN_PROGRESS). `openIssueCount`와 같은 기준. 현재 `open`만 지원 |

**정렬**: 등급(HIGH → MID → LOW) → 목표일 빠른 순(미정은 뒤로) → 발생일 빠른 순

**응답 `200 OK`**
```json
[
  {
    "issueId": 1,
    "title": "보안 감사 요건 추가 — 개인정보 처리 방침 반영 필요",
    "grade": "HIGH",
    "status": "OPEN",
    "assignee": "김민준",
    "occurredAt": "2026-11-10",
    "targetDate": "2026-12-15",
    "response": "법무팀 협의 진행 중.",
    "overdue": false
  }
]
```

| 필드 | 타입 | 설명 |
|------|------|------|
| `issueId` | number | 이슈 ID |
| `title` | string | 이슈명 |
| `grade` | `HIGH` \| `MID` \| `LOW` | 등급 (상·중·하) |
| `status` | `OPEN` \| `IN_PROGRESS` | 상태 |
| `assignee` | string \| null | 담당자 |
| `occurredAt` | string (ISO date) | 발생일 |
| `targetDate` | string (ISO date) \| null | 목표 해결일 |
| `response` | string \| null | 대응 방안 |
| `overdue` | boolean | 목표일이 오늘보다 이전이면 `true` (서버에서 계산, 목표일 미정이면 `false`) |

**오류 응답**

| 코드 | 설명 |
|------|------|
| `400 Bad Request` | 지원하지 않는 `status` 값 |
| `403 Forbidden` | 사업 조회 권한 없음 |
| `404 Not Found` | 존재하지 않는 사업 ID |
