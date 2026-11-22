package com.example.projtrack.history;

import com.example.projtrack.TestcontainersConfiguration;
import com.example.projtrack.history.domain.Issue;
import com.example.projtrack.history.dto.IssueResponse;
import com.example.projtrack.project.domain.Project;
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
import java.util.NoSuchElementException;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

@SpringBootTest
@Import(TestcontainersConfiguration.class)
@Transactional
class IssueServiceTest {

    // 오늘 날짜와 무관하게 판정되도록 먼 과거·미래 날짜를 쓴다.
    private static final LocalDate PAST = LocalDate.of(2020, 1, 1);
    private static final LocalDate FUTURE = LocalDate.of(2099, 1, 1);

    @Autowired IssueService issueService;
    @PersistenceContext EntityManager em;

    @Test
    @DisplayName("listOpenIssues: CLOSED 제외, OPEN·IN_PROGRESS만 반환")
    void excludesClosed() {
        Project p = persistProject();
        em.persist(issue(p, "열린 이슈", "MID", "OPEN", FUTURE));
        em.persist(issue(p, "진행중 이슈", "MID", "IN_PROGRESS", FUTURE));
        em.persist(issue(p, "해결된 이슈", "HIGH", "CLOSED", FUTURE));
        em.flush();

        List<IssueResponse> result = issueService.listOpenIssues(p.getProjectId());

        assertThat(result).extracting(IssueResponse::title)
            .containsExactlyInAnyOrder("열린 이슈", "진행중 이슈");
    }

    @Test
    @DisplayName("listOpenIssues: 등급(HIGH→MID→LOW) → 목표일(미정은 뒤) 순 정렬")
    void sortedByGradeThenTargetDate() {
        Project p = persistProject();
        em.persist(issue(p, "LOW", "LOW", "OPEN", PAST));
        em.persist(issue(p, "MID-미정", "MID", "OPEN", null));
        em.persist(issue(p, "MID-늦음", "MID", "OPEN", FUTURE));
        em.persist(issue(p, "MID-빠름", "MID", "OPEN", PAST));
        em.persist(issue(p, "HIGH", "HIGH", "OPEN", FUTURE));
        em.flush();

        List<IssueResponse> result = issueService.listOpenIssues(p.getProjectId());

        assertThat(result).extracting(IssueResponse::title)
            .containsExactly("HIGH", "MID-빠름", "MID-늦음", "MID-미정", "LOW");
    }

    @Test
    @DisplayName("listOpenIssues: 목표일이 지났으면 overdue=true, 미래·미정이면 false")
    void overdueFlag() {
        Project p = persistProject();
        em.persist(issue(p, "기한 초과", "HIGH", "OPEN", PAST));
        em.persist(issue(p, "기한 남음", "HIGH", "OPEN", FUTURE));
        em.persist(issue(p, "기한 미정", "HIGH", "OPEN", null));
        em.flush();

        List<IssueResponse> result = issueService.listOpenIssues(p.getProjectId());

        assertThat(result).filteredOn(IssueResponse::overdue)
            .extracting(IssueResponse::title).containsExactly("기한 초과");
    }

    @Test
    @DisplayName("listOpenIssues: 이슈 없으면 빈 목록")
    void emptyWhenNoIssues() {
        Project p = persistProject();
        assertThat(issueService.listOpenIssues(p.getProjectId())).isEmpty();
    }

    @Test
    @DisplayName("listOpenIssues: 존재하지 않는 사업 → NoSuchElementException(404)")
    void unknownProject() {
        assertThatThrownBy(() -> issueService.listOpenIssues(-1L))
            .isInstanceOf(NoSuchElementException.class);
    }

    // TODO(권한 슬라이스): ProjectAccessChecker 실제 구현 후 비참여자 조회 거부, 기밀 사업 이슈 차단 테스트 추가

    // =========================================================================

    private Project persistProject() {
        Project p = new Project();
        p.setName("가상 이슈 테스트 사업");
        p.setType("INTERNAL");
        em.persist(p);
        return p;
    }

    private Issue issue(Project p, String title, String grade, String status, LocalDate targetDate) {
        Issue i = new Issue();
        i.setProject(p);
        i.setTitle(title);
        i.setGrade(grade);
        i.setStatus(status);
        i.setOccurredAt(LocalDate.of(2019, 1, 1));
        i.setTargetDate(targetDate);
        return i;
    }
}
