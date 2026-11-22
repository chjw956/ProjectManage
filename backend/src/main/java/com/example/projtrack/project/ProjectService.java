package com.example.projtrack.project;

import com.example.projtrack.auth.ProjectAccessChecker;
import com.example.projtrack.history.domain.Issue;
import com.example.projtrack.history.domain.TimelineEvent;
import com.example.projtrack.history.repository.IssueRepository;
import com.example.projtrack.history.repository.TimelineEventRepository;
import com.example.projtrack.project.domain.Project;
import com.example.projtrack.project.dto.CreateProjectRequest;
import com.example.projtrack.project.repository.ProjectRepository;
import com.example.projtrack.wbs.TaskCalculator;
import com.example.projtrack.wbs.domain.Milestone;
import com.example.projtrack.wbs.domain.Task;
import com.example.projtrack.wbs.repository.MilestoneRepository;
import com.example.projtrack.wbs.repository.TaskRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Clock;
import java.time.LocalDate;
import java.util.List;
import java.util.Map;
import java.util.NoSuchElementException;
import java.util.stream.Collectors;

@Service
@Transactional(readOnly = true)
@RequiredArgsConstructor
public class ProjectService {

    private final ProjectRepository projectRepo;
    private final TimelineEventRepository eventRepo;
    private final IssueRepository issueRepo;
    private final MilestoneRepository milestoneRepo;
    private final TaskRepository taskRepo;
    private final TaskCalculator taskCalc;
    private final ProjectStatusCalculator statusCalculator;
    private final ProjectAccessChecker accessChecker;
    private final Clock clock;

    // -------------------------------------------------------------------------
    // 사업 등록
    // -------------------------------------------------------------------------

    @Transactional
    public ProjectSummaryData createProject(CreateProjectRequest req) {
        var project = new Project();
        project.setName(req.name());
        project.setType(req.type());
        project.setPhase(req.phase());
        project.setStartDate(req.startDate());
        project.setEndDate(req.endDate());
        project.setSummary(req.summary());
        // status = "NORMAL" (기본값), securityLevel = "NORMAL" (기본값)
        var saved = projectRepo.save(project);

        var statusSignal = new ProjectStatusCalculator.StatusSignal("NORMAL", List.of());
        return new ProjectSummaryData(saved, 0, 0L, statusSignal, null);
    }

    // -------------------------------------------------------------------------
    // 사업 목록
    // -------------------------------------------------------------------------

    /**
     * 전체 사업 목록을 반환한다.
     * Phase 2에서 ProjectAccessChecker가 완성되면 참여 사업만 반환한다.
     */
    public List<Project> listProjects() {
        return projectRepo.findAll();
    }

    /**
     * 사업 목록 — 카드 요약 데이터 포함.
     * 포트폴리오 대시보드(F1) 용.
     */
    public List<ProjectSummaryData> listProjectSummaries() {
        List<Project> projects = projectRepo.findAll();
        LocalDate today = LocalDate.now(clock);
        return projects.stream()
            .map(p -> buildSummaryData(p, today))
            .toList();
    }

    // -------------------------------------------------------------------------
    // 사업 홈 요약
    // -------------------------------------------------------------------------

    public ProjectHomeData getHome(Long projectId) {
        accessChecker.checkRead(projectId);

        Project project = projectRepo.findById(projectId)
            .orElseThrow(() -> new NoSuchElementException("Project not found: " + projectId));

        // 최근 이벤트 5건
        List<TimelineEvent> recentEvents = eventRepo
            .findByProjectProjectIdOrderByEventDateDesc(projectId, PageRequest.of(0, 5));

        // 열린 이슈 수 (CLOSED 제외)
        long openIssueCount = issueRepo.countByProjectProjectIdAndStatusNot(projectId, "CLOSED");

        // 마일스톤 목록
        List<Milestone> milestones =
            milestoneRepo.findByProjectProjectIdOrderByPlannedDateAsc(projectId);
        LocalDate today = LocalDate.now(clock);

        // 다음 마일스톤: 가장 가까운 미래의 비완료 마일스톤
        Milestone nextMilestone = milestones.stream()
            .filter(m -> !"DONE".equals(m.getStatus()))
            .filter(m -> m.getPlannedDate() != null && !m.getPlannedDate().isBefore(today))
            .findFirst()
            .orElse(null);

        // 사업 상태 신호
        List<Issue> openIssues = issueRepo.findByProjectProjectIdAndStatusNot(projectId, "CLOSED");
        LocalDate lastEventDate = recentEvents.isEmpty()
            ? null
            : recentEvents.get(0).getEventDate();

        var statusInput = new ProjectStatusCalculator.StatusInput(
            milestones.stream()
                .map(m -> new ProjectStatusCalculator.MilestoneInfo(m.getPlannedDate(), m.getStatus()))
                .toList(),
            openIssues.stream()
                .map(i -> new ProjectStatusCalculator.IssueInfo(i.getGrade(), i.getStatus(), i.getTargetDate()))
                .toList(),
            lastEventDate,
            null, null
        );
        var statusSignal = statusCalculator.calc(statusInput, today);

        // 사업 진척률
        List<Task> allTasks = taskRepo.findByProjectProjectIdOrderBySortOrderAsc(projectId);
        int progress = computeProjectProgress(allTasks);

        return new ProjectHomeData(project, recentEvents, openIssueCount, nextMilestone, statusSignal, progress);
    }

