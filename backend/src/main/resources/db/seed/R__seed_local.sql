-- =============================================================
-- R: 로컬 개발용 가상 시드 데이터 (Repeatable migration)
-- 실제 사업명·금액 사용 금지. 가상 데이터만 삽입.
-- application-local.yml 의 flyway.locations에
-- classpath:db/seed 추가 시에만 실행됨.
-- =============================================================
-- R__ 은 파일 내용이 바뀔 때만 재실행된다.
-- 재실행 시에도 일관된 데이터를 보장하기 위해 먼저 모든 관련 테이블을 초기화한다.
-- RESTART IDENTITY 로 시퀀스를 1부터 재시작해 아래 INSERT의 하드코딩 FK가 항상 맞는다.
-- =============================================================

TRUNCATE TABLE
    project_folder,
    budget_line, obligation,
    decision, weekly_update, issue,
    payment, timeline_event,
    base_event, task, milestone,
    gov_grant, project_member,
    project, app_user
RESTART IDENTITY CASCADE;

-- -------------------------
-- app_user  (user_id: kminj=1, lseoy=2, parkth=3)
-- -------------------------
INSERT INTO app_user (username, display_name, email, dept, created_by, updated_by)
VALUES
    ('kminj',  '김민준', 'kminj@example.internal',  '디지털혁신팀', 'system', 'system'),
    ('lseoy',  '이서연', 'lseoy@example.internal',  '연구지원팀',   'system', 'system'),
    ('parkth', '박태현', 'parkth@example.internal', '개발팀',       'system', 'system');

-- -------------------------
-- project  (project_id: ERP=1, AI=2)
-- 상태 신호는 쿼리 시 계산됨 (status 컬럼은 무시, ProjectStatusCalculator 참조)
-- -------------------------
INSERT INTO project (name, type, phase, status, start_date, end_date, summary, security_level, created_by, updated_by)
VALUES
    (
        '차세대 ERP 구축 프로젝트',
        'INTERNAL',
        '개발',
        'NORMAL',
        '2026-01-06',
        '2027-06-30',
        '노후 ERP를 클라우드 기반 차세대 시스템으로 전환하는 사내 IT 프로젝트',
        'NORMAL',
        'kminj',
        'kminj'
    ),
    (
        'AI 기반 공정 최적화 기술 개발',
        'GOV',
        '1차 연도',
        'NORMAL',
        '2026-03-01',
        '2027-02-28',
        '정부 R&D 과제. AI 모델을 활용해 생산 공정의 품질 불량률을 20% 이상 저감',
        'NORMAL',
        'lseoy',
        'lseoy'
    );

-- -------------------------
-- project_member
-- -------------------------
INSERT INTO project_member (project_id, user_id, role, joined_at, created_by, updated_by)
VALUES
    (1, 1, 'PM',     '2026-01-06', 'system', 'system'),
    (1, 2, 'MEMBER', '2026-02-01', 'system', 'system'),
    (1, 3, 'MEMBER', '2026-04-01', 'system', 'system'),
    (2, 2, 'PM',     '2026-03-01', 'system', 'system'),
    (2, 1, 'MEMBER', '2026-03-01', 'system', 'system');

-- -------------------------
-- milestone
-- 오늘 기준(2026-11-21):
--   ERP '1차 개발 완료' D-55 → nextMilestone
--   AI  '중간 보고'     D-99 → nextMilestone
-- -------------------------
INSERT INTO milestone (project_id, name, type, planned_date, actual_date, status, created_by, updated_by)
VALUES
    -- project 1 (ERP)
    (1, 'RFP 확정 및 업체 선정',    'DECISION', '2026-02-28', '2026-02-28', 'DONE',    'kminj', 'kminj'),
    (1, '1차 개발 완료 (UAT 진입)', 'DELIVERY', '2027-01-15', NULL,          'PENDING', 'kminj', 'kminj'),
    (1, '시스템 최종 오픈',          'DELIVERY', '2027-06-30', NULL,          'PENDING', 'kminj', 'kminj'),
    -- project 2 (AI R&D)
    (2, '착수 보고',                 'REPORT',   '2026-04-15', '2026-04-15', 'DONE',    'lseoy', 'lseoy'),
    (2, '중간 보고',                 'REPORT',   '2027-02-28', NULL,          'PENDING', 'lseoy', 'lseoy');

