package com.example.projtrack.wbs;

import com.example.projtrack.TestcontainersConfiguration;
import com.example.projtrack.project.domain.Project;
import com.example.projtrack.project.repository.ProjectRepository;
import com.example.projtrack.wbs.domain.Task;
import com.example.projtrack.wbs.repository.TaskRepository;
import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.context.annotation.Import;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;

@SpringBootTest
@Import(TestcontainersConfiguration.class)
@Transactional
class TaskRepositoryTest {

    @PersistenceContext
    private EntityManager em;

    @Autowired
    private TaskRepository taskRepository;

    @Autowired
    private ProjectRepository projectRepository;

    // -------------------------------------------------------------------------

    private Project savedProject(String name) {
        Project p = new Project();
        p.setName(name);
        p.setType("INTERNAL");
        em.persist(p);
        em.flush();
        return p;
    }

    private Task task(Project project, String name, int sortOrder) {
        Task t = new Task();
        t.setProject(project);
        t.setName(name);
        t.setSortOrder(sortOrder);
        return t;
    }

    // =========================================================================
    // 테스트
    // =========================================================================

    @Test
    @DisplayName("findByProjectIdOrderBySortOrderAsc → sort_order 오름차순 반환")
    void findByProjectId_returnsSortedBySortOrder() {
        Project project = savedProject("sort-test");

        em.persist(task(project, "task-C", 3));
        em.persist(task(project, "task-A", 1));
        em.persist(task(project, "task-B", 2));
        em.flush();

        List<Task> tasks = taskRepository
            .findByProjectProjectIdOrderBySortOrderAsc(project.getProjectId());

        assertThat(tasks).hasSize(3);
        assertThat(tasks.get(0).getName()).isEqualTo("task-A");
        assertThat(tasks.get(1).getName()).isEqualTo("task-B");
        assertThat(tasks.get(2).getName()).isEqualTo("task-C");
    }

    @Test
    @DisplayName("세부 Task → parent.taskId Lazy 로딩 접근 가능")
    void subtask_parentReference_lazyLoading() {
        Project project = savedProject("lazy-test");

        Task process = task(project, "process", 1);
        em.persist(process);
        em.flush();

        Task subtask = task(project, "subtask", 1);
        subtask.setParent(process);
        em.persist(subtask);
        em.flush();

        em.clear();  // 1차 캐시 비워 Lazy 로딩 강제

        Task loaded = taskRepository.findById(subtask.getTaskId()).orElseThrow();
        assertThat(loaded.getParent().getTaskId()).isEqualTo(process.getTaskId());
    }
}
