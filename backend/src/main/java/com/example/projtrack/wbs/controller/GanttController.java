package com.example.projtrack.wbs.controller;

import com.example.projtrack.wbs.TaskCalculator;
import com.example.projtrack.wbs.TaskService;
import com.example.projtrack.wbs.domain.Task;
import com.example.projtrack.wbs.dto.GanttResponse;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.time.Clock;
import java.time.LocalDate;
import java.util.List;

@Tag(name = "Gantt", description = "간트 차트 조회 API")
@RestController
@RequestMapping("/api/v1/projects/{projectId}/gantt")
@RequiredArgsConstructor
public class GanttController {

    private final TaskService taskService;
    private final TaskCalculator taskCalculator;
    private final Clock clock;

    @Operation(summary = "간트 조회 (공정 → 세부 Task 트리)")
    @GetMapping
    public GanttResponse getGantt(@PathVariable Long projectId) {
        LocalDate today = LocalDate.now(clock);
        List<TaskService.TaskNode> nodes = taskService.getTaskTree(projectId);

        // 사업 진척률 계산 (공정별 진척률의 계획 기간 가중 평균)
        List<TaskCalculator.ProcessProgress> processProgressList = nodes.stream()
            .map(node -> {
                List<TaskCalculator.TaskProgress> subtaskProgs = node.subtasks().stream()
                    .map(t -> new TaskCalculator.TaskProgress(
                        t.getTaskId(), t.getProgress(), t.getPlannedStart(), t.getPlannedEnd(), t.getStatus()))
                    .toList();
                int pProgress = node.subtasks().isEmpty()
                    ? node.process().getProgress()
                    : taskCalculator.calcProcessProgress(subtaskProgs);
                return new TaskCalculator.ProcessProgress(
                    pProgress, node.process().getPlannedStart(), node.process().getPlannedEnd());
            })
            .toList();
        int projectProgress = taskCalculator.calcProjectProgress(processProgressList);

        // 공정 행 변환
        List<GanttResponse.GanttProcessRow> processRows = nodes.stream()
            .map(node -> toProcessRow(node, today))
            .toList();

        return new GanttResponse(projectId, projectProgress, processRows);
    }

    // -------------------------------------------------------------------------

    private GanttResponse.GanttProcessRow toProcessRow(TaskService.TaskNode node, LocalDate today) {
        Task proc = node.process();

        List<TaskCalculator.TaskProgress> subtaskProgs = node.subtasks().stream()
            .map(t -> new TaskCalculator.TaskProgress(
                t.getTaskId(), t.getProgress(), t.getPlannedStart(), t.getPlannedEnd(), t.getStatus()))
            .toList();
        int pProgress = node.subtasks().isEmpty()
            ? proc.getProgress()
            : taskCalculator.calcProcessProgress(subtaskProgs);

        List<GanttResponse.GanttTaskRow> subtaskRows = node.subtasks().stream()
            .map(t -> toTaskRow(t, today))
            .toList();

        return new GanttResponse.GanttProcessRow(
            proc.getTaskId(),
            proc.getName(),
            proc.getDept(),
            proc.getAssignee(),
            pProgress,
            proc.getStatus(),
            proc.getPlannedStart(),
            proc.getPlannedEnd(),
            proc.isWork(),
            proc.getAmount(),
            subtaskRows
        );
    }

    private GanttResponse.GanttTaskRow toTaskRow(Task t, LocalDate today) {
        boolean delayed = taskCalculator.isDelayed(
            new TaskCalculator.TaskProgress(
                t.getTaskId(), t.getProgress(), t.getPlannedStart(), t.getPlannedEnd(), t.getStatus()),
            today);

        return new GanttResponse.GanttTaskRow(
            t.getTaskId(),
            t.getName(),
            t.getDept(),
            t.getAssignee(),
            t.getProgress(),
            t.getStatus(),
            delayed,
            t.getPlannedStart(),
            t.getPlannedEnd(),
            t.getActualStart(),
            t.getActualEnd()
        );
    }
}
