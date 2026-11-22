package com.example.projtrack.project.controller;

import com.example.projtrack.project.ProjectService;
import com.example.projtrack.project.ProjectStatusCalculator;
import com.example.projtrack.project.dto.CreateProjectRequest;
import com.example.projtrack.project.dto.ProjectHomeResponse;
import com.example.projtrack.project.dto.ProjectSummaryResponse;
import com.example.projtrack.wbs.domain.Milestone;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

import java.time.Clock;
import java.time.LocalDate;
import java.time.temporal.ChronoUnit;
import java.util.List;

@Tag(name = "Project", description = "사업 목록·홈 API")
@RestController
@RequestMapping("/api/v1/projects")
@RequiredArgsConstructor
public class ProjectController {

    private final ProjectService projectService;
    private final Clock clock;

    // -------------------------------------------------------------------------

    @Operation(summary = "신규 사업 등록")
    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public ProjectSummaryResponse createProject(@RequestBody @Valid CreateProjectRequest req) {
        LocalDate today = LocalDate.now(clock);
        return toSummaryResponse(projectService.createProject(req), today);
    }

    @Operation(summary = "사업 목록 조회 (포트폴리오 대시보드)")
    @GetMapping
    public List<ProjectSummaryResponse> listProjects() {
        LocalDate today = LocalDate.now(clock);
        return projectService.listProjectSummaries().stream()
            .map(d -> toSummaryResponse(d, today))
            .toList();
    }

    @Operation(summary = "사업 홈 요약 조회")
    @GetMapping("/{projectId}")
    public ProjectHomeResponse getHome(@PathVariable Long projectId) {
        ProjectService.ProjectHomeData data = projectService.getHome(projectId);
        LocalDate today = LocalDate.now(clock);
        return toHomeResponse(data, today);
    }

    // -------------------------------------------------------------------------
    // DTO 변환
    // -------------------------------------------------------------------------

    private ProjectSummaryResponse toSummaryResponse(ProjectService.ProjectSummaryData d, LocalDate today) {
        ProjectSummaryResponse.NextMilestoneInfo nextMs = toNextMilestoneInfo(d.nextMilestone(), today);
        ProjectStatusCalculator.StatusSignal sig = d.statusSignal();

        return new ProjectSummaryResponse(
            d.project().getProjectId(),
            d.project().getName(),
            d.project().getType(),
            d.project().getPhase(),
            d.project().getStartDate(),
            d.project().getEndDate(),
            d.progress(),
            d.openIssueCount(),
            new ProjectSummaryResponse.StatusSignalInfo(sig.status(), sig.reasons()),
            nextMs
        );
    }

    private ProjectHomeResponse toHomeResponse(ProjectService.ProjectHomeData d, LocalDate today) {
        ProjectHomeResponse.NextMilestoneInfo nextMs = d.nextMilestone() == null ? null :
            new ProjectHomeResponse.NextMilestoneInfo(
                d.nextMilestone().getName(),
                d.nextMilestone().getPlannedDate(),
                ChronoUnit.DAYS.between(today, d.nextMilestone().getPlannedDate())
            );

        List<ProjectHomeResponse.RecentEventInfo> recentEvents = d.recentEvents().stream()
            .map(e -> new ProjectHomeResponse.RecentEventInfo(
                e.getEventId(), e.getEventDate(), e.getType(), e.getSummary()))
            .toList();

        ProjectStatusCalculator.StatusSignal sig = d.statusSignal();

        return new ProjectHomeResponse(
            d.project().getProjectId(),
            d.project().getName(),
            d.project().getType(),
            d.project().getPhase(),
            d.project().getStatus(),
            d.project().getStartDate(),
            d.project().getEndDate(),
            d.project().getSummary(),
            d.progress(),
            d.openIssueCount(),
            new ProjectHomeResponse.StatusSignalInfo(sig.status(), sig.reasons()),
            nextMs,
            recentEvents
        );
    }

    private ProjectSummaryResponse.NextMilestoneInfo toNextMilestoneInfo(Milestone m, LocalDate today) {
        if (m == null) return null;
        return new ProjectSummaryResponse.NextMilestoneInfo(
            m.getName(),
            m.getPlannedDate(),
            ChronoUnit.DAYS.between(today, m.getPlannedDate())
        );
    }
}
