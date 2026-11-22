package com.example.projtrack.wbs.controller;

import com.example.projtrack.wbs.TaskCalculator;
import com.example.projtrack.wbs.TaskService;
import com.example.projtrack.wbs.domain.Task;
import com.example.projtrack.wbs.dto.*;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

import java.time.Clock;
import java.time.LocalDate;
import java.util.List;

@Tag(name = "Task", description = "WBS 공정·세부 Task CRUD API")
@RestController
@RequestMapping("/api/v1/projects/{projectId}/tasks")
@RequiredArgsConstructor
public class TaskController {

    private final TaskService taskService;
    private final TaskCalculator taskCalculator;
    private final Clock clock;

    // -------------------------------------------------------------------------
    // WBS 목록 (공정 → 세부 Task 트리)
    // -------------------------------------------------------------------------

    @Operation(summary = "WBS 목록 조회 (공정 트리)")
    @GetMapping
    public List<TaskNodeResponse> listTasks(@PathVariable Long projectId) {
        LocalDate today = LocalDate.now(clock);
        return taskService.getTaskTree(projectId).stream()
            .map(node -> new TaskNodeResponse(
                toResponse(node.process()),
                node.subtasks().stream().map(this::toResponse).toList()))
            .toList();
    }

    // -------------------------------------------------------------------------
    // 공정 생성
    // -------------------------------------------------------------------------

    @Operation(summary = "공정 생성")
    @PostMapping("/processes")
    @ResponseStatus(HttpStatus.CREATED)
    public TaskResponse createProcess(@PathVariable Long projectId,
                                      @RequestBody @Valid CreateTaskRequest req) {
        Task task = taskService.createProcess(
            projectId, req.name(), req.dept(), req.assignee(),
            req.plannedStart(), req.plannedEnd());
        return toResponse(task);
    }

    // -------------------------------------------------------------------------
    // 세부 Task 생성
    // -------------------------------------------------------------------------

    @Operation(summary = "세부 Task 생성")
    @PostMapping("/{parentId}/subtasks")
    @ResponseStatus(HttpStatus.CREATED)
    public TaskResponse createSubTask(@PathVariable Long projectId,
                                      @PathVariable Long parentId,
                                      @RequestBody @Valid CreateTaskRequest req) {
        Task task = taskService.createSubTask(
            projectId, parentId, req.name(), req.dept(), req.assignee(),
            req.plannedStart(), req.plannedEnd());
        return toResponse(task);
    }

    // -------------------------------------------------------------------------
    // 수정 — 이력 없음
    // -------------------------------------------------------------------------

    @Operation(summary = "Task 기본 정보 수정 (이름·부서·담당자, 담당자 변경 시 사유 필수)")
    @PutMapping("/{taskId}")
    public TaskResponse updateTask(@PathVariable Long projectId,
                                   @PathVariable Long taskId,
                                   @RequestBody @Valid UpdateTaskRequest req) {
        Task task = taskService.updateTask(projectId, taskId,
            req.name(), req.dept(), req.assignee(), req.reason());
        return toResponse(task);
    }

    // -------------------------------------------------------------------------
    // 수정 — 이력 기록
    // -------------------------------------------------------------------------

    @Operation(summary = "진행률 변경")
    @PatchMapping("/{taskId}/progress")
    public TaskResponse updateProgress(@PathVariable Long projectId,
                                       @PathVariable Long taskId,
                                       @RequestBody @Valid ChangeProgressRequest req) {
        Task task = taskService.updateProgress(projectId, taskId, req.progress(), req.reason());
        return toResponse(task);
    }

    @Operation(summary = "계획 일정 변경 (사유 필수)")
    @PatchMapping("/{taskId}/schedule")
    public TaskResponse changeSchedule(@PathVariable Long projectId,
                                       @PathVariable Long taskId,
                                       @RequestBody @Valid ChangeScheduleRequest req) {
        Task task = taskService.changeSchedule(projectId, taskId,
            req.plannedStart(), req.plannedEnd(), req.reason());
        return toResponse(task);
    }

    @Operation(summary = "실제 일정 변경")
    @PatchMapping("/{taskId}/actual-dates")
    public TaskResponse changeActualDates(@PathVariable Long projectId,
                                          @PathVariable Long taskId,
                                          @RequestBody @Valid ChangeActualDatesRequest req) {
        Task task = taskService.changeActualDates(projectId, taskId,
            req.actualStart(), req.actualEnd(), req.reason());
        return toResponse(task);
    }

    @Operation(summary = "상태 변경 (DONE 외 사유 필수)")
    @PatchMapping("/{taskId}/status")
    public TaskResponse changeStatus(@PathVariable Long projectId,
                                     @PathVariable Long taskId,
                                     @RequestBody @Valid ChangeStatusRequest req) {
        Task task = taskService.changeStatus(projectId, taskId, req.newStatus(), req.reason());
        return toResponse(task);
    }

    // -------------------------------------------------------------------------
    // 순서 변경
    // -------------------------------------------------------------------------

    @Operation(summary = "Task 순서 변경")
    @PutMapping("/reorder")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void reorder(@PathVariable Long projectId,
                        @RequestBody @Valid ReorderRequest req) {
        List<TaskService.TaskOrder> orders = req.orders().stream()
            .map(o -> new TaskService.TaskOrder(o.taskId(), o.sortOrder()))
            .toList();
        taskService.reorder(projectId, req.parentId(), orders);
    }

    // -------------------------------------------------------------------------
    // 삭제
    // -------------------------------------------------------------------------

    @Operation(summary = "Task 삭제 (사유 필수, 공정 삭제 시 하위 Task 연쇄 삭제)")
    @DeleteMapping("/{taskId}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void deleteTask(@PathVariable Long projectId,
                           @PathVariable Long taskId,
                           @RequestBody @Valid DeleteRequest req) {
        taskService.deleteTask(projectId, taskId, req.reason());
    }

    // -------------------------------------------------------------------------
    // DTO 변환
    // -------------------------------------------------------------------------

    private TaskResponse toResponse(Task t) {
        LocalDate today = LocalDate.now(clock);
        boolean delayed = taskCalculator.isDelayed(
            new TaskCalculator.TaskProgress(
                t.getTaskId(), t.getProgress(), t.getPlannedStart(), t.getPlannedEnd(), t.getStatus()),
            today);

        return new TaskResponse(
            t.getTaskId(),
            t.getProject().getProjectId(),
            t.getParent() == null ? null : t.getParent().getTaskId(),
            t.getName(),
            t.getDept(),
            t.getAssignee(),
            t.getProgress(),
            t.getStatus(),
            delayed,
            t.getPlannedStart(),
            t.getPlannedEnd(),
            t.getActualStart(),
            t.getActualEnd(),
            t.getSortOrder(),
            t.isWork(),
            t.getAmount()
        );
    }
}
