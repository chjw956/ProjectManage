package com.example.projtrack.wbs;

import com.example.projtrack.auth.ProjectAccessChecker;
import com.example.projtrack.history.HistoryRecorder;
import com.example.projtrack.project.repository.ProjectRepository;
import com.example.projtrack.wbs.domain.Task;
import com.example.projtrack.wbs.repository.TaskRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Clock;
import java.time.LocalDate;
import java.util.List;
import java.util.Map;
import java.util.NoSuchElementException;
import java.util.Objects;
import java.util.Set;
import java.util.stream.Collectors;

@Service
@Transactional(readOnly = true)
@RequiredArgsConstructor
public class TaskService {

    private final TaskRepository taskRepo;
    private final ProjectRepository projectRepo;
    private final HistoryRecorder recorder;
    private final ProjectAccessChecker accessChecker;
    private final Clock clock;

    // -------------------------------------------------------------------------
    // 조회
    // -------------------------------------------------------------------------

    /**
     * 사업의 공정 트리를 반환한다. 각 공정에 하위 세부 Task 목록이 포함된다.
     * 사업 전체 Task를 1회 조회 후 Java에서 그룹핑하여 N+1 문제를 방지한다.
     */
    public List<TaskNode> getTaskTree(Long projectId) {
        accessChecker.checkRead(projectId);
        List<Task> all = taskRepo.findByProjectProjectIdOrderBySortOrderAsc(projectId);
        List<Task> processes = all.stream().filter(t -> t.getParent() == null).toList();
        Map<Long, List<Task>> subtasksByParent = all.stream()
            .filter(t -> t.getParent() != null)
            .collect(Collectors.groupingBy(t -> t.getParent().getTaskId()));
        return processes.stream()
            .map(p -> new TaskNode(p, subtasksByParent.getOrDefault(p.getTaskId(), List.of())))
            .toList();
    }

    // -------------------------------------------------------------------------
    // 생성
    // -------------------------------------------------------------------------

    @Transactional
    public Task createProcess(Long projectId, String name, String dept, String assignee,
                              LocalDate plannedStart, LocalDate plannedEnd) {
        accessChecker.checkWrite(projectId);
        Task task = new Task();
        task.setProject(projectRepo.getReferenceById(projectId));
        task.setName(name);
        task.setDept(dept);
        task.setAssignee(assignee);
        task.setPlannedStart(plannedStart);
        task.setPlannedEnd(plannedEnd);
        task.setSortOrder(taskRepo.findMaxSortOrderForProcesses(projectId) + 1);
        return taskRepo.save(task);
    }

    @Transactional
    public Task createSubTask(Long projectId, Long parentId, String name, String dept,
                              String assignee, LocalDate plannedStart, LocalDate plannedEnd) {
        accessChecker.checkWrite(projectId);
        Task parent = taskRepo.findById(parentId)
            .filter(t -> t.getProject().getProjectId().equals(projectId))
            .orElseThrow(() -> new NoSuchElementException("Process not found: " + parentId));
        Task task = new Task();
        task.setProject(projectRepo.getReferenceById(projectId));
        task.setParent(parent);
        task.setName(name);
        task.setDept(dept);
        task.setAssignee(assignee);
        task.setPlannedStart(plannedStart);
        task.setPlannedEnd(plannedEnd);
        task.setSortOrder(taskRepo.findMaxSortOrderForSubtasks(parentId) + 1);
        return taskRepo.save(task);
    }

    // -------------------------------------------------------------------------
    // 수정 — 이력 없음
    // -------------------------------------------------------------------------

    @Transactional
    public Task updateTask(Long projectId, Long taskId,
                           String name, String dept, String assignee) {
        accessChecker.checkWrite(projectId);
        Task task = loadTask(projectId, taskId);
        if (name != null)     task.setName(name);
        if (dept != null)     task.setDept(dept);
        if (assignee != null) task.setAssignee(assignee);
        return taskRepo.save(task);
    }

