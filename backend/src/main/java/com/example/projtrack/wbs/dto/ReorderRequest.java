package com.example.projtrack.wbs.dto;

import jakarta.validation.constraints.NotNull;
import java.util.List;

/**
 * Task 순서 변경 요청.
 * parentId == null → 공정 간 순서 변경. parentId != null → 해당 공정 내 세부 Task 순서 변경.
 */
public record ReorderRequest(
    Long parentId,
    @NotNull List<TaskOrderItem> orders
) {
    public record TaskOrderItem(Long taskId, int sortOrder) {}
}
