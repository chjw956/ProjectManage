-- =============================================================
-- V1: ProjTrack 전체 스키마 생성
-- 설계서 5장 기준 16개 테이블
-- 모든 테이블에 audit 컬럼 포함
-- =============================================================

-- -------------------------
-- app_user
-- -------------------------
CREATE TABLE app_user (
    user_id      BIGSERIAL    PRIMARY KEY,
    username     VARCHAR(100) NOT NULL UNIQUE,
    display_name VARCHAR(200) NOT NULL,
    email        VARCHAR(300) NOT NULL,
    dept         VARCHAR(200),
    created_by   VARCHAR(100) NOT NULL,
    created_at   TIMESTAMPTZ  NOT NULL DEFAULT now(),
    updated_by   VARCHAR(100) NOT NULL,
    updated_at   TIMESTAMPTZ  NOT NULL DEFAULT now()
);

-- -------------------------
-- project (사업)
-- -------------------------
CREATE TABLE project (
    project_id     BIGSERIAL    PRIMARY KEY,
    name           VARCHAR(300) NOT NULL,
    type           VARCHAR(20)  NOT NULL CHECK (type IN ('INTERNAL', 'GOV')),
    phase          VARCHAR(100),
    status         VARCHAR(20)  NOT NULL DEFAULT 'NORMAL' CHECK (status IN ('NORMAL', 'CAUTION', 'DANGER', 'CLOSED')),
    start_date     DATE,
    end_date       DATE,
    summary        TEXT,
    security_level VARCHAR(20)  NOT NULL DEFAULT 'NORMAL' CHECK (security_level IN ('NORMAL', 'CONFIDENTIAL', 'SECRET')),
    created_by     VARCHAR(100) NOT NULL,
    created_at     TIMESTAMPTZ  NOT NULL DEFAULT now(),
    updated_by     VARCHAR(100) NOT NULL,
    updated_at     TIMESTAMPTZ  NOT NULL DEFAULT now()
);

-- -------------------------
-- project_member (참여자)
-- -------------------------
CREATE TABLE project_member (
    member_id  BIGSERIAL   PRIMARY KEY,
    project_id BIGINT      NOT NULL REFERENCES project(project_id),
    user_id    BIGINT      NOT NULL REFERENCES app_user(user_id),
    role       VARCHAR(20) NOT NULL CHECK (role IN ('PM', 'MEMBER', 'APPROVER', 'EXTERNAL')),
    joined_at  DATE        NOT NULL,
    left_at    DATE,
    created_by VARCHAR(100) NOT NULL,
    created_at TIMESTAMPTZ  NOT NULL DEFAULT now(),
    updated_by VARCHAR(100) NOT NULL,
    updated_at TIMESTAMPTZ  NOT NULL DEFAULT now()
);

CREATE INDEX idx_project_member_project ON project_member(project_id);
CREATE INDEX idx_project_member_user    ON project_member(user_id);

-- -------------------------
-- milestone (마일스톤)
-- -------------------------
CREATE TABLE milestone (
    milestone_id  BIGSERIAL    PRIMARY KEY,
    project_id    BIGINT       NOT NULL REFERENCES project(project_id),
    name          VARCHAR(300) NOT NULL,
    type          VARCHAR(100),
    planned_date  DATE         NOT NULL,
    actual_date   DATE,
    status        VARCHAR(20)  NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'IN_PROGRESS', 'DONE', 'DELAYED')),
    created_by    VARCHAR(100) NOT NULL,
    created_at    TIMESTAMPTZ  NOT NULL DEFAULT now(),
    updated_by    VARCHAR(100) NOT NULL,
    updated_at    TIMESTAMPTZ  NOT NULL DEFAULT now()
);

CREATE INDEX idx_milestone_project ON milestone(project_id);

