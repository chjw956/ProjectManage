package com.example.projtrack.wbs.dto;

import jakarta.validation.constraints.NotBlank;

/** 삭제 요청 (사유 필수). */
public record DeleteRequest(
    @NotBlank String reason
) {}
