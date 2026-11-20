package com.example.projtrack.project.dto;

import java.time.LocalDate;
import java.util.List;

/**
 * 포트폴리오 목록 카드용 응답 DTO (설계서 4.1).
 * 사업명, 유형, 단계, 상태 신호등, 진척률, 다음 마일스톤 D-day, 열린 이슈 수.
 */
public record ProjectSummaryResponse(
    Long projectId,
    String name,
    String type,                        // INTERNAL, GOV
    String phase,
    LocalDate startDate,
    LocalDate endDate,
    int progress,
    long openIssueCount,
    StatusSignalInfo statusSignal,
    NextMilestoneInfo nextMilestone      // null 가능 — 다음 마일스톤 없을 때
) {
    public record StatusSignalInfo(String status, List<String> reasons) {}

    /** 다음 마일스톤 정보. dDay &lt; 0 이면 D-|dDay|, 0이면 D-Day, &gt; 0이면 초과 */
    public record NextMilestoneInfo(String name, LocalDate plannedDate, long dDay) {}
}
