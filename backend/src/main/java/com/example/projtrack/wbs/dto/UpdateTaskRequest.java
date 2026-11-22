package com.example.projtrack.wbs.dto;

/**
 * Task 기본 정보 수정 요청 (이름·부서·담당자).
 * 담당자가 실제로 바뀔 때만 reason 필수 (서비스 계층에서 검증, history-logging 스킬).
 */
public record UpdateTaskRequest(
    String name,
    String dept,
    String assignee,
    String reason
) {}
