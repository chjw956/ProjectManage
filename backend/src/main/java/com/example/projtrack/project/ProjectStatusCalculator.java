package com.example.projtrack.project;

import org.springframework.stereotype.Component;

import java.time.LocalDate;
import java.time.temporal.ChronoUnit;
import java.util.ArrayList;
import java.util.List;

/**
 * 사업 상태 신호 계산 (순수 함수, DB 접근 없음).
 * calc-rules 스킬 §3 구현.
 *
 * <p>위험 조건을 먼저 검사하고, 하나라도 해당하면 DANGER.
 * 위험 없이 주의 조건이 있으면 CAUTION. 모두 없으면 NORMAL.</p>
 *
 * <p>예산 지연(paymentDelays)·정부사업 의무 기한(obligationOverdue)은
 * 각 슬라이스에서 StatusInput에 채워 넣는다.</p>
 */
@Component
public class ProjectStatusCalculator {

    // -------------------------------------------------------------------------
    // Input / Output records
    // -------------------------------------------------------------------------

    public record MilestoneInfo(
        LocalDate plannedDate,
        String status   // PENDING, IN_PROGRESS, DONE, DELAYED
    ) {}

    public record IssueInfo(
        String grade,           // HIGH, MID, LOW
        String status,          // OPEN, IN_PROGRESS, CLOSED
        LocalDate targetDate    // nullable — 해결 기한
    ) {}

    public record StatusInput(
        List<MilestoneInfo> milestones,
        List<IssueInfo> issues,
        LocalDate lastEventDate,    // nullable — 미갱신 판정용
        Integer paymentDelays,      // nullable — 예산 슬라이스에서 채움
        Integer obligationOverdue   // nullable — 정부사업 슬라이스에서 채움
    ) {}

    public record StatusSignal(
        String status,          // NORMAL, CAUTION, DANGER
        List<String> reasons    // 판정 사유 목록 (NORMAL이면 빈 리스트)
    ) {}

    // -------------------------------------------------------------------------
    // 계산
    // -------------------------------------------------------------------------

    public StatusSignal calc(StatusInput input, LocalDate today) {
        List<String> dangerReasons = new ArrayList<>();
        List<String> cautionReasons = new ArrayList<>();

        // 마일스톤 지연 검사
        for (MilestoneInfo m : input.milestones()) {
            if ("DONE".equals(m.status())) continue;
            if (m.plannedDate() == null) continue;
            long delay = ChronoUnit.DAYS.between(m.plannedDate(), today);
            if (delay > 14) {
                dangerReasons.add("마일스톤 " + delay + "일 지연");
            } else if (delay > 0) {
                cautionReasons.add("마일스톤 " + delay + "일 이내 지연");
            }
        }

        // 이슈 검사 (HIGH 등급만 판정에 영향)
        for (IssueInfo i : input.issues()) {
            if ("CLOSED".equals(i.status())) continue;
            if (!"HIGH".equals(i.grade())) continue;
            if (i.targetDate() != null && today.isAfter(i.targetDate())) {
                dangerReasons.add("해결 기한 초과 HIGH 이슈");
            } else {
                cautionReasons.add("열린 HIGH 이슈");
            }
        }

        // 미갱신 검사 (마지막 이벤트 14일 이상 경과)
        if (input.lastEventDate() != null) {
            long daysSince = ChronoUnit.DAYS.between(input.lastEventDate(), today);
            if (daysSince >= 14) {
                cautionReasons.add("14일 이상 미갱신");
            }
        }

        // 예산 집행 지연 (예산 슬라이스에서 채워질 항목)
        if (input.paymentDelays() != null && input.paymentDelays() > 0) {
            cautionReasons.add("예산 집행 지연 " + input.paymentDelays() + "건");
        }

        // 정부사업 의무 기한 초과 (정부사업 슬라이스에서 채워질 항목)
        if (input.obligationOverdue() != null && input.obligationOverdue() > 0) {
            dangerReasons.add("정부사업 의무 기한 초과 " + input.obligationOverdue() + "건");
        }

        if (!dangerReasons.isEmpty()) {
            List<String> all = new ArrayList<>(dangerReasons);
            all.addAll(cautionReasons);
            return new StatusSignal("DANGER", all);
        }
        if (!cautionReasons.isEmpty()) {
            return new StatusSignal("CAUTION", cautionReasons);
        }
        return new StatusSignal("NORMAL", List.of());
    }
}
