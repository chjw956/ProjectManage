# 슬라이스 1: 사업 + WBS (백엔드)

- 참고: `docs/design.md` 4.2 사업 홈, 4.10 WBS·간트, 5장 데이터 모델 / `docs/screens/WBS 간트.png`
- 적용 스킬: `feature-slice`, `calc-rules`, `history-logging`, `db-migration`
- 진행 방식: 단계마다 `./mvnw test` 통과 → 커밋 → 다음 단계

---

## 1단계: DB 마이그레이션 + Calculator + 엔티티·리포지토리

**목표**: 계산 로직 테스트 먼저 통과, DB 레이어 완성. 서비스·컨트롤러는 만들지 않는다.

### 신규 파일

| 구분 | 파일 |
| --- | --- |
| 마이그레이션 | `V2__extend_timeline_event.sql` |
| 엔티티 | `project/domain/Project.java`, `project/domain/ProjectMember.java` |
| | `wbs/domain/Task.java` (`parent_id` 자기참조), `wbs/domain/Milestone.java` |
| | `history/domain/TimelineEvent.java` (before/after → `@JdbcTypeCode(JSONB)`) |
| | `history/domain/Issue.java` *(보완 3)* |
| 리포지토리 | `ProjectRepository`, `ProjectMemberRepository`, `TaskRepository`, `MilestoneRepository`, `TimelineEventRepository`, `IssueRepository` *(보완 3)* |
| 계산 | `wbs/TaskCalculator.java` (순수 함수, DB 없음) |
| | `project/ProjectStatusCalculator.java` |

### V2 마이그레이션

```sql
ALTER TABLE timeline_event
  ADD COLUMN before_state  JSONB,
  ADD COLUMN after_state   JSONB,
  ADD COLUMN reason        TEXT,
  ADD COLUMN ref_type      VARCHAR(50),
  ADD COLUMN ref_entity_id BIGINT;
```

> `actor`(행위자), `source`(MANUAL/AUTO) 컬럼이 V1에 있는지 확인하고, 없으면 함께 추가한다. *(보완 6)*

### 테스트 (먼저 작성)

**TaskCalculatorTest** (순수 단위)
- [ ] 하위 Task가 없는 공정 → 0%
- [ ] T1(30일, 100%) + T2(10일, 0%) 가중 평균 → 75%
- [ ] 계획 기간 0일 Task → 가중치 1일로 처리
- [ ] 공정 진척률 → 사업 진척률 가중 평균 *(보완 2)*
- [ ] 반올림은 마지막 한 번만 (예: 33.3 + 33.3 + 33.4 경계) *(보완 2)*
- [ ] 오늘 = 계획 종료일 → 지연 아님
- [ ] 오늘 = 계획 종료일 + 1일 → 지연
- [ ] 기대 진행률 − 실제 진행률 = 29%p → 지연 아님 / 30%p → 지연 *(보완 2: 경계값)*
- [ ] 완료 상태 Task는 종료일이 지나도 지연 아님 *(보완 2)*

**ProjectStatusCalculatorTest** (순수 단위)
- [ ] 조건 없음 → NORMAL, 사유 목록 비어 있음
- [ ] 마일스톤 14일 지연 → CAUTION *(보완 1: 경계값)*
- [ ] 마일스톤 15일 지연 → DANGER
- [ ] 열린 HIGH 이슈 1건 → CAUTION
- [ ] 해결 기한을 넘긴 HIGH 이슈 → DANGER *(보완 2)*
- [ ] 마지막 이벤트 14일 전 → CAUTION (미갱신) *(보완 2)*
- [ ] DANGER + CAUTION 조건 동시 → DANGER, 사유 목록에 둘 다 포함
- 예산 지연·정부사업 의무 기한 조건은 입력을 선택값으로 열어두고, 해당 슬라이스에서 테스트를 추가한다.

**TaskRepositoryTest** (`@DataJpaTest` + Testcontainers)
- [ ] `findByProjectIdOrderBySortOrderAsc` → 공정 먼저, sort_order 순
- [ ] 자기참조: 세부 Task에서 `parent.taskId` 접근 (Lazy 로딩 확인)

---

## 2단계: 서비스 레이어 + HistoryRecorder

**목표**: 비즈니스 로직, 권한 확인, 이력 기록 완성. HTTP 레이어는 만들지 않는다.

### 신규 파일

- `history/HistoryRecorder.java` (이벤트 기록 단일 창구)
- `project/ProjectService.java`
- `wbs/TaskService.java`
- `wbs/MilestoneService.java`
- 테스트 4개

### HistoryRecorder 계약

```java
// 이 메서드만 timeline_event를 생성한다. 각 서비스에서 직접 만들지 않는다.
// before == after면 기록하지 않는다.
// 항상 호출자와 같은 @Transactional 안에서 실행한다.
void record(Long projectId, String type, String summary,
            @Nullable Object before, @Nullable Object after,
            @Nullable String reason, String refType, Long refEntityId);
```

### 서비스 메서드

