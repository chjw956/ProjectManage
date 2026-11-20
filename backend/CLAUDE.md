# backend — Spring Boot API

## 스택

- Java 21, **Spring Boot 4.1.x**, **Maven** (`pom.xml`, Maven Wrapper `mvnw`)
  - Gradle을 쓰지 않는다. `build.gradle`, `gradlew`를 만들지 않는다. (사내망에서 Gradle 배포 서버 접속 불가)
  - 의존성은 `pom.xml`에 추가한다. Spring Boot가 버전을 관리하는 라이브러리(parent BOM)는 `<version>`을 적지 않는다. BOM 밖 라이브러리(springdoc 등)만 버전을 명시하고, 버전 값은 `<properties>`에 모은다.
  - 새 의존성을 추가하기 전에 사용자에게 먼저 알린다. 사내망에서 Maven Central 외 저장소는 접속이 안 될 수 있다.
  - Boot 4 기준으로 작성한다. Boot 3 시절 예제(블로그·Stack Overflow)를 그대로 옮기지 않는다.
  - JSON은 Jackson 3 (`tools.jackson.*` 패키지). `com.fasterxml.jackson.databind`를 import하지 않는다.
  - 기능별 스타터가 모듈로 나뉘어 있다. 자동 설정이 안 잡히면 해당 `spring-boot-starter-*` 의존성부터 확인한다.
  - springdoc-openapi는 `springdoc-openapi-starter-webmvc-ui` 2.x를 쓴다 (Maven Central 최신 2.8.6, Boot 3/4 모두 지원). 3.x는 미출시.
- Spring Web, Spring Data JPA (+ QueryDSL 또는 JPQL), Flyway, PostgreSQL
- Spring Security (사내 AD/LDAP 로그인), springdoc-openapi
- 스케줄러: Spring `@Scheduled` (기한 알림, 미갱신 경고)
- 테스트: JUnit 5, AssertJ, Testcontainers(PostgreSQL)

## 패키지 구조 (도메인별)

```
com.example.projtrack
├─ common/        에러 처리(ProblemDetail), 페이징, 감사 필드, 공통 DTO
├─ auth/          AD 로그인, 사용자, 사업 단위 권한 확인(ProjectAccessChecker)
├─ project/       사업, 참여자, 사업 홈 요약
├─ wbs/           공정·Task, 마일스톤, 간트 조회
├─ history/       타임라인 이벤트, 결정 로그, 이슈
├─ budget/        기준 이벤트, 집행 항목, 월별 소계·누계
├─ gov/           정부사업(협약), 의무 일정, 비목
├─ weekly/        주간 업데이트, 주간 보고서
├─ dashboard/     포트폴리오 집계
├─ notify/        스케줄러, 메일·메신저 발송
└─ integration/   LLM 허브·회의록·그룹웨어용 API (/api/integration/v1/**)
```

각 도메인은 `controller / service / repository / domain / dto`로 나눈다.

## 코딩 규칙

- Controller → Service → Repository. 컨트롤러에 비즈니스 로직을 두지 않는다.
- 엔티티를 응답으로 노출하지 않는다. 요청·응답은 `record` DTO.
- 트랜잭션은 서비스 계층에서 관리하고, 조회는 `readOnly = true`.
- API 경로는 `/api/v1/projects/{projectId}/...`처럼 사업 하위 리소스로 둔다.
- **모든 서비스 메서드 시작 시 `ProjectAccessChecker`로 권한을 확인한다.** 컨트롤러 애노테이션만 믿지 않는다.
- 금액은 `BigDecimal`(원 단위)로 저장하고, 백만원 변환은 응답 DTO에서만 한다.
- 날짜는 `LocalDate`, 시각은 `OffsetDateTime`(Asia/Seoul). "오늘"은 주입 가능한 `Clock`에서 가져온다 (테스트용).
- 변경 이력이 필요한 수정은 `history-logging` 스킬의 규칙을 따른다.
- 계산 로직은 `*Calculator` 클래스(순수 함수)로 분리한다. `calc-rules` 스킬 참고.

## 연동 API (`integration` 패키지)

- 인증: 서비스 계정 토큰 + 요청 사용자 ID 헤더. **응답 범위는 요청 사용자의 권한으로 제한**한다.
- 조회: 사업 목록·상태, 사업 홈 요약, 타임라인(기간·유형 필터), 결정 로그, 의무 일정, 예산 집행률
- 등록: 주간 업데이트, 회의록 이벤트, 결재 완료 이벤트 (출처 = 자동)
- 응답에는 항상 원본 링크(사업 홈 URL, 문서 URL)를 포함해 LLM 답변의 근거로 쓰게 한다.

## 테스트

- Calculator: 순수 단위 테스트 (DB 없음)
- 리포지토리: `@DataJpaTest` + Testcontainers PostgreSQL (H2 금지)
- 컨트롤러: `@WebMvcTest`로 검증·응답 형태·권한 거부(403) 확인
- 권한 테스트 필수 케이스: 비참여자 조회, 기밀 사업 마스킹, 예산 금액 마스킹
- Testcontainers는 **2.x**를 쓴다. Docker Desktop 29는 Docker API 1.44 이상만 허용하므로 1.x로 내리지 않는다.
  - artifactId: `testcontainers-junit-jupiter`, `testcontainers-postgresql` (1.x의 `junit-jupiter`, `postgresql`과 다름)
  - Spring Boot BOM이 1.x를 관리하므로 `pom.xml` `<properties>`에 `testcontainers.version`을 2.x 최신으로 명시한다.

## 명령어

- 실행: `./mvnw spring-boot:run -Dspring-boot.run.profiles=local`
- 테스트: `./mvnw test` (특정 클래스만: `./mvnw test -Dtest=PaymentCalculatorTest`)
- 빌드: `./mvnw clean package` (테스트 건너뛰기 금지: `-DskipTests`를 쓰지 않는다)
- Windows PowerShell에서는 `./mvnw` 대신 `.\mvnw.cmd`
- 프록시·미러 설정이 필요하면 `~/.m2/settings.xml`에 둔다 (레포에 커밋하지 않음)
- OpenAPI: 실행 후 `http://localhost:8080/v3/api-docs`
