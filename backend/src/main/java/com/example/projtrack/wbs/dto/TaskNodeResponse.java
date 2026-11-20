package com.example.projtrack.wbs.dto;

import java.util.List;

/** WBS 목록 조회 응답 — 공정 한 행 + 하위 세부 Task 목록. */
public record TaskNodeResponse(
    TaskResponse process,
    List<TaskResponse> subtasks
) {}
