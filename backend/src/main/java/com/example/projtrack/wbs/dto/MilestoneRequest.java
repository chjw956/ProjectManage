package com.example.projtrack.wbs.dto;

import jakarta.validation.constraints.NotBlank;
import java.time.LocalDate;

/**
 * 마일스톤 생성·수정 요청 DTO.
 * plannedDate 변경 시에는 reason 필수 (서비스 계층에서 검증).
 */
public record MilestoneRequest(
    @NotBlank String name,
    String type,
    LocalDate plannedDate,
    LocalDate actualDate,
    String status,
    String reason
) {}
