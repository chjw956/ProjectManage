package com.example.projtrack.wbs.dto;

/** Task 기본 정보 수정 요청 (이름·부서·담당자). */
public record UpdateTaskRequest(
    String name,
    String dept,
    String assignee
) {}