-- -------------------------
-- task (WBS: 공정 + 세부 Task)
-- parent_id NULL → 공정, NOT NULL → 세부 Task
-- -------------------------
CREATE TABLE task (
    task_id       BIGSERIAL      PRIMARY KEY,
    project_id    BIGINT         NOT NULL REFERENCES project(project_id),
    parent_id     BIGINT         REFERENCES task(task_id),
    name          VARCHAR(300)   NOT NULL,
    dept          VARCHAR(200),
    assignee      VARCHAR(200),
    planned_start DATE,
    planned_end   DATE,
    actual_start  DATE,
    actual_end    DATE,
    status        VARCHAR(20)    NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'IN_PROGRESS', 'DONE', 'DELAYED')),
    progress      SMALLINT       NOT NULL DEFAULT 0 CHECK (progress BETWEEN 0 AND 100),
    sort_order    INT            NOT NULL DEFAULT 0,
    is_work       BOOLEAN        NOT NULL DEFAULT FALSE,
    amount        NUMERIC(15, 0),
    created_by    VARCHAR(100)   NOT NULL,
    created_at    TIMESTAMPTZ    NOT NULL DEFAULT now(),
    updated_by    VARCHAR(100)   NOT NULL,
    updated_at    TIMESTAMPTZ    NOT NULL DEFAULT now()
);

CREATE INDEX idx_task_project    ON task(project_id);
CREATE INDEX idx_task_parent     ON task(parent_id);

-- -------------------------
-- base_event (기준 이벤트)
-- planned_date NULL → 미정
-- -------------------------
CREATE TABLE base_event (
    base_event_id BIGSERIAL    PRIMARY KEY,
    project_id    BIGINT       NOT NULL REFERENCES project(project_id),
    name          VARCHAR(300) NOT NULL,
    planned_date  DATE,
    memo          TEXT,
    created_by    VARCHAR(100) NOT NULL,
    created_at    TIMESTAMPTZ  NOT NULL DEFAULT now(),
    updated_by    VARCHAR(100) NOT NULL,
    updated_at    TIMESTAMPTZ  NOT NULL DEFAULT now()
);

CREATE INDEX idx_base_event_project ON base_event(project_id);

-- -------------------------
-- gov_grant (정부사업 확장)
-- project_id UNIQUE → 1:1
-- -------------------------
CREATE TABLE gov_grant (
    grant_id         BIGSERIAL      PRIMARY KEY,
    project_id       BIGINT         NOT NULL UNIQUE REFERENCES project(project_id),
    task_no          VARCHAR(100),
    agency           VARCHAR(300),
    agreement_start  DATE,
    agreement_end    DATE,
    gov_amount       NUMERIC(15, 0),
    company_amount   NUMERIC(15, 0),
    created_by       VARCHAR(100)   NOT NULL,
    created_at       TIMESTAMPTZ    NOT NULL DEFAULT now(),
    updated_by       VARCHAR(100)   NOT NULL,
    updated_at       TIMESTAMPTZ    NOT NULL DEFAULT now()
);

-- -------------------------
-- budget_line (사업비 비목)
-- -------------------------
CREATE TABLE budget_line (
    line_id          BIGSERIAL    PRIMARY KEY,
    grant_id         BIGINT       NOT NULL REFERENCES gov_grant(grant_id),
    item_name        VARCHAR(200) NOT NULL,
    budget           NUMERIC(15, 0) NOT NULL DEFAULT 0,
    spent            NUMERIC(15, 0) NOT NULL DEFAULT 0,
    evidence_status  VARCHAR(20)  NOT NULL DEFAULT 'NONE' CHECK (evidence_status IN ('NONE', 'PARTIAL', 'COMPLETE')),
    created_by       VARCHAR(100) NOT NULL,
    created_at       TIMESTAMPTZ  NOT NULL DEFAULT now(),
    updated_by       VARCHAR(100) NOT NULL,
    updated_at       TIMESTAMPTZ  NOT NULL DEFAULT now()
);

CREATE INDEX idx_budget_line_grant ON budget_line(grant_id);

