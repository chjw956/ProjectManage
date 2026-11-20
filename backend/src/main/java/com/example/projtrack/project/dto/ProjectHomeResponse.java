package com.example.projtrack.project.dto;

import java.time.LocalDate;
import java.util.List;

/**
 * 사업 홈 요약 응답 DTO (설계서 4.2).
 */
public record ProjectHomeResponse(
    Long projectId,
    String name,
    String type,
    String phase,
    String status,
    LocalDate startDate,
    LocalDate endDate,
    String summary,
    int progress,
    long openIssueCount,
    StatusSignalInfo statusSignal,
    NextMilestoneInfo nextMilestone,     // null 가능
    List<RecentEventInfo> recentEvents
) {
    public record StatusSignalInfo(String status, List<String> reasons) {}

    public record NextMilestoneInfo(String name, LocalDate plannedDate, long dDay) {}

    public record RecentEventInfo(
        Long eventId,
        LocalDate eventDate,
        String type,
        String summary
    ) {}
}