    // -------------------------------------------------------------------------
    // 반환 타입
    // -------------------------------------------------------------------------

    /** 사업 홈 요약 데이터. */
    public record ProjectHomeData(
        Project project,
        List<TimelineEvent> recentEvents,
        long openIssueCount,
        Milestone nextMilestone,
        ProjectStatusCalculator.StatusSignal statusSignal,
        int progress
    ) {}

    /** 포트폴리오 목록 카드용 요약 데이터. */
    public record ProjectSummaryData(
        Project project,
        int progress,
        long openIssueCount,
        ProjectStatusCalculator.StatusSignal statusSignal,
        Milestone nextMilestone     // null 가능
    ) {}

    // -------------------------------------------------------------------------
    // 내부 헬퍼
    // -------------------------------------------------------------------------

    private ProjectSummaryData buildSummaryData(Project p, LocalDate today) {
        Long projectId = p.getProjectId();

        // 진척률
        List<Task> allTasks = taskRepo.findByProjectProjectIdOrderBySortOrderAsc(projectId);
        int progress = computeProjectProgress(allTasks);

        // 열린 이슈 수
        long openIssueCount = issueRepo.countByProjectProjectIdAndStatusNot(projectId, "CLOSED");

        // 마일스톤
        List<Milestone> milestones =
            milestoneRepo.findByProjectProjectIdOrderByPlannedDateAsc(projectId);
        Milestone nextMilestone = milestones.stream()
            .filter(m -> !"DONE".equals(m.getStatus()))
            .filter(m -> m.getPlannedDate() != null && !m.getPlannedDate().isBefore(today))
            .findFirst().orElse(null);

        // 상태 신호
        List<Issue> openIssues = issueRepo.findByProjectProjectIdAndStatusNot(projectId, "CLOSED");
        LocalDate lastEventDate = eventRepo
            .findByProjectProjectIdOrderByEventDateDesc(projectId, PageRequest.of(0, 1))
            .stream().findFirst().map(TimelineEvent::getEventDate).orElse(null);

        var statusInput = new ProjectStatusCalculator.StatusInput(
            milestones.stream()
                .map(m -> new ProjectStatusCalculator.MilestoneInfo(m.getPlannedDate(), m.getStatus()))
                .toList(),
            openIssues.stream()
                .map(i -> new ProjectStatusCalculator.IssueInfo(i.getGrade(), i.getStatus(), i.getTargetDate()))
                .toList(),
            lastEventDate, null, null
        );
        var statusSignal = statusCalculator.calc(statusInput, today);

        return new ProjectSummaryData(p, progress, openIssueCount, statusSignal, nextMilestone);
    }

    /**
     * 사업 진척률 계산.
     * 공정 → 하위 Task 가중 평균 → 사업 가중 평균 (calc-rules 스킬 §1).
     */
    private int computeProjectProgress(List<Task> allTasks) {
        List<Task> processes = allTasks.stream()
            .filter(t -> t.getParent() == null).toList();
        Map<Long, List<Task>> subtasksByParent = allTasks.stream()
            .filter(t -> t.getParent() != null)
            .collect(Collectors.groupingBy(t -> t.getParent().getTaskId()));

        List<TaskCalculator.ProcessProgress> processProgressList = processes.stream()
            .map(proc -> {
                List<Task> subs = subtasksByParent.getOrDefault(proc.getTaskId(), List.of());
                List<TaskCalculator.TaskProgress> subtaskProgress = subs.stream()
                    .map(t -> new TaskCalculator.TaskProgress(
                        t.getTaskId(), t.getProgress(), t.getPlannedStart(), t.getPlannedEnd(), t.getStatus()))
                    .toList();
                int pProgress = subs.isEmpty()
                    ? proc.getProgress()
                    : taskCalc.calcProcessProgress(subtaskProgress);
                return new TaskCalculator.ProcessProgress(pProgress, proc.getPlannedStart(), proc.getPlannedEnd());
            })
            .toList();

        return taskCalc.calcProjectProgress(processProgressList);
    }
}
