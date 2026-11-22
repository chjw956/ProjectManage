# 변경 이력 (CHANGELOG)

이 파일은 ProjTrack의 주요 변경사항을 기록한다.
형식은 [Keep a Changelog](https://keepachangelog.com/ko/1.1.0/)를 따르고,
버전은 [유의적 버전(SemVer)](https://semver.org/lang/ko/)을 따른다.

- 작업 중인 변경은 `Unreleased`에 적고, 릴리스할 때 버전 번호와 날짜를 붙여 옮긴다.
- 분류: `추가`(새 기능) · `변경`(기존 동작 변경) · `수정`(버그 수정) · `제거` · `보안`
- DB 마이그레이션이 포함되면 버전(V*) 번호를 함께 적는다.

## [Unreleased]

## [0.4.0] - 2026-11-22

WBS·간트 화면에서 공정·Task·마일스톤 일정 관리, 담당자 변경 사유 필수화.

### 추가
- **WBS·간트 화면에서 일정 관리**
  - 공정 추가(헤더 "+ 공정", 공정이 없을 때 "첫 공정 추가하기"), 세부 Task 추가(공정 행 "+ 작업")
  - 공정·Task 상세 창에 "정보 수정"(이름·부서·담당자)·"삭제" 추가. 삭제는 사유 필수, 공정 삭제 시 하위 Task 수 경고
  - "마일스톤 관리" 창: 마일스톤 추가·수정(계획일 변경 시 사유 필수, 변경 전→후 표시)·삭제(사유 필수)
  - 일정 변경 창에 변경 전 → 후 표시, 서버 오류 메시지 표시
- 공용 모달 컴포넌트 `components/Modal`, 오류 메시지 유틸 `lib/api-error`

### 변경
- **Task 담당자 변경은 사유 필수**: `PUT /api/v1/projects/{projectId}/tasks/{taskId}`에 `reason` 추가. 담당자가 실제로 바뀌면 사유가 없을 때 400, 바뀌면 타임라인 `MEMBER_CHANGED` 기록 (이름·부서는 사유 불필요)
- 공정·Task 생성과 계획 일정 변경에서 종료일이 시작일보다 앞서면 400
- 마일스톤을 계획일 없이 생성하면 DB 오류(500) 대신 400
- OnlyOffice 콜백 API에 `operationId=onlyOfficeCallback` 지정 → `npm run gen:api` 전체 재생성 가능 (`useCallback` 이름 충돌 해소)

### 수정
- 일정 변경·추가·수정·삭제 후 간트·마일스톤·사업 홈·대시보드가 다시 불러와지지 않던 문제
- 검색 필터 중 공정 상세의 "세부 Task N건"이 필터된 수로 표시되던 문제

## [0.3.0] - 2026-11-22

증적자료 폴더 등록, 열린 이슈 모달, WBS·간트 상세 보기.

### 추가
- **사업 등록 시 증적자료 폴더 등록 (선택)**: 새 프로젝트 등록 모달에 폴더 이름·NAS 경로 입력란 추가
  - `POST /api/v1/projects`에 `evidenceFolderLabel`, `evidenceFolderPath` 필드 추가. 경로가 있으면 폴더 이름 필수
  - 사업과 폴더를 같은 트랜잭션으로 등록하고, 폴더 등록이 실패하면 사업 등록도 롤백
  - 등록 실패 시 서버 오류 메시지를 모달에 표시
- **열린 이슈 모달**: 대시보드 카드의 "열린 이슈 N건"과 사업 홈의 "열린 이슈" 카드를 누르면 이슈 목록 모달 표시
  - 이슈 조회 API `GET /api/v1/projects/{projectId}/issues?status=open` (CLOSED 제외, 조회 전용)
  - 정렬: 등급(상→중→하) → 목표일 빠른 순(미정은 뒤) → 발생일 순
  - 목표일 경과 여부(`overdue`)를 서버에서 계산해 "기한 초과"로 표시
  - 이슈 0건이면 버튼 비활성화
  - 공용 컴포넌트 `features/issue-register/OpenIssuesModal`
- **WBS·간트 공정/Task 상세 보기**: 왼쪽 표의 공정·Task 이름을 누르면 상세 창 표시 (`features/gantt/WbsItemDetailModal`)
  - Task: 소속 공정, 상태(지연 포함), 진행률, 담당 부서·담당자, 계획·실제 기간. "일정 변경" 버튼으로 일정 변경 창 전환
  - 공정: 상태, 진행률, 담당자, 계획 기간, 세부 Task 수, 공사 여부, 금액
  - 간트 막대 클릭은 기존과 같이 일정 변경 창을 연다

### 변경
- NAS 경로가 허용 루트 밖일 때 응답을 `403 Forbidden` → `400 Bad Request`로 변경 (`InvalidNasPathException`). 폴더 등록·수정·파일 조회 API 모두 해당

## [0.2.0] - 2026-11-22

사업 등록, NAS·OnlyOffice 연동, frontend 초기 구성.

### 추가
- **사업 등록 API**: `POST /api/v1/projects` — 사업명·유형(INTERNAL/GOV)·단계·기간·한 줄 요약으로 신규 사업 생성 (`CreateProjectRequest`)
- **NAS 폴더 연동**
  - 사업별 NAS 폴더 등록·조회·수정·삭제: `/api/v1/projects/{projectId}/folders`
  - 폴더 내 파일 목록 조회·새 파일 생성: `/api/v1/projects/{projectId}/folders/{folderId}/files`
  - 파일 스트리밍: `GET /api/files/stream`
  - 접근 허용 루트 설정 `nas.allowed-roots` (기본 `/mnt/nas`)
  - 새 문서용 빈 템플릿 `templates/blank.docx`, `templates/blank.xlsx`
- **OnlyOffice 문서 편집 연동**
  - 에디터 설정 조회 `GET /api/v1/onlyoffice/config`, 저장 콜백 `POST /api/v1/onlyoffice/callback`
  - `backend/compose.yaml`에 `onlyoffice/documentserver:8.2` 서비스 추가 (포트 8081)
  - 설정 `onlyoffice.server-url`, `onlyoffice.callback-host`
- **DB 마이그레이션 V3** (`V3__add_project_folder.sql`): `project_folder` 테이블 추가
- **frontend 초기 구성**: React 19 + TypeScript + Vite, TanStack Query/Table, React Router, orval API 타입 생성
  - 화면: 대시보드, 사업 홈, WBS·간트, NAS 파일
  - 공통 컴포넌트: `Badge`, `EmptyState`, `StatusLight`
  - MSW 기반 테스트 핸들러·픽스처
- **문서**: `docs/api.md`에 프로젝트·마일스톤 API 계약 작성

### 변경
- 로컬 시드(`R__seed_local.sql`)를 2026-11-21 기준으로 재구성: 사용자 3명, 가상 사업 2건(ERP·AI R&D)의 마일스톤, 공정 5개, 세부 Task 12개

## [0.1.0] - 2026-11-21

1단계 공통 기반과 WBS·마일스톤·프로젝트 슬라이스. (`e260d03`)

### 추가
- **DB 마이그레이션**
  - V1 (`V1__create_schema.sql`): 전체 스키마 생성
  - V2 (`V2__extend_timeline_event.sql`): timeline_event 확장
  - R (`R__seed_local.sql`): 로컬 시드
- **WBS(공정·Task) API**: 생성·수정·삭제, 순서 변경, 일정·실제일·상태·진행률 변경
  - 일정 변경은 사유 필수 + 타임라인 `SCHEDULE_CHANGED` 이벤트 자동 기록
- **마일스톤 API**: 목록·생성·수정(날짜 변경 시 이벤트 기록)
- **간트 API**: 계획 대비 실제 일정 조회
- **프로젝트 API**: 사업 목록(포트폴리오 대시보드), 사업 홈 요약
- **계산 로직**: `TaskCalculator`(진척률·지연 판정), `ProjectStatusCalculator`(상태 신호) — 순수 함수 + 단위 테스트
- **테스트**: `@WebMvcTest` 컨트롤러 테스트, `@DataJpaTest` 리포지토리 테스트, Testcontainers 설정
- **API 문서**: springdoc-openapi Swagger UI (`/swagger-ui.html`)
- **문서**: 설계서 `docs/design.md`, 슬라이스 계획 `docs/plans/slice-01-project-wbs.md`, 화면 참고 이미지 `docs/screens/`

[Unreleased]: https://github.com/chjw956/ProjectManage/compare/v0.4.0...HEAD
[0.4.0]: https://github.com/chjw956/ProjectManage/compare/v0.3.0...v0.4.0
[0.3.0]: https://github.com/chjw956/ProjectManage/compare/v0.2.0...v0.3.0
[0.2.0]: https://github.com/chjw956/ProjectManage/compare/v0.1.0...v0.2.0
[0.1.0]: https://github.com/chjw956/ProjectManage/releases/tag/v0.1.0