    // -------------------------------------------------------------------------
    // 수정 — 이력 기록
    // -------------------------------------------------------------------------

    /** 진행률 변경. 같은 값이면 이벤트를 생성하지 않는다 (HistoryRecorder가 처리). */
    @Transactional
    public Task updateProgress(Long projectId, Long taskId, int progress, String reason) {
        accessChecker.checkWrite(projectId);
        Task task = loadTask(projectId, taskId);
        int before = task.getProgress();
        task.setProgress(progress);
        taskRepo.save(task);
        recorder.record(projectId, "PROGRESS_UPDATED",
            task.getName() + " 진행률 " + before + "% → " + progress + "%",
            Map.of("progress", before), Map.of("progress", progress),
            reason, "TASK", taskId);
        return task;
    }

    /** 계획 일정 변경. 사유 필수 (history-logging 스킬). */
    @Transactional
    public Task changeSchedule(Long projectId, Long taskId,
                               LocalDate plannedStart, LocalDate plannedEnd, String reason) {
        if (reason == null || reason.isBlank()) {
            throw new IllegalArgumentException("일정 변경에는 사유가 필요합니다.");
        }
        accessChecker.checkWrite(projectId);
        Task task = loadTask(projectId, taskId);
        var before = new ScheduleSnapshot(task.getPlannedStart(), task.getPlannedEnd());
        task.setPlannedStart(plannedStart);
        task.setPlannedEnd(plannedEnd);
        taskRepo.save(task);
        recorder.record(projectId, "SCHEDULE_CHANGED",
            task.getName() + " 계획 일정 변경",
            before, new ScheduleSnapshot(plannedStart, plannedEnd),
            reason, "TASK", taskId);
        return task;
    }

    /** 실제 시작·종료일 변경. 사유 선택 (보완 4). */
    @Transactional
    public Task changeActualDates(Long projectId, Long taskId,
                                  LocalDate actualStart, LocalDate actualEnd, String reason) {
        accessChecker.checkWrite(projectId);
        Task task = loadTask(projectId, taskId);
        var before = new ActualDatesSnapshot(task.getActualStart(), task.getActualEnd());
        task.setActualStart(actualStart);
        task.setActualEnd(actualEnd);
        taskRepo.save(task);
        recorder.record(projectId, "ACTUAL_DATE_CHANGED",
            task.getName() + " 실제 일정 변경",
            before, new ActualDatesSnapshot(actualStart, actualEnd),
            reason, "TASK", taskId);
        return task;
    }

    /**
     * 상태 변경.
     * <ul>
     *   <li>DONE: 사유 불필요, actualEnd 자동 입력, progress = 100</li>
     *   <li>그 외: 사유 필수</li>
     *   <li>IN_PROGRESS: actualStart 자동 입력 (비어 있으면)</li>
     * </ul>
     */
    @Transactional
    public Task changeStatus(Long projectId, Long taskId, String newStatus, String reason) {
        if (!"DONE".equals(newStatus) && (reason == null || reason.isBlank())) {
            throw new IllegalArgumentException("상태 변경에는 사유가 필요합니다 (DONE 제외).");
        }
        accessChecker.checkWrite(projectId);
        Task task = loadTask(projectId, taskId);
        var before = new StatusSnapshot(
            task.getStatus(), task.getProgress(), task.getActualStart(), task.getActualEnd());

        String oldStatus = task.getStatus();
        task.setStatus(newStatus);

        LocalDate today = LocalDate.now(clock);
        if ("IN_PROGRESS".equals(newStatus) && task.getActualStart() == null) {
            task.setActualStart(today);
        }
        if ("DONE".equals(newStatus)) {
            if (task.getActualEnd() == null) task.setActualEnd(today);
            task.setProgress(100);
        }
        taskRepo.save(task);

        recorder.record(projectId, "STATUS_CHANGED",
            task.getName() + " 상태 " + oldStatus + " → " + newStatus,
            before,
            new StatusSnapshot(task.getStatus(), task.getProgress(),
                               task.getActualStart(), task.getActualEnd()),
            reason, "TASK", taskId);
        return task;
    }

