package com.example.projtrack.project.dto;

import jakarta.validation.constraints.NotBlank;

import java.time.LocalDate;

/**
 * 신규 사업 등록 요청 DTO.
 * type: INTERNAL | GOV
 * evidenceFolderPath를 보내면 evidenceFolderLabel 이름으로 NAS 폴더를 함께 등록한다 (선택).
 */
public record CreateProjectRequest(
    @NotBlank String name,
    @NotBlank String type,
    String phase,
    LocalDate startDate,
    LocalDate endDate,
    String summary,
    String evidenceFolderLabel,
    String evidenceFolderPath
) {}
