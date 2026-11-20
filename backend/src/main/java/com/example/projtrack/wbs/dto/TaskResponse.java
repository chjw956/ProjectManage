package com.example.projtrack.wbs.dto;

import java.math.BigDecimal;
import java.time.LocalDate;

/** Task 단건 응답 DTO. */
public record TaskResponse(
    Long taskId,
    Long projectId,
    Long parentId,          // null → 공정
    String name,
    String dept,
    String assignee,
    int progress,
    String status,
    boolean delayed,
    LocalDate plannedStart,
    LocalDate plannedEnd,
    LocalDate actualStart,
    LocalDate actualEnd,
    int sortOrder,
    boolean work,
    BigDecimal amount
) {}
