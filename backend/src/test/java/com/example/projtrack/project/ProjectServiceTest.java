package com.example.projtrack.project;

import com.example.projtrack.TestcontainersConfiguration;
import com.example.projtrack.history.domain.Issue;
import com.example.projtrack.history.domain.TimelineEvent;
import com.example.projtrack.history.repository.IssueRepository;
import com.example.projtrack.history.repository.TimelineEventRepository;
import com.example.projtrack.project.domain.Project;
import com.example.projtrack.project.repository.ProjectRepository;
import com.example.projtrack.wbs.domain.Milestone;
import com.example.projtrack.wbs.repository.MilestoneRepository;
import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.context.annotation.Import;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;

@SpringBootTest
@Import(TestcontainersConfiguration.class)
@Transactional
class ProjectServiceTest {

    @Autowired ProjectService projectService;
    @Autowired ProjectRepository projectRepo;
    @Autowired TimelineEventRepository eventRepo;
    @Autowired IssueRepository issueRepo;
    @Autowired MilestoneRepository milestoneRepo;
    @PersistenceContext EntityManager em;

    // =========================================================================

    @Test
    @DisplayName("getHome: 최근 이벤트·열린 이슈 수·다음 마일스톤·상태 신호 포함")
    void getHome_returnsAggregatedData() {
        Project p = project("홈 테스트 사업");
        em.persist(p);
        em.flush();

        // 타임라인 이벤트 3건
        for (int i = 1; i <= 3; i++) {
            TimelineEvent ev = event(p, LocalDate.of(2026, 1, i), "EVT");
            em.persist(ev);
        }

        // HIGH 열린 이슈 2건, CLOSED 1건
        em.persist(issue(p, "HIGH", "OPEN"));
        em.persist(issue(p, "HIGH", "OPEN"));
        em.persist(issue(p, "HIGH", "CLOSED"));

        // 마일스톤: 과거 완료 1건, 미래 미완료 1건
        em.persist(milestone(p, LocalDate.of(2025, 12, 1), "DONE"));
        em.persist(milestone(p, LocalDate.of(2027, 6, 1), "PENDING"));
        em.flush();

        ProjectService.ProjectHomeData home = projectService.getHome(p.getProjectId());

        // 최근 이벤트 ≤ 5
        assertThat(home.recentEvents()).hasSize(3);
        // 열린 이슈 수 (CLOSED 제외) = 2
        assertThat(home.openIssueCount()).isEqualTo(2);
        // 다음 마일스톤 = 2027-06-01
        assertThat(home.nextMilestone()).isNotNull();
        assertThat(home.nextMilestone().getPlannedDate()).isEqualTo(LocalDate.of(2027, 6, 1));
        // 상태 신호: HIGH OPEN 이슈 있으므로 CAUTION 이상
        assertThat(home.statusSignal().status()).isNotEqualTo("NORMAL");
        assertThat(home.statusSignal().reasons()).isNotEmpty();
    }

    @Test
    @DisplayName("listProjects: 사업 전체 반환 (현재 접근 제어 미적용)")
    void listProjects_returnsAll() {
        em.persist(project("사업A"));
        em.persist(project("사업B"));
        em.persist(project("사업C"));
        em.flush();

        List<Project> projects = projectService.listProjects();
        assertThat(projects.size()).isGreaterThanOrEqualTo(3);
    }

    // =========================================================================
    // 헬퍼
    // =========================================================================

    private Project project(String name) {
        Project p = new Project();
        p.setName(name);
        p.setType("INTERNAL");
        return p;
    }

    private TimelineEvent event(Project p, LocalDate date, String type) {
        TimelineEvent e = new TimelineEvent();
        e.setProject(p);
        e.setEventDate(date);
        e.setType(type);
        e.setSummary("테스트 이벤트");
        return e;
    }

    private Issue issue(Project p, String grade, String status) {
        Issue i = new Issue();
        i.setProject(p);
        i.setTitle("테스트 이슈");
        i.setGrade(grade);
        i.setStatus(status);
        i.setOccurredAt(LocalDate.of(2026, 1, 1));
        return i;
    }

    private Milestone milestone(Project p, LocalDate plannedDate, String status) {
        Milestone m = new Milestone();
        m.setProject(p);
        m.setName("테스트 마일스톤");
        m.setPlannedDate(plannedDate);
        m.setStatus(status);
        return m;
    }
}