-- -------------------------
-- payment (집행 항목)
-- budget_line_id FK는 budget_line 테이블 생성 후 ALTER TABLE로 추가
-- -------------------------
CREATE TABLE payment (
    payment_id     BIGSERIAL      PRIMARY KEY,
    project_id     BIGINT         NOT NULL REFERENCES project(project_id),
    base_event_id  BIGINT         REFERENCES base_event(base_event_id),
    budget_line_id BIGINT,
    pay_type       VARCHAR(20)    NOT NULL CHECK (pay_type IN ('ADVANCE', 'INTERIM', 'FINAL', 'OTHER')),
    executor_type  VARCHAR(100),
    planned_date   DATE,
    planned_amount NUMERIC(15, 0),
    actual_date    DATE,
    actual_amount  NUMERIC(15, 0),
    status         VARCHAR(20)    NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'PAID', 'DELAYED')),
    timing_type    VARCHAR(50),
    evidence_url   VARCHAR(2000),
    check_flag     BOOLEAN        NOT NULL DEFAULT FALSE,
    created_by     VARCHAR(100)   NOT NULL,
    created_at     TIMESTAMPTZ    NOT NULL DEFAULT now(),
    updated_by     VARCHAR(100)   NOT NULL,
    updated_at     TIMESTAMPTZ    NOT NULL DEFAULT now()
);

CREATE INDEX idx_payment_project    ON payment(project_id);
CREATE INDEX idx_payment_base_event ON payment(base_event_id);

-- payment → budget_line FK (순환 참조 없이 연결)
ALTER TABLE payment
    ADD CONSTRAINT fk_payment_budget_line
    FOREIGN KEY (budget_line_id) REFERENCES budget_line(line_id);

-- -------------------------
-- timeline_event (타임라인 이벤트)
-- -------------------------
CREATE TABLE timeline_event (
    event_id    BIGSERIAL    PRIMARY KEY,
    project_id  BIGINT       NOT NULL REFERENCES project(project_id),
    event_date  DATE         NOT NULL,
    type        VARCHAR(50)  NOT NULL,
    summary     TEXT         NOT NULL,
    author      VARCHAR(200),
    source      VARCHAR(20)  NOT NULL DEFAULT 'MANUAL' CHECK (source IN ('MANUAL', 'AUTO')),
    importance  SMALLINT     NOT NULL DEFAULT 0,
    created_by  VARCHAR(100) NOT NULL,
    created_at  TIMESTAMPTZ  NOT NULL DEFAULT now(),
    updated_by  VARCHAR(100) NOT NULL,
    updated_at  TIMESTAMPTZ  NOT NULL DEFAULT now()
);

CREATE INDEX idx_timeline_event_project ON timeline_event(project_id);
CREATE INDEX idx_timeline_event_date    ON timeline_event(project_id, event_date DESC);

-- -------------------------
-- decision (결정 로그)
-- -------------------------
CREATE TABLE decision (
    decision_id    BIGSERIAL    PRIMARY KEY,
    project_id     BIGINT       NOT NULL REFERENCES project(project_id),
    event_id       BIGINT       REFERENCES timeline_event(event_id),
    decision_date  DATE         NOT NULL,
    content        TEXT         NOT NULL,
    background     TEXT,
    alternatives   TEXT,
    reason         TEXT,
    decider        VARCHAR(200),
    status         VARCHAR(20)  NOT NULL DEFAULT 'VALID' CHECK (status IN ('VALID', 'CHANGED', 'DISCARDED')),
    successor_id   BIGINT       REFERENCES decision(decision_id),
    created_by     VARCHAR(100) NOT NULL,
    created_at     TIMESTAMPTZ  NOT NULL DEFAULT now(),
    updated_by     VARCHAR(100) NOT NULL,
    updated_at     TIMESTAMPTZ  NOT NULL DEFAULT now()
);

CREATE INDEX idx_decision_project ON decision(project_id);

