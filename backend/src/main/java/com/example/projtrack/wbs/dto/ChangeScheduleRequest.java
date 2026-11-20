package com.example.projtrack.wbs.dto;

import jakarta.validation.constraints.NotBlank;
import java.time.LocalDate;

/**
 * 계획 일정 변경 요청.
 * reason은 DTO와 서비스 양쪽에서 검증한다 (history-logging 스킬).
 */
public record ChangeScheduleRequest(
    LocalDate plannedStart,
    LocalDate plannedEnd,
    @NotBlank String reason
) {}
