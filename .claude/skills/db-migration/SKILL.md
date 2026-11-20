---
name: db-migration
description: PostgreSQL 테이블·컬럼·인덱스를 추가하거나 바꿀 때 사용한다. Flyway 마이그레이션 파일 작성 규칙, 핵심 테이블 목록, 검증 절차를 담고 있다.
---

# DB 마이그레이션 (Flyway + PostgreSQL)

## 파일 규칙

- 위치: `backend/src/main/resources/db/migration/`
- 이름: `V{번호}__{설명}.sql` (예: `V5__create_payment.sql`). 번호는 기존 최대값 + 1
- 로컬 시드 데이터는 `R__seed_local.sql` (local 프로필에서만 실행)
- **이미 커밋된 마이그레이션 파일은 절대 수정하지 않는다.** 새 파일을 추가한다.

## 작성 규칙

- snake_case, PK는 `id BIGSERIAL`
- 모든 테이블에 `created_by`, `created_at TIMESTAMPTZ DEFAULT now()`, `updated_by`, `updated_at`
- FK에는 인덱스를 함께 만든다
- 상태 값은 `VARCHAR` + `CHECK` 제약 (ENUM 타입 지양)
- 금액은 `NUMERIC(18,0)` (원 단위)
- 집계 값(진척률, 집행률, 상태 신호)은 컬럼으로 만들지 않는다
- 기존 데이터가 있는 테이블에 NOT NULL 컬럼 추가 시: 추가 → 값 채우기 → NOT NULL 순서로 나눈다

## 핵심 테이블 (설계서 5장)

| 그룹 | 테이블 | 비고 |
| --- | --- | --- |
| 사업 | project | 유형(사내/정부), 단계, 보안등급, 한 줄 요약 |
| | project_member | 역할(PM/참여/승인/외부), 투입일·이탈일 |
| 일정 | milestone | 유형(색상), 계획일, 실제일 |
| | task | `parent_id`(공정→Task), 계획·실제 시작·종료일, 진행률, 정렬 순서, 공정 조건(공사 여부·금액) |
| 이력 | event | 유형, 요약, before/after(JSONB), reason, source, 대상 타입·ID |
| | decision | 배경, 대안, 선택 이유, 결정자, 상태, 후속 결정 ID |
| | issue | 등급, 담당자, 목표일, 대응 방안, 상태 |
| | document_link | 제목, 유형, 원본 URL (파일 저장 안 함) |
| | weekly_update | 주차, 한 일, 할 일, 이슈 |
| 예산 | base_event | 명칭, 예정일(NULL 허용), 메모 |
| | payment | 구분(선금/중도금/잔금), 집행 주체, 계획일·계획금액, 실집행일·집행금액, 상태, 증빙 URL, budget_line_id(정부사업) |
| 정부사업 | gov_grant | 과제번호, 전담기관, 협약 기간, 정부출연금, 기업부담금 (project 1:1) |
| | obligation | 유형(보고/정산/성과), 기한, 상태, 제출본 URL |
| | budget_line | 비목, 예산 |

## 권장 인덱스

- `event (project_id, occurred_at DESC)`: 타임라인 조회
- `task (project_id, parent_id, sort_order)`: 간트 조회
- `payment (project_id, planned_date)`: 월별 집계
- `obligation (due_date) WHERE status <> 'DONE'`: 기한 알림

## 검증 절차

1. `docker compose up -d postgres`
2. `./mvnw spring-boot:run -Dspring-boot.run.profiles=local` 실행 후 로그에서 `Successfully applied N migrations` 확인
3. `./mvnw test` (Testcontainers가 빈 DB에 전체 마이그레이션을 적용함)
4. `spring.jpa.hibernate.ddl-auto=validate`로 엔티티와 일치 확인
5. `docs/design.md` 데이터 모델 표 갱신
