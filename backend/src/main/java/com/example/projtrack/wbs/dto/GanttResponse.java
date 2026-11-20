package com.example.projtrack.wbs.dto;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

/**
 * 간트 조회 응답 DTO (설계서 4.10).
 * 공정 → 세부 Task 2단계 트리로 반환한다.
 */
public record GanttResponse(
    Long projectId,
    int progress,
    List<GanttProcessRow> processes
) {
    public record GanttProcessRow(
        Long taskId,
        String name,
        String dept,
        String assignee,
        int progress,
        String status,
        LocalDate plannedStart,
        LocalDate plannedEnd,
        boolean work,
        BigDecimal amount,
        List<GanttTaskRow> subtasks
    ) {}

    public record GanttTaskRow(
        Long taskId,
        String name,
        String dept,
        String assignee,
        int progress,
        String status,
        boolean delayed,
        LocalDate plannedStart,
        LocalDate plannedEnd,
        LocalDate actualStart,
        LocalDate actualEnd
    ) {}
}
