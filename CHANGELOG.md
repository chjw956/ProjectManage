# 변경 이력 (CHANGELOG)

이 파일은 ProjTrack의 주요 변경사항을 기록한다.
형식은 [Keep a Changelog](https://keepachangelog.com/ko/1.1.0/)를 따르고,
버전은 [유의적 버전(SemVer)](https://semver.org/lang/ko/)을 따른다.

- 작업 중인 변경은 `Unreleased`에 적고, 릴리스할 때 버전 번호와 날짜를 붙여 옮긴다.
- 분류: `추가`(새 기능) · `변경`(기존 동작 변경) · `수정`(버그 수정) · `제거` · `보안`
- DB 마이그레이션이 포함되면 버전(V*) 번호를 함께 적는다.

## [Unreleased]

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

[Unreleased]: https://github.com/chjw956/ProjectManage/compare/v0.1.0...HEAD
[0.1.0]: https://github.com/chjw956/ProjectManage/releases/tag/v0.1.0
