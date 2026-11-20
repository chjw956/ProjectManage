package com.example.projtrack.history;

import com.example.projtrack.TestcontainersConfiguration;
import com.example.projtrack.history.domain.TimelineEvent;
import com.example.projtrack.history.repository.TimelineEventRepository;
import com.example.projtrack.project.domain.Project;
import com.example.projtrack.project.repository.ProjectRepository;
import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.context.annotation.Import;
import org.springframework.data.domain.Pageable;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Map;

import static org.assertj.core.api.Assertions.assertThat;

@SpringBootTest
@Import(TestcontainersConfiguration.class)
@Transactional
class HistoryRecorderTest {

    @Autowired HistoryRecorder historyRecorder;
    @Autowired ProjectRepository projectRepo;
    @Autowired TimelineEventRepository eventRepo;
    @PersistenceContext EntityManager em;

    // -------------------------------------------------------------------------

    @Test
    @DisplayName("before ≠ after → 이벤트 1건 저장, before/after·reason·refType 정확")
    void record_differentValues_savesEventWithCorrectFields() {
        Project p = project("hist-diff-test");
        em.persist(p);
        em.flush();

        Map<String, String> before = Map.of("plannedStart", "2026-01-01");
        Map<String, String> after  = Map.of("plannedStart", "2026-02-01");

        historyRecorder.record(p.getProjectId(), "SCHEDULE_CHANGED", "일정 변경",
            before, after, "승인 완료", "TASK", 42L);
        em.flush();

        List<TimelineEvent> events = eventRepo
            .findByProjectProjectIdOrderByEventDateDesc(p.getProjectId(), Pageable.unpaged());
        assertThat(events).hasSize(1);

        TimelineEvent ev = events.get(0);
        assertThat(ev.getType()).isEqualTo("SCHEDULE_CHANGED");
        assertThat(ev.getBeforeState()).contains("2026-01-01");
        assertThat(ev.getAfterState()).contains("2026-02-01");
        assertThat(ev.getReason()).isEqualTo("승인 완료");
        assertThat(ev.getRefType()).isEqualTo("TASK");
        assertThat(ev.getRefEntityId()).isEqualTo(42L);
    }

    @Test
    @DisplayName("before == after → 이벤트 저장 안 함")
    void record_sameValues_noEvent() {
        Project p = project("hist-same-test");
        em.persist(p);
        em.flush();

        Map<String, String> val = Map.of("plannedStart", "2026-01-01");

        historyRecorder.record(p.getProjectId(), "SCHEDULE_CHANGED", "변경없음",
            val, val, null, "TASK", 42L);
        em.flush();

        List<TimelineEvent> events = eventRepo
            .findByProjectProjectIdOrderByEventDateDesc(p.getProjectId(), Pageable.unpaged());
        assertThat(events).isEmpty();
    }

    // -------------------------------------------------------------------------

    private Project project(String name) {
        Project p = new Project();
        p.setName(name);
        p.setType("INTERNAL");
        return p;
    }
}
