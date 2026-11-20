package com.example.projtrack.wbs.dto;

import java.time.LocalDate;

/**
 * 마일스톤 응답 DTO.
 * dDay: 오늘 기준 양수 = 초과, 음수 = D-|dDay|.
 */
public record MilestoneResponse(
    Long milestoneId,
    Long projectId,
    String name,
    String type,
    LocalDate plannedDate,
    LocalDate actualDate,
    String status,
    long dDay
) {}
