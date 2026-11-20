package com.example.projtrack.wbs;

import com.example.projtrack.TestcontainersConfiguration;
import com.example.projtrack.history.repository.TimelineEventRepository;
import com.example.projtrack.project.domain.Project;
import com.example.projtrack.project.repository.ProjectRepository;
import com.example.projtrack.wbs.domain.Task;
import com.example.projtrack.wbs.repository.TaskRepository;
import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.mockito.Mockito;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.context.annotation.Import;
import org.springframework.data.domain.Pageable;
import org.springframework.test.context.bean.override.mockito.MockitoSpyBean;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.doThrow;

@SpringBootTest
@Import(TestcontainersConfiguration.class)
class TaskServiceTest {

    @Autowired TaskService taskService;
    @Autowired TaskRepository taskRepo;
    @Autowired ProjectRepository projectRepo;
    @Autowired TimelineEventRepository eventRepo;
    @PersistenceContext EntityManager em;

    @MockitoSpyBean
    TimelineEventRepository timelineEventSpy;

    @AfterEach
    void resetSpy() {
        Mockito.reset(timelineEventSpy);
    }

    // =========================================================================
    // createProcess
    // =========================================================================

    @Test
    @Transactional
    @DisplayName("공정 생성 → sort_order = 기존 최대 + 1")
    void createProcess_sortOrder_isMaxPlusOne() {
        Project p = savedProject();

        Task p1 = taskService.createProcess(p.getProjectId(), "공정A", null, null, null, null);
        Task p2 = taskService.createProcess(p.getProjectId(), "공정B", null, null, null, null);
        Task p3 = taskService.createProcess(p.getProjectId(), "공정C", null, null, null, null);

        assertThat(p1.getSortOrder()).isEqualTo(1);
        assertThat(p2.getSortOrder()).isEqualTo(2);
        assertThat(p3.getSortOrder()).isEqualTo(3);
    }

    // =========================================================================
    // reorder
    // =========================================================================

    @Test
    @Transactional
    @DisplayName("reorder → DB에 sort_order 반영")
    void reorder_updatesSortOrder() {
        Project p = savedProject();
        Task t1 = taskService.createProcess(p.getProjectId(), "공정1", null, null, null, null);
        Task t2 = taskService.createProcess(p.getProjectId(), "공정2", null, null, null, null);
        Task t3 = taskService.createProcess(p.getProjectId(), "공정3", null, null, null, null);
        em.flush();

        // 순서를 반전한다
        taskService.reorder(p.getProjectId(), null, List.of(
            new TaskService.TaskOrder(t1.getTaskId(), 3),
            new TaskService.TaskOrder(t2.getTaskId(), 2),
            new TaskService.TaskOrder(t3.getTaskId(), 1)
        ));
        em.flush();
        em.clear();

        List<Task> processes = taskRepo
            .findByProjectProjectIdAndParentIsNullOrderBySortOrderAsc(p.getProjectId());
        assertThat(processes.get(0).getTaskId()).isEqualTo(t3.getTaskId());
        assertThat(processes.get(1).getTaskId()).isEqualTo(t2.getTaskId());
        assertThat(processes.get(2).getTaskId()).isEqualTo(t1.getTaskId());
    }

    @Test
    @Transactional
    @DisplayName("다른 공정의 Task가 섞인 reorder → IllegalArgumentException")
    void reorder_crossParent_throws() {
        Project p = savedProject();
        Task procA = taskService.createProcess(p.getProjectId(), "공정A", null, null, null, null);
        Task procB = taskService.createProcess(p.getProjectId(), "공정B", null, null, null, null);
        Task subA  = taskService.createSubTask(p.getProjectId(), procA.getTaskId(),
                         "세부A1", null, null, null, null);
        Task subB  = taskService.createSubTask(p.getProjectId(), procB.getTaskId(),
                         "세부B1", null, null, null, null);
        em.flush();

        // subA(공정A 소속)와 subB(공정B 소속)를 공정A 하위로 reorder 시도
        assertThatThrownBy(() -> taskService.reorder(p.getProjectId(), procA.getTaskId(), List.of(
            new TaskService.TaskOrder(subA.getTaskId(), 1),
            new TaskService.TaskOrder(subB.getTaskId(), 2)
        ))).isInstanceOf(IllegalArgumentException.class);
    }

    // =========================================================================
    // changeStatus
    // =========================================================================

