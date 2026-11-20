# 프로젝트·정부사업 트래킹 플랫폼 (ProjTrack)

사내 프로젝트와 정부사업의 진행 상황, 의사결정, 일정(WBS), 예산 집행을 한곳에 기록한다.
목표는 두 가지다. 중간에 투입된 사람도 히스토리를 빠르게 파악할 수 있어야 하고,
전체 현황을 한 화면에서 볼 수 있어야 한다.

- 상세 설계: @docs/design.md
- API 계약: @docs/api.md

## 저장소 구조

```
backend/    Spring Boot API (Java 21, Maven)    → backend/CLAUDE.md
frontend/   React + TypeScript + Vite           → frontend/CLAUDE.md
docs/       설계서, API 문서, 화면 참고 이미지(screens/), 의사결정 기록(decisions/)
docker-compose.yml   postgres, backend, frontend
```

## 핵심 원칙 (설계서 2장)

1. **1사업 1홈**: 사업 홈이 최신 상태의 기준이다.
2. **결정은 이유와 함께**: 일정·상태·예산·담당자·기준일을 바꾸면 **사유를 필수로 받고, 타임라인 이벤트를 자동으로 남긴다.** (history-logging 스킬)
3. **상태는 신호로**: 정상/주의/위험, 진척률, D-day는 저장하지 않고 규칙으로 계산한다. (calc-rules 스킬)
4. **원본은 링크**: 문서 파일을 업로드·복제하지 않는다. 원본 위치 URL만 저장한다.
5. **AI는 보조**: LLM 허브는 플랫폼 API를 조회만 하고, 상태 변경·결정 확정은 사람이 한다.

## 아키텍처 규칙

- 호출 방향은 frontend → backend → PostgreSQL이다. 외부 연동(LLM 허브, 회의록 파이프라인, 그룹웨어)은 backend의 `/api/integration/v1/**` 전용 API로만 들어온다.
- 스키마 변경은 Flyway 마이그레이션으로만 한다. (db-migration 스킬)
- 집계 값(진척률, 집행률, 월별 소계·누계, 상태 신호)은 테이블에 저장하지 않고 조회 시 계산한다. 성능 문제가 생기면 그때 캐시를 검토한다.
- 모든 엔티티는 `created_by`, `created_at`, `updated_by`, `updated_at`을 가진다.

## 보안 제약 (반드시 지킬 것)

- 사내망 전용 서비스다. **외부 API, 외부 클라우드 스토리지, 외부 LLM을 호출하는 코드를 작성하지 않는다.**
- 권한은 **사업 단위**로 확인한다. 목록·검색·집계 API도 사용자가 볼 수 있는 사업만 포함해야 한다.
- 보안등급 "기밀" 사업은 참여자 외에는 사업명·상태만 반환한다.
- 예산 금액은 PM·재무·승인권자만 조회한다. 그 외 사용자에게는 집행률만 반환한다.
- 시드·테스트 데이터에는 가상의 사업명·금액만 쓴다. 실제 사업 정보를 커밋하지 않는다.
- 접속 정보는 `.env` / `application-local.yml`에 두고 커밋하지 않는다.

## 자주 쓰는 명령어

| 대상 | 실행 | 테스트·검사 |
| --- | --- | --- |
| DB | `docker compose up -d postgres` | |
| backend | `cd backend && ./mvnw spring-boot:run -Dspring-boot.run.profiles=local` | `./mvnw test` |
| frontend | `cd frontend && npm run dev` | `npm test`, `npm run lint`, `npm run typecheck` |
| API 타입 생성 | `cd frontend && npm run gen:api` | backend 실행 중이어야 함 |

## 작업 방식

- 기능은 **세로 슬라이스**로 만든다: 마이그레이션 → 엔티티 → 서비스+테스트 → 컨트롤러 → OpenAPI 확인 → 화면. (feature-slice 스킬)
- 계산 로직(진척률, 상태 신호, 예산 시기 분류, 월별 누계)은 **테스트를 먼저 작성**한다. (calc-rules 스킬)
- 화면은 `docs/screens/`의 참고 이미지가 있으면 그 레이아웃을 따른다.
- 3개 파일 이상 바꾸는 작업은 먼저 계획을 제시하고 확인받은 뒤 구현한다.
- 완료 기준: 관련 테스트 통과 + lint/typecheck 통과 + 영향받는 docs 갱신.
- 커밋은 Conventional Commits(`feat:`, `fix:`, `refactor:`, `test:`, `docs:`). 본문은 한국어 허용.
- 추측으로 API 필드를 만들지 않는다. 필요하면 docs/api.md와 백엔드 DTO를 먼저 바꾼다.

## 도메인 용어

| 용어 | 의미 |
| --- | --- |
| 사업 (project) | 관리 단위. 유형: 사내 / 정부 |
| 공정 / Task | WBS 2단계. 공정은 작업 그룹, Task는 세부 작업 (`task.parent_id`로 구분) |
| 마일스톤 | 사업의 주요 일정 지점. 유형별 색상을 가진다 |
| 타임라인 이벤트 (event) | 사업에서 일어난 모든 일의 시간순 기록. 수동 또는 자동 |
| 결정 (decision) | 결정 내용 + 배경 + 대안 + 선택 이유 + 결정자 |
| 기준 이벤트 (base_event) | 예산 집행 시기를 가르는 기준일 (예: JV 설립). 미정 허용 |
| 집행 항목 (payment) | 선금·중도금·잔금 등. 계획일·계획금액·실집행일·집행금액 |
| 의무 일정 (obligation) | 정부사업의 보고·정산·성과 제출 기한 |
