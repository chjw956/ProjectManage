-- =============================================================
-- V2: timeline_event 이력 필드 추가
-- history-logging 스킬 요구사항:
--   before_state / after_state : 변경 전·후 상태 (JSONB)
--   reason                     : 변경 사유
--   ref_type / ref_entity_id   : 대상 엔티티 (예: TASK, MILESTONE)
-- actor 역할은 V1의 author 컬럼이 담당하고, source 도 V1에 존재하므로 추가하지 않는다.
-- =============================================================

ALTER TABLE timeline_event
    ADD COLUMN before_state  JSONB,
    ADD COLUMN after_state   JSONB,
    ADD COLUMN reason        TEXT,
    ADD COLUMN ref_type      VARCHAR(50),
    ADD COLUMN ref_entity_id BIGINT;