    @Test
    @Transactional
    @DisplayName("DONE 상태 변경 → 사유 없어도 성공, actualEnd·progress=100 자동 세팅")
    void changeStatus_done_noReasonRequired_setsActualEndAndProgress() {
        Project p = savedProject();
        Task task = taskService.createProcess(p.getProjectId(), "작업X", null, null,
            LocalDate.of(2026, 1, 1), LocalDate.of(2026, 1, 31));
        em.flush();

        Task updated = taskService.changeStatus(p.getProjectId(), task.getTaskId(), "DONE", null);

        assertThat(updated.getStatus()).isEqualTo("DONE");
        assertThat(updated.getProgress()).isEqualTo(100);
        assertThat(updated.getActualEnd()).isNotNull();
    }

    @Test
    @Transactional
    @DisplayName("IN_PROGRESS 상태 변경, 사유 없음 → IllegalArgumentException")
    void changeStatus_inProgress_noReason_throws() {
        Project p = savedProject();
        Task task = taskService.createProcess(p.getProjectId(), "작업Y", null, null, null, null);
        em.flush();

        assertThatThrownBy(() ->
            taskService.changeStatus(p.getProjectId(), task.getTaskId(), "IN_PROGRESS", null)
        ).isInstanceOf(IllegalArgumentException.class);
    }

    // =========================================================================
    // deleteTask
    // =========================================================================

    @Test
    @Transactional
    @DisplayName("공정 삭제 → 하위 세부 Task 모두 삭제, TASK_DELETED 이벤트 1건")
    void deleteProcess_cascadesToSubtasks_andRecordsOneEvent() {
        Project p = savedProject();
        Task proc = taskService.createProcess(p.getProjectId(), "삭제공정", null, null, null, null);
        taskService.createSubTask(p.getProjectId(), proc.getTaskId(), "세부1", null, null, null, null);
        taskService.createSubTask(p.getProjectId(), proc.getTaskId(), "세부2", null, null, null, null);
        em.flush();

        taskService.deleteTask(p.getProjectId(), proc.getTaskId(), "불필요한 공정");
        em.flush();

        // 공정·세부 Task 모두 삭제됐는지 확인
        assertThat(taskRepo.findByProjectProjectIdOrderBySortOrderAsc(p.getProjectId()))
            .isEmpty();

        // TASK_DELETED 이벤트 1건
        var events = eventRepo
            .findByProjectProjectIdOrderByEventDateDesc(p.getProjectId(), Pageable.unpaged());
        assertThat(events).hasSize(1);
        assertThat(events.get(0).getType()).isEqualTo("TASK_DELETED");
    }

    // =========================================================================
    // 트랜잭션 롤백 — changeSchedule 중 이벤트 저장 실패
    // =========================================================================

    @Test
    @DisplayName("이벤트 저장 실패 주입 → 일정 변경도 롤백")
    void changeSchedule_eventSaveFails_taskRollsBack() {
        // 비 @Transactional 테스트: 서비스 트랜잭션 경계를 실제로 검증
        // em.persist 대신 repository.save 사용 (별도 트랜잭션으로 커밋됨)
        Project p = new Project();
        p.setName("rollback-test-" + System.nanoTime());
        p.setType("INTERNAL");
        p = projectRepo.save(p);

        LocalDate origStart = LocalDate.of(2026, 1, 1);
        LocalDate origEnd   = LocalDate.of(2026, 1, 31);
        Task task = new Task();
        task.setProject(p);
        task.setName("롤백테스트");
        task.setSortOrder(1);
        task.setPlannedStart(origStart);
        task.setPlannedEnd(origEnd);
        task = taskRepo.save(task);

        Long projectId = p.getProjectId();
        Long taskId    = task.getTaskId();

        // 이벤트 저장 시 RuntimeException 주입
        doThrow(new RuntimeException("DB 오류 주입")).when(timelineEventSpy).save(any());

        assertThatThrownBy(() ->
            taskService.changeSchedule(projectId, taskId,
                LocalDate.of(2026, 2, 1), LocalDate.of(2026, 2, 28), "변경 사유")
        ).isInstanceOf(RuntimeException.class);

        // 트랜잭션이 롤백됐으므로 계획 일정이 원래 값이어야 한다
        Task loaded = taskRepo.findById(taskId).orElseThrow();
        assertThat(loaded.getPlannedStart()).isEqualTo(origStart);
        assertThat(loaded.getPlannedEnd()).isEqualTo(origEnd);

        // 정리
        taskRepo.deleteById(taskId);
        projectRepo.deleteById(projectId);
    }

    // =========================================================================
    // 헬퍼
    // =========================================================================

    private Project savedProject() {
        Project p = new Project();
        p.setName("test-project-" + System.nanoTime());
        p.setType("INTERNAL");
        em.persist(p);
        return p;
    }

    private Task buildTask(Project p, String name, int sortOrder) {
        Task t = new Task();
        t.setProject(p);
        t.setName(name);
        t.setSortOrder(sortOrder);
        return t;
    }
}