| 서비스 | 메서드 | 이력 기록 |
| --- | --- | --- |
| ProjectService | `listProjects`, `getHome` | — |
| TaskService | `getTaskTree`, `createProcess`, `createSubTask` | — |
| TaskService | `updateTask` (이름·담당 부서·담당자) | — |
| TaskService | `updateProgress` (진행률) *(보완 4)* | PROGRESS_UPDATED (사유 선택) |
| TaskService | `changeSchedule` (계획일) | SCHEDULE_CHANGED (사유 필수) |
| TaskService | `changeActualDates` (실제 시작·종료일) *(보완 4)* | ACTUAL_DATE_CHANGED (사유 선택) |
| TaskService | `changeStatus` | STATUS_CHANGED (완료는 사유 선택, 그 외 필수) |
| TaskService | `reorder` (같은 공정 안에서만) | — |
| TaskService | `deleteTask` | TASK_DELETED (사유 필수) *(보완 5)* |
| MilestoneService | `list`, `create` | — |
| MilestoneService | `update` (날짜 변경 시) | SCHEDULE_CHANGED (사유 필수) |
| MilestoneService | `delete` | MILESTONE_DELETED (사유 필수) *(보완 5)* |

- 상태를 IN_PROGRESS로 바꿀 때 실제 시작일이 비어 있으면 오늘로 채운다. DONE으로 바꿀 때 실제 종료일이 비어 있으면 오늘로 채우고 진행률을 100으로 맞춘다. *(보완 4)*
- 모든 메서드 시작 시 `ProjectAccessChecker` 호출.

### 테스트

**HistoryRecorderTest** (`@SpringBootTest` + Testcontainers)
- [ ] 서비스에 사유 없이 일정 변경 호출 → 예외, 데이터·이벤트 모두 변경 없음 *(보완 7: 400 검증은 3단계 컨트롤러 테스트에서)*
- [ ] 일정 변경 → timeline_event 1건, before/after 정확
- [ ] 같은 값으로 저장 → 이벤트 생성 안 됨
- [ ] 이벤트 저장 실패 주입 → 일정 변경도 롤백

**TaskServiceTest** (`@SpringBootTest` + Testcontainers)
- [ ] Task 생성 → sort_order = 기존 최대 + 1
- [ ] reorder → DB에 sort_order 반영
- [ ] 다른 공정의 Task가 섞인 reorder 요청 → 거부 *(보완)*
- [ ] DONE 상태 변경 → 사유 없어도 성공, 실제 종료일·진행률 100 자동 입력 *(보완 4)*
- [ ] IN_PROGRESS 상태 변경, 사유 없음 → 예외
- [ ] 상위 공정 삭제 → 하위 세부 Task도 삭제, TASK_DELETED 이벤트 1건 *(보완 5)*

**ProjectServiceTest** (`@SpringBootTest` + Testcontainers)
- [ ] getHome: 최근 이벤트 5건·열린 이슈 수·다음 마일스톤·상태 신호와 사유 포함
- [ ] listProjects: 참여 사업만 반환 (현재는 ProjectAccessChecker 1차 뼈대라 전체 반환. 권한 단계에서 테스트 교체)

---

## 3단계: Controller + DTO + OpenAPI

**목표**: HTTP 레이어 완성, `/v3/api-docs` 확인, `docs/api.md` 갱신.

### API (17개)

| 메서드 | 경로 | 설명 |
| --- | --- | --- |
| GET | `/api/v1/projects` | 사업 목록 |
| GET | `/api/v1/projects/{projectId}` | 사업 홈 요약 |
| GET | `/api/v1/projects/{projectId}/milestones` | 마일스톤 목록 |
| POST | `/api/v1/projects/{projectId}/milestones` | 마일스톤 생성 |
| PATCH | `/api/v1/projects/{projectId}/milestones/{id}` | 수정 (날짜 변경 시 이벤트) |
| DELETE | `/api/v1/projects/{projectId}/milestones/{id}` | 삭제 (사유 필수) |
| GET | `/api/v1/projects/{projectId}/tasks` | 공정 + Task 트리 |
| POST | `/api/v1/projects/{projectId}/tasks` | 공정 생성 |
| POST | `/api/v1/projects/{projectId}/tasks/{id}/subtasks` | 세부 Task 생성 |
| PATCH | `/api/v1/projects/{projectId}/tasks/{id}` | 일반 수정 (이름·담당) |
| PATCH | `/api/v1/projects/{projectId}/tasks/{id}/progress` | 진행률 변경 *(보완 4)* |
| PATCH | `/api/v1/projects/{projectId}/tasks/{id}/schedule` | 계획 일정 변경 (사유 필수) |
| PATCH | `/api/v1/projects/{projectId}/tasks/{id}/actual-dates` | 실제 일정 변경 *(보완 4)* |
| PATCH | `/api/v1/projects/{projectId}/tasks/{id}/status` | 상태 변경 |
| PUT | `/api/v1/projects/{projectId}/tasks/reorder` | 순서 일괄 변경 |
| DELETE | `/api/v1/projects/{projectId}/tasks/{id}` | 삭제 (사유 필수) |
| GET | `/api/v1/projects/{projectId}/gantt` | 간트 조회 |

