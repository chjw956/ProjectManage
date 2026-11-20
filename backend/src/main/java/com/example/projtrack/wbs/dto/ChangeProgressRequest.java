package com.example.projtrack.wbs.dto;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;

/** 진행률 변경 요청. */
public record ChangeProgressRequest(
    @Min(0) @Max(100) int progress,
    String reason
) {}
