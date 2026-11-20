# frontend — React

## 스택

- React 18 + TypeScript (strict) + Vite
- 라우팅: React Router / 서버 상태: TanStack Query / 폼: React Hook Form + Zod
- 테이블: TanStack Table / 날짜: date-fns
- 간트·일정 뷰: **직접 구현** (CSS Grid + 절대 위치 막대). 참고 화면의 계획·실제 2줄 막대, 마일스톤 칩, 기준선 표현이 라이브러리로는 맞추기 어렵다.
- 테스트: Vitest + React Testing Library, API 모킹은 MSW

## 폴더 구조

```
src/
├─ api/          OpenAPI 생성 타입(generated/), API 함수, Query 훅
├─ pages/        Dashboard, ProjectHome, Timeline, Wbs, Budget, GovGrant, Weekly
├─ features/     gantt/, budget-schedule/, decision-log/, issue-register/ 등
├─ components/   공용 UI (Button, Badge, StatusLight, FilterChips, EmptyState)
├─ lib/          날짜·금액 포맷터, 상수
└─ test/         MSW 핸들러, 픽스처
```

## 코딩 규칙

- API 타입은 손으로 쓰지 않는다. `npm run gen:api`로 갱신해서 쓴다.
- 서버 데이터는 TanStack Query로만 다룬다. 계산 값(진척률, 상태, 집행률)은 **백엔드 응답을 그대로 표시**하고 프론트에서 다시 계산하지 않는다.
- 모든 화면에 로딩, 빈 상태, 에러 상태를 만든다.
- 필터·보기 모드(목록/간트, 주 단위/기간 축소)는 URL 쿼리스트링에 둔다. 링크를 공유하면 같은 화면이 열려야 한다.
- `any` 금지.

## 표시 규칙

| 항목 | 규칙 |
| --- | --- |
| 날짜 | `2026.10.30` (목록), `10/30` (간트 눈금) |
| 금액 | 백만원 단위, 천 단위 콤마. 예: `10,927백만원` |
| 상태 배지 | 예정(회색), 진행중(파랑), 완료(초록), 지연(빨강) |
| 상태 신호 | 정상(초록), 주의(주황), 위험(빨강) + 텍스트 라벨 (색만으로 구분 금지) |
| 간트 막대 | 계획 = 테두리만, 실제 = 채움. 오늘 = 빨간 세로선, 기준 이벤트 = 보라 점선 |

## 간트 구현 규칙

- 왼쪽 고정 표(공정/Task, 담당 부서, 담당자, 상태, 진행률) + 오른쪽 가로 스크롤 타임라인.
- 눈금 단위: 주 단위(1주 = 고정 px) / 기간 축소(전체 기간을 화면 폭에 맞춤).
- 공정 행은 접기·펼치기, 하위 Task 요약 막대를 표시한다.
- 막대 드래그로 일정을 바꾸면 **사유 입력 모달**을 띄우고, 사유 없이는 저장하지 않는다.
- Task 200개 이상이면 행 가상화를 적용한다.

## 명령어

- 개발 서버: `npm run dev` (`/api` → `http://localhost:8080` 프록시)
- 검사: `npm run lint`, `npm run typecheck`, `npm test`