### DTO (record)

| DTO | 내용 |
| --- | --- |
| `ProjectSummaryResponse` | 목록 카드: 상태 신호·진척률·다음 마일스톤·D-day |
| `ProjectHomeResponse` | 사업 홈: 참여자·최근 이벤트 5건·열린 이슈 수·마일스톤·상태 사유 |
| `TaskResponse` | Task 단건 + `isDelayed`(계산) |
| `GanttResponse` | `milestones[]` + `processes[]` (각 공정에 `subtasks[]`) |
| `GanttProcessRow` | 공정 행: 하위 Task 기준 계획·실제 기간(최소~최대), 집계 진척률·상태 *(보완 8)* |
| `GanttTaskRow` | 세부 Task 행: 담당 부서·담당자·상태·진행률·계획/실제 날짜·지연 여부 |
| `CreateTaskRequest` | 이름·부서·담당자·날짜 (`@NotBlank`) |
| `UpdateTaskRequest` | 부분 수정 (모두 선택) |
| `ChangeProgressRequest` | progress(0~100) + reason(선택) *(보완 4)* |
| `ChangeScheduleRequest` | plannedStart·plannedEnd + reason `@NotBlank` |
| `ChangeActualDatesRequest` | actualStart·actualEnd + reason(선택) *(보완 4)* |
| `ChangeStatusRequest` | status + reason (DONE이면 null 허용) |
| `ReorderRequest` | `List<{taskId, sortOrder}>` |
| `DeleteRequest` | reason `@NotBlank` *(보완 5)* |
| `MilestoneRequest` | 이름·type·plannedDate + reason (날짜 변경 시) |
| `MilestoneResponse` | 단건 응답 |

### `@WebMvcTest` 테스트

**TaskControllerTest**
- [ ] PATCH `/tasks/{id}/schedule` 사유 누락 → 400 ProblemDetail (`errors[].field = "reason"`)
- [ ] POST `/tasks/{id}/subtasks` → 201 Created + Location 헤더
- [ ] GET `/tasks` → 공정 먼저, 각 공정에 `subtasks[]` 존재
- [ ] GET `/gantt` → `milestones[]` + `processes[]` 최상위 키 존재
- [ ] DELETE `/tasks/{id}` 사유 누락 → 400 *(보완 5)*

**ProjectControllerTest**
- [ ] GET `/projects` → 200 배열
- [ ] GET `/projects/{id}` → 200, `nextMilestone`·`openIssueCount`·`recentEvents[]` 존재
- [ ] GET `/projects/{없는 id}` → 404 ProblemDetail

**MilestoneControllerTest**
- [ ] POST → 201
- [ ] PATCH 없는 ID → 404 ProblemDetail
- [ ] DELETE → 204

### 성능 확인 *(보완 9)*
- [ ] 간트 조회는 공정·Task를 한 번의 쿼리로 가져온다 (N+1 없음). 시드 사업으로 실행 SQL 수를 로그로 확인.

---

## 완료 기준

1. 각 단계 `./mvnw test` 통과 후 커밋
2. 3단계 완료 후 `/v3/api-docs`에서 엔드포인트 17개 확인
3. Swagger에서 시드 사업의 간트 조회 → 공정·Task·마일스톤 표시 확인
4. `docs/api.md` 갱신 후 커밋

---

## 보완 사항 (원래 계획 대비)

1. **상태 판정 경계값**: 규칙은 "14일 초과 = 위험"이므로 14일(주의)과 15일(위험)을 둘 다 테스트한다.
2. **계산 테스트 보강**: 사업 진척률 집계, 반올림, 30%p 경계, 완료 Task 제외, 미갱신·기한 초과 이슈 조건 추가.
3. **Issue 엔티티 추가**: 사업 홈의 열린 이슈 수와 상태 판정에 필요하다. 이슈 CRUD는 이후 슬라이스에서 만들고, 지금은 엔티티·리포지토리만 둔다.
4. **진행률·실제 일정 입력 경로**: 원래 계획에는 계획 일정 변경만 있어서, 간트의 "실제" 막대와 진행률을 바꿀 방법이 없었다.
5. **삭제 이력**: 공정·Task·마일스톤 삭제는 사유를 받고 이벤트를 남긴다. 중간 투입자가 "왜 사라졌는지" 추적할 수 있어야 한다.
6. **이벤트 행위자·출처 컬럼**: history-logging 스킬이 요구하는 `actor`, `source` 존재 여부 확인.
7. **400 검증 위치**: Bean Validation 400은 HTTP 계층에서 일어나므로 컨트롤러 테스트에서 검증하고, 서비스 테스트는 서비스 자체의 사유 검사(이중 방어)를 검증한다.
8. **공정 행 집계 규칙**: 공정의 계획·실제 막대는 하위 Task의 최소 시작일 ~ 최대 종료일로 계산한다.
9. **N+1 확인**: 간트 조회 성능 확인 항목 추가.