-- -------------------------
-- task — 공정(parent_id NULL): task_id 1~5
-- 삽입 순서가 BIGSERIAL 값 순서를 결정하므로 공정을 먼저 삽입한다.
-- -------------------------
INSERT INTO task (project_id, parent_id, name, dept, assignee,
                  planned_start, planned_end, actual_start, actual_end,
                  status, progress, sort_order, is_work, created_by, updated_by)
VALUES
    -- ERP 공정 1: task_id=1
    (1, NULL, '요구사항 분석 및 설계', '디지털혁신팀', '김민준',
     '2026-01-06', '2026-03-31', '2026-01-06', '2026-04-05',
     'DONE', 100, 1, FALSE, 'kminj', 'kminj'),

    -- ERP 공정 2: task_id=2
    (1, NULL, '개발 및 단위 테스트', '디지털혁신팀', '박태현',
     '2026-04-01', '2026-10-31', '2026-04-10', NULL,
     'IN_PROGRESS', 50, 2, FALSE, 'kminj', 'kminj'),

    -- ERP 공정 3: task_id=3
    (1, NULL, '통합 테스트 및 UAT', '디지털혁신팀', '김민준',
     '2026-11-01', '2027-01-15', '2026-11-10', NULL,
     'IN_PROGRESS', 10, 3, FALSE, 'kminj', 'kminj'),

    -- AI 공정 1: task_id=4
    (2, NULL, '1차 연도 연구 수행', '연구지원팀', '이서연',
     '2026-03-01', '2027-02-28', '2026-03-05', NULL,
     'IN_PROGRESS', 40, 1, FALSE, 'lseoy', 'lseoy'),

    -- AI 공정 2: task_id=5
    (2, NULL, '현장 적용 및 검증', '기술지원팀', '박태현',
     '2027-03-01', '2027-12-31', NULL, NULL,
     'PENDING', 0, 2, FALSE, 'lseoy', 'lseoy');

-- -------------------------
-- task — 세부 Task(parent_id NOT NULL): task_id 6~17
-- -------------------------
INSERT INTO task (project_id, parent_id, name, dept, assignee,
                  planned_start, planned_end, actual_start, actual_end,
                  status, progress, sort_order, is_work, created_by, updated_by)
VALUES
    -- ERP 공정1 (parent_id=1) 세부 ----------------
    -- task_id=6
    (1, 1, 'AS-IS 프로세스 조사', '디지털혁신팀', '김민준',
     '2026-01-06', '2026-01-31', '2026-01-06', '2026-01-28',
     'DONE', 100, 1, FALSE, 'kminj', 'kminj'),

    -- task_id=7
    (1, 1, 'TO-BE 아키텍처 설계', '디지털혁신팀', '이서연',
     '2026-02-01', '2026-03-31', '2026-02-01', '2026-04-05',
     'DONE', 100, 2, FALSE, 'kminj', 'kminj'),

    -- ERP 공정2 (parent_id=2) 세부 ----------------
    -- task_id=8
    (1, 2, '핵심 모듈 개발', '디지털혁신팀', '박태현',
     '2026-04-01', '2026-07-31', '2026-04-10', NULL,
     'IN_PROGRESS', 80, 1, FALSE, 'kminj', 'kminj'),

    -- task_id=9
    (1, 2, '보고서·출력 모듈 개발', '디지털혁신팀', '박태현',
     '2026-07-01', '2026-10-31', '2026-09-01', NULL,
     'IN_PROGRESS', 20, 2, FALSE, 'kminj', 'kminj'),

    -- task_id=10  (계획 종료일 2026-10-31 < 오늘 2026-11-21, 미완료 → DELAYED)
    (1, 2, '단위 테스트 수행', '디지털혁신팀', '이서연',
     '2026-10-01', '2026-10-31', NULL, NULL,
     'DELAYED', 0, 3, FALSE, 'kminj', 'kminj'),

    -- ERP 공정3 (parent_id=3) 세부 ----------------
    -- task_id=11
    (1, 3, '통합 테스트 계획 수립', '디지털혁신팀', '김민준',
     '2026-11-01', '2026-11-30', '2026-11-10', NULL,
     'IN_PROGRESS', 30, 1, FALSE, 'kminj', 'kminj'),

    -- task_id=12
    (1, 3, 'UAT 시나리오 작성', '디지털혁신팀', '이서연',
     '2026-12-01', '2026-12-31', NULL, NULL,
     'PENDING', 0, 2, FALSE, 'kminj', 'kminj'),

    -- task_id=13
    (1, 3, 'UAT 실시 및 결함 조치', '디지털혁신팀', '박태현',
     '2027-01-02', '2027-01-15', NULL, NULL,
     'PENDING', 0, 3, FALSE, 'kminj', 'kminj'),

    -- AI 공정1 (parent_id=4) 세부 -----------------
    -- task_id=14
    (2, 4, 'AI 모델 프로토타입 개발', '연구지원팀', '이서연',
     '2026-03-01', '2026-07-31', '2026-03-05', '2026-08-10',
     'DONE', 100, 1, FALSE, 'lseoy', 'lseoy'),

    -- task_id=15
    (2, 4, '중간 성과 평가 준비', '연구지원팀', '이서연',
     '2026-07-01', '2026-09-30', '2026-07-10', NULL,
     'IN_PROGRESS', 60, 2, FALSE, 'lseoy', 'lseoy'),

    -- task_id=16
    (2, 4, '연차 보고서 작성', '연구지원팀', '이서연',
     '2027-01-01', '2027-02-28', NULL, NULL,
     'PENDING', 0, 3, FALSE, 'lseoy', 'lseoy'),

    -- AI 공정2 (parent_id=5) 세부 -----------------
    -- task_id=17
    (2, 5, '파일럿 라인 선정', '기술지원팀', '박태현',
     '2027-03-01', '2027-04-30', NULL, NULL,
     'PENDING', 0, 1, FALSE, 'lseoy', 'lseoy');

