package com.example.projtrack.wbs.controller;

import com.example.projtrack.wbs.MilestoneService;
import com.example.projtrack.wbs.domain.Milestone;
import com.example.projtrack.wbs.dto.DeleteRequest;
import com.example.projtrack.wbs.dto.MilestoneRequest;
import com.example.projtrack.wbs.dto.MilestoneResponse;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

import java.time.Clock;
import java.time.LocalDate;
import java.time.temporal.ChronoUnit;
import java.util.List;

@Tag(name = "Milestone", description = "마일스톤 CRUD API")
@RestController
@RequestMapping("/api/v1/projects/{projectId}/milestones")
@RequiredArgsConstructor
public class MilestoneController {

    private final MilestoneService milestoneService;
    private final Clock clock;

    @Operation(summary = "마일스톤 목록 조회")
    @GetMapping
    public List<MilestoneResponse> listMilestones(@PathVariable Long projectId) {
        LocalDate today = LocalDate.now(clock);
        return milestoneService.list(projectId).stream()
            .map(m -> toResponse(m, today))
            .toList();
    }

    @Operation(summary = "마일스톤 생성")
    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public MilestoneResponse createMilestone(@PathVariable Long projectId,
                                             @RequestBody @Valid MilestoneRequest req) {
        Milestone m = milestoneService.create(projectId, req.name(), req.type(), req.plannedDate());
        return toResponse(m, LocalDate.now(clock));
    }

    @Operation(summary = "마일스톤 수정 (날짜 변경 시 사유 필수)")
    @PutMapping("/{milestoneId}")
    public MilestoneResponse updateMilestone(@PathVariable Long projectId,
                                             @PathVariable Long milestoneId,
                                             @RequestBody @Valid MilestoneRequest req) {
        Milestone m = milestoneService.update(projectId, milestoneId,
            req.name(), req.type(), req.plannedDate(),
            req.actualDate(), req.status(), req.reason());
        return toResponse(m, LocalDate.now(clock));
    }

    @Operation(summary = "마일스톤 삭제 (사유 필수)")
    @DeleteMapping("/{milestoneId}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void deleteMilestone(@PathVariable Long projectId,
                                @PathVariable Long milestoneId,
                                @RequestBody @Valid DeleteRequest req) {
        milestoneService.delete(projectId, milestoneId, req.reason());
    }

    // -------------------------------------------------------------------------

    private MilestoneResponse toResponse(Milestone m, LocalDate today) {
        long dDay = m.getPlannedDate() != null
            ? ChronoUnit.DAYS.between(today, m.getPlannedDate())
            : 0L;
        return new MilestoneResponse(
            m.getMilestoneId(),
            m.getProject().getProjectId(),
            m.getName(),
            m.getType(),
            m.getPlannedDate(),
            m.getActualDate(),
            m.getStatus(),
            dDay
        );
    }
}
