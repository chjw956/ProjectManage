-- =============================================================
-- V3: NAS 연동 — 사업별 등록 폴더 테이블
-- =============================================================

CREATE TABLE project_folder (
    folder_id   BIGSERIAL     PRIMARY KEY,
    project_id  BIGINT        NOT NULL REFERENCES project(project_id),
    label       VARCHAR(200)  NOT NULL,
    nas_path    VARCHAR(1000) NOT NULL,
    description TEXT,
    sort_order  INT           NOT NULL DEFAULT 0,
    created_by  VARCHAR(100)  NOT NULL,
    created_at  TIMESTAMPTZ   NOT NULL DEFAULT now(),
    updated_by  VARCHAR(100)  NOT NULL,
    updated_at  TIMESTAMPTZ   NOT NULL DEFAULT now()
);

CREATE INDEX idx_project_folder_project ON project_folder(project_id);
