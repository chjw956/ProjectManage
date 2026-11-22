package com.example.projtrack.history;

import com.example.projtrack.auth.ProjectAccessChecker;
import com.example.projtrack.history.domain.Issue;
import com.example.projtrack.history.dto.IssueResponse;
import com.example.projtrack.history.repository.IssueRepository;
import com.example.projtrack.project.repository.ProjectRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Clock;
import java.time.LocalDate;
import java.util.Comparator;
import java.util.List;
import java.util.Map;
import java.util.NoSuchElementException;

/**
 * 이슈·리스크 레지스터 조회 (설계서 4.5). 현재는 열린 이슈 조회만 제공한다.
 * 등록·수정·해결 처리는 history 슬라이스에서 사유 입력·타임라인 기록과 함께 구현한다.
 */
@Service
@Transactional(readOnly = true)
@RequiredArgsConstructor
public class IssueService {

    private static final Map<String, Integer> GRADE_ORDER = Map.of("HIGH", 0, "MID", 1, "LOW", 2);

    /** 등급 높은 순 → 목표일 빠른 순(미정은 뒤) → 발생일 빠른 순 */
    static final Comparator<Issue> OPEN_ISSUE_ORDER =
        Comparator.<Issue>comparingInt(i -> GRADE_ORDER.getOrDefault(i.getGrade(), 99))
            .thenComparing(Issue::getTargetDate, Comparator.nullsLast(Comparator.naturalOrder()))
            .thenComparing(Issue::getOccurredAt, Comparator.nullsLast(Comparator.naturalOrder()));

    private final IssueRepository issueRepo;
    private final ProjectRepository projectRepo;
    private final ProjectAccessChecker accessChecker;
    private final Clock clock;

    /** 열린 이슈(CLOSED 제외) — openIssueCount와 같은 기준 */
    public List<IssueResponse> listOpenIssues(Long projectId) {
        accessChecker.checkRead(projectId);
        if (!projectRepo.existsById(projectId)) {
            throw new NoSuchElementException("Project not found: " + projectId);
        }

        LocalDate today = LocalDate.now(clock);
        return issueRepo.findByProjectProjectIdAndStatusNot(projectId, "CLOSED").stream()
            .sorted(OPEN_ISSUE_ORDER)
            .map(i -> toResponse(i, today))
            .toList();
    }

    private static IssueResponse toResponse(Issue i, LocalDate today) {
        boolean overdue = i.getTargetDate() != null && i.getTargetDate().isBefore(today);
        return new IssueResponse(
            i.getIssueId(), i.getTitle(), i.getGrade(), i.getStatus(), i.getAssignee(),
            i.getOccurredAt(), i.getTargetDate(), i.getResponse(), overdue);
    }
}