-- -------------------------
-- issue (이슈·리스크 레지스터)
-- -------------------------
CREATE TABLE issue (
    issue_id     BIGSERIAL    PRIMARY KEY,
    project_id   BIGINT       NOT NULL REFERENCES project(project_id),
    title        VARCHAR(300) NOT NULL,
    grade        VARCHAR(10)  NOT NULL CHECK (grade IN ('HIGH', 'MID', 'LOW')),
    assignee     VARCHAR(200),
    occurred_at  DATE         NOT NULL,
    target_date  DATE,
    response     TEXT,
    status       VARCHAR(20)  NOT NULL DEFAULT 'OPEN' CHECK (status IN ('OPEN', 'IN_PROGRESS', 'CLOSED')),
    created_by   VARCHAR(100) NOT NULL,
    created_at   TIMESTAMPTZ  NOT NULL DEFAULT now(),
    updated_by   VARCHAR(100) NOT NULL,
    updated_at   TIMESTAMPTZ  NOT NULL DEFAULT now()
);

CREATE INDEX idx_issue_project ON issue(project_id);

-- -------------------------
-- document_link (문서 링크)
-- -------------------------
CREATE TABLE document_link (
    document_id     BIGSERIAL      PRIMARY KEY,
    title           VARCHAR(300)   NOT NULL,
    doc_type        VARCHAR(100),
    original_url    VARCHAR(2000)  NOT NULL,
    registered_at   DATE           NOT NULL DEFAULT CURRENT_DATE,
    created_by      VARCHAR(100)   NOT NULL,
    created_at      TIMESTAMPTZ    NOT NULL DEFAULT now(),
    updated_by      VARCHAR(100)   NOT NULL,
    updated_at      TIMESTAMPTZ    NOT NULL DEFAULT now()
);

-- -------------------------
-- document_ref (문서 참조: 다대다 연결)
-- -------------------------
CREATE TABLE document_ref (
    ref_id          BIGSERIAL   PRIMARY KEY,
    document_id     BIGINT      NOT NULL REFERENCES document_link(document_id),
    ref_type        VARCHAR(20) NOT NULL CHECK (ref_type IN ('PROJECT', 'EVENT', 'DECISION')),
    ref_entity_id   BIGINT      NOT NULL,
    created_by      VARCHAR(100) NOT NULL,
    created_at      TIMESTAMPTZ  NOT NULL DEFAULT now(),
    updated_by      VARCHAR(100) NOT NULL,
    updated_at      TIMESTAMPTZ  NOT NULL DEFAULT now(),
    UNIQUE (document_id, ref_type, ref_entity_id)
);

CREATE INDEX idx_document_ref_document ON document_ref(document_id);

-- -------------------------
-- weekly_update (주간 업데이트)
-- -------------------------
CREATE TABLE weekly_update (
    update_id      BIGSERIAL    PRIMARY KEY,
    project_id     BIGINT       NOT NULL REFERENCES project(project_id),
    event_id       BIGINT       REFERENCES timeline_event(event_id),
    week_no        VARCHAR(20)  NOT NULL,
    done_text      TEXT,
    todo_text      TEXT,
    issues_text    TEXT,
    status_change  VARCHAR(20),
    created_by     VARCHAR(100) NOT NULL,
    created_at     TIMESTAMPTZ  NOT NULL DEFAULT now(),
    updated_by     VARCHAR(100) NOT NULL,
    updated_at     TIMESTAMPTZ  NOT NULL DEFAULT now()
);

CREATE INDEX idx_weekly_update_project ON weekly_update(project_id);

-- -------------------------
-- obligation (의무 일정)
-- -------------------------
CREATE TABLE obligation (
    obligation_id  BIGSERIAL    PRIMARY KEY,
    grant_id       BIGINT       NOT NULL REFERENCES gov_grant(grant_id),
    type           VARCHAR(20)  NOT NULL CHECK (type IN ('REPORT', 'SETTLEMENT', 'OUTCOME', 'OTHER')),
    deadline       DATE         NOT NULL,
    status         VARCHAR(20)  NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'DONE', 'OVERDUE')),
    submission_url VARCHAR(2000),
    created_by     VARCHAR(100) NOT NULL,
    created_at     TIMESTAMPTZ  NOT NULL DEFAULT now(),
    updated_by     VARCHAR(100) NOT NULL,
    updated_at     TIMESTAMPTZ  NOT NULL DEFAULT now()
);

CREATE INDEX idx_obligation_grant ON obligation(grant_id);
