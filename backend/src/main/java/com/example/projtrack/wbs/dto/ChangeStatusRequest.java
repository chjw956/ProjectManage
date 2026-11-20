package com.example.projtrack.wbs.dto;

import jakarta.validation.constraints.NotBlank;

/**
 * 상태 변경 요청.
 * DONE 외 상태 변경 시 reason 필수 — 서비스 계층에서 검증.
 */
public record ChangeStatusRequest(
    @NotBlank String newStatus,
    String reason
) {}