-- -------------------------
-- base_event  (base_event_id=1)
-- -------------------------
INSERT INTO base_event (project_id, name, planned_date, memo, created_by, updated_by)
VALUES
    (2, 'JV 설립', NULL, '협약 협의 중. 확정 시 집행 시기 재분류 필요.', 'lseoy', 'lseoy');

-- -------------------------
-- payment
-- -------------------------
INSERT INTO payment (project_id, pay_type, executor_type, planned_date, planned_amount, status, created_by, updated_by)
VALUES
    (1, 'ADVANCE', '자사', '2026-02-15',  50000000, 'PAID',    'kminj', 'kminj'),
    (2, 'ADVANCE', '자사', '2026-04-30', 100000000, 'PENDING', 'lseoy', 'lseoy');

UPDATE payment SET actual_date = '2026-02-14', actual_amount = 50000000 WHERE payment_id = 1;

-- -------------------------
-- timeline_event  (event_id: 1~6)
-- 마지막 이벤트가 14일 이내여야 "미갱신" CAUTION이 발생하지 않는다.
-- ERP 최종 이벤트: 2026-11-10 (11일 전)
-- AI  최종 이벤트: 2026-11-15 (6일 전)
-- -------------------------
INSERT INTO timeline_event (project_id, event_date, type, summary, author, source, importance, created_by, updated_by)
VALUES
    (1, '2026-01-06', 'START',        '차세대 ERP 구축 프로젝트 착수',                          '김민준', 'MANUAL', 2, 'kminj', 'kminj'),
    (1, '2026-02-28', 'DECISION',     'ERP 솔루션 최종 선정 — A사 제품으로 확정',               '김민준', 'MANUAL', 2, 'kminj', 'kminj'),
    (1, '2026-11-10', 'ISSUE_OPENED', 'ERP 보안 감사 요건 추가 이슈 등록',                       '김민준', 'MANUAL', 1, 'kminj', 'kminj'),
    (2, '2026-03-01', 'START',        'AI 기반 공정 최적화 기술 개발 착수',                       '이서연', 'MANUAL', 2, 'lseoy', 'lseoy'),
    (2, '2026-04-15', 'REPORT',       '전담기관 착수 보고 완료. 연구계획서 최종 승인',            '이서연', 'MANUAL', 1, 'lseoy', 'lseoy'),
    (2, '2026-11-15', 'STATUS_CHANGED','1차 연도 중간 연구 현황 점검 완료',                       '이서연', 'MANUAL', 0, 'lseoy', 'lseoy');

