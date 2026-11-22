package com.example.projtrack.history.controller;

import com.example.projtrack.history.IssueService;
import com.example.projtrack.history.dto.IssueResponse;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@Tag(name = "Issue", description = "이슈·리스크 레지스터 API")
@RestController
@RequestMapping("/api/v1/projects/{projectId}/issues")
@RequiredArgsConstructor
public class IssueController {

    private final IssueService issueService;

    @Operation(summary = "열린 이슈 목록 조회 (CLOSED 제외)")
    @GetMapping
    public List<IssueResponse> listIssues(
            @PathVariable Long projectId,
            @Parameter(description = "현재 open만 지원") @RequestParam(defaultValue = "open") String status) {
        if (!"open".equals(status)) {
            throw new IllegalArgumentException("지원하지 않는 status 값입니다: " + status);
        }
        return issueService.listOpenIssues(projectId);
    }
}