    // -------------------------------------------------------------------------
    // 순서 변경 — 이력 없음
    // -------------------------------------------------------------------------

    /**
     * 같은 공정(parentId) 내에서 sort_order를 일괄 변경한다.
     * parentId == null 이면 최상위 공정 간 순서 변경.
     * 다른 공정의 Task가 섞이면 예외를 던진다.
     */
    @Transactional
    public void reorder(Long projectId, Long parentId, List<TaskOrder> orders) {
        accessChecker.checkWrite(projectId);
        if (orders.isEmpty()) return;

        Set<Long> taskIds = orders.stream().map(TaskOrder::taskId).collect(Collectors.toSet());
        List<Task> tasks = taskRepo.findAllById(taskIds);

        for (Task t : tasks) {
            if (!t.getProject().getProjectId().equals(projectId)) {
                throw new IllegalArgumentException(
                    "Task " + t.getTaskId() + "은 해당 사업 소속이 아닙니다.");
            }
            Long taskParentId = t.getParent() == null ? null : t.getParent().getTaskId();
            if (!Objects.equals(taskParentId, parentId)) {
                throw new IllegalArgumentException(
                    "Task " + t.getTaskId() + "은 지정한 공정 소속이 아닙니다.");
            }
        }

        Map<Long, Task> taskMap = tasks.stream()
            .collect(Collectors.toMap(Task::getTaskId, t -> t));
        for (TaskOrder order : orders) {
            Task t = taskMap.get(order.taskId());
            if (t != null) {
                t.setSortOrder(order.sortOrder());
            }
        }
        taskRepo.saveAll(taskMap.values());
    }

    // -------------------------------------------------------------------------
    // 삭제
    // -------------------------------------------------------------------------

    /**
     * Task 삭제. 사유 필수 (보완 5).
     * 공정(parent = null) 삭제 시 하위 세부 Task도 함께 삭제한다.
     * TASK_DELETED 이벤트는 최상위 Task에 대해 1건만 기록한다.
     */
    @Transactional
    public void deleteTask(Long projectId, Long taskId, String reason) {
        if (reason == null || reason.isBlank()) {
            throw new IllegalArgumentException("삭제에는 사유가 필요합니다.");
        }
        accessChecker.checkWrite(projectId);
        Task task = loadTask(projectId, taskId);

        if (task.getParent() == null) {
            List<Task> subtasks =
                taskRepo.findByParentTaskIdOrderBySortOrderAsc(taskId);
            taskRepo.deleteAll(subtasks);
        }
        taskRepo.delete(task);

        recorder.record(projectId, "TASK_DELETED",
            task.getName() + " 삭제",
            Map.of("name", task.getName(), "taskId", taskId), null,
            reason, "TASK", taskId);
    }

    // -------------------------------------------------------------------------
    // 반환 / 커맨드 타입
    // -------------------------------------------------------------------------

    /** 공정 + 하위 세부 Task 목록 */
    public record TaskNode(Task process, List<Task> subtasks) {}

    /** reorder 요청 항목 */
    public record TaskOrder(Long taskId, int sortOrder) {}

    // -------------------------------------------------------------------------
    // 내부 스냅숏 레코드 (HistoryRecorder before/after 직렬화용)
    // -------------------------------------------------------------------------

    private record ScheduleSnapshot(LocalDate plannedStart, LocalDate plannedEnd) {}
    private record ActualDatesSnapshot(LocalDate actualStart, LocalDate actualEnd) {}
    private record StatusSnapshot(
        String status, int progress, LocalDate actualStart, LocalDate actualEnd) {}

    // -------------------------------------------------------------------------

    private Task loadTask(Long projectId, Long taskId) {
        return taskRepo.findById(taskId)
            .filter(t -> t.getProject().getProjectId().equals(projectId))
            .orElseThrow(() -> new NoSuchElementException("Task not found: " + taskId));
    }
}