-- -------------------------
-- decision
-- event_id=2: ERP DECISION 이벤트 참조
-- -------------------------
INSERT INTO decision (project_id, event_id, decision_date, content, background, alternatives, reason, decider, status, created_by, updated_by)
VALUES
    (
        1, 2,
        '2026-02-28',
        'ERP 솔루션을 A사 제품으로 최종 선정',
        '총 3개 업체가 제안서를 제출했으며, 기술·가격·유지보수 항목을 종합 평가함',
        'B사: 기능 완성도 높으나 커스터마이징 비용 과다. C사: 가격 경쟁력 있으나 레퍼런스 부족',
        'A사가 기술 점수 1위이며 사내 보안 요건을 충족하는 유일한 제품',
        '김민준', 'VALID', 'kminj', 'kminj'
    ),
    (
        2, NULL,
        '2026-03-15',
        '1차 연도 AI 모델 아키텍처를 CNN 기반 이상 탐지 모델로 결정',
        '초기 데이터 분석 결과 이미지 기반 불량 패턴이 전체의 70%를 차지함',
        'RNN 기반 시계열 모델도 검토했으나 현재 데이터셋 구조에 적합하지 않음',
        '이미지 데이터 비율 고려 시 CNN이 초기 성능 목표(불량률 20% 저감) 달성에 유리',
        '이서연', 'VALID', 'lseoy', 'lseoy'
    );

-- -------------------------
-- issue
-- ERP: HIGH 이슈(OPEN, 기한 미초과) → CAUTION 신호 발생
--       MID 이슈(IN_PROGRESS)       → 신호에 영향 없음
-- AI:  이슈 없음 → NORMAL 신호 유지
-- -------------------------
INSERT INTO issue (project_id, title, grade, assignee, occurred_at, target_date, response, status, created_by, updated_by)
VALUES
    (
        1,
        'ERP 보안 감사 요건 추가 — 개인정보 처리 방침 반영 필요',
        'HIGH', '김민준', '2026-11-10', '2026-12-15',
        '법무팀 협의 진행 중. 12월 중 처리 목표.',
        'OPEN', 'kminj', 'kminj'
    ),
    (
        1,
        'ERP 연동 레거시 시스템 인터페이스 명세 미확인',
        'MID', '박태현', '2026-03-10', '2026-12-31',
        '레거시 담당 부서에 명세서 제공 요청. 연말 수령 예정.',
        'IN_PROGRESS', 'kminj', 'kminj'
    );

-- -------------------------
-- gov_grant  (grant_id=1)
-- -------------------------
INSERT INTO gov_grant (project_id, task_no, agency, agreement_start, agreement_end, gov_amount, company_amount, created_by, updated_by)
VALUES
    (2, 'FAKE-2026-R&D-00001', '가상전담기관', '2026-03-01', '2027-02-28', 300000000, 100000000, 'lseoy', 'lseoy');

-- -------------------------
-- obligation
-- -------------------------
INSERT INTO obligation (grant_id, type, deadline, status, created_by, updated_by)
VALUES
    (1, 'REPORT', '2026-04-15', 'DONE',    'lseoy', 'lseoy'),
    (1, 'REPORT', '2027-02-28', 'PENDING', 'lseoy', 'lseoy');

-- -------------------------
-- budget_line
-- -------------------------
INSERT INTO budget_line (grant_id, item_name, budget, spent, evidence_status, created_by, updated_by)
VALUES
    (1, '인건비',    150000000, 45000000, 'PARTIAL', 'lseoy', 'lseoy'),
    (1, '연구재료비',  80000000, 12000000, 'PARTIAL', 'lseoy', 'lseoy');

-- -------------------------
-- project_folder (가상 경로 — 로컬 개발용)
-- /tmp/nas-mock/ 하위 경로를 사용한다.
-- 실제 NAS 마운트 경로는 application-local.yml의 nas.allowed-roots에 등록한다.
-- -------------------------
INSERT INTO project_folder (project_id, label, nas_path, description, sort_order, created_by, updated_by)
VALUES
    (1, '계약 증적', '/tmp/nas-mock/erp/contract', 'ERP 구축 계약 관련 증빙 자료', 1, 'kminj', 'kminj'),
    (1, '중간보고 자료', '/tmp/nas-mock/erp/report', 'ERP 중간 보고 발표 자료 및 회의록', 2, 'kminj', 'kminj'),
    (2, '착수보고 자료', '/tmp/nas-mock/ai-rnd/kickoff', 'AI R&D 착수보고 발표 자료', 1, 'lseoy', 'lseoy');
