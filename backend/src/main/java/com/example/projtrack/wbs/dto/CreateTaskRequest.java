package com.example.projtrack.wbs.dto;

import jakarta.validation.constraints.NotBlank;
import java.time.LocalDate;

/** 공정 또는 세부 Task 생성 요청. */
public record CreateTaskRequest(
    @NotBlank String name,
    String dept,
    String assignee,
    LocalDate plannedStart,
    LocalDate plannedEnd
) {}
