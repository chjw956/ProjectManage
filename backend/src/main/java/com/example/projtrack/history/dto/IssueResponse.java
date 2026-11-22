package com.example.projtrack.history.dto;

import java.time.LocalDate;

/**
 * 이슈 조회 응답.
 * overdue는 저장하지 않고 조회 시 Clock 기준으로 계산한다 (목표일 &lt; 오늘).
 */
public record IssueResponse(
    Long issueId,
    String title,
    String grade,
    String status,
    String assignee,
    LocalDate occurredAt,
    LocalDate targetDate,
    String response,
    boolean overdue
) {}
