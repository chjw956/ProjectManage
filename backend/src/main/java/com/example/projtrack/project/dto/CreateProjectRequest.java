package com.example.projtrack.project.dto;

import jakarta.validation.constraints.NotBlank;

import java.time.LocalDate;

/**
 * 신규 사업 등록 요청 DTO.
 * type: INTERNAL | GOV
 */
public record CreateProjectRequest(
    @NotBlank String name,
    @NotBlank String type,
    String phase,
    LocalDate startDate,
    LocalDate endDate,
    String summary
) {}
