package com.example.projtrack.project;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import java.time.LocalDate;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;

class ProjectStatusCalculatorTest {

    private ProjectStatusCalculator calc;

    /** 테스트 기준 날짜 고정 */
    private static final LocalDate TODAY = LocalDate.of(2026, 2, 1);

    @BeforeEach
    void setUp() {
        calc = new ProjectStatusCalculator();
    }

    private ProjectStatusCalculator.StatusInput emptyInput() {
        return new ProjectStatusCalculator.StatusInput(
            List.of(), List.of(), null, null, null);
    }

    // =========================================================================
    // NORMAL
    // =========================================================================

    @Test
    @DisplayName("조건 없음 → NORMAL, 사유 목록 비어 있음")
    void noConditions_normal() {
        ProjectStatusCalculator.StatusSignal signal = calc.calc(emptyInput(), TODAY);
        assertThat(signal.status()).isEqualTo("NORMAL");
        assertThat(signal.reasons()).isEmpty();
    }

    @Test
    @DisplayName("완료된 마일스톤은 판정에서 제외")
    void doneMilestone_ignored() {
        ProjectStatusCalculator.StatusInput input = new ProjectStatusCalculator.StatusInput(
            List.of(new ProjectStatusCalculator.MilestoneInfo(TODAY.minusDays(30), "DONE")),
            List.of(), null, null, null
        );
        assertThat(calc.calc(input, TODAY).status()).isEqualTo("NORMAL");
    }

    // =========================================================================
    // CAUTION
    // =========================================================================

    @Test
    @DisplayName("마일스톤 14일 지연 → CAUTION (경계값: 14일은 주의)")
    void milestone_exactly14days_caution() {
        // ChronoUnit.DAYS.between(plannedDate, TODAY) = 14 → ≤14 → CAUTION
        LocalDate plannedDate = TODAY.minusDays(14);
        ProjectStatusCalculator.StatusInput input = new ProjectStatusCalculator.StatusInput(
            List.of(new ProjectStatusCalculator.MilestoneInfo(plannedDate, "PENDING")),
            List.of(), null, null, null
        );
        assertThat(calc.calc(input, TODAY).status()).isEqualTo("CAUTION");
    }

    @Test
    @DisplayName("열린 HIGH 이슈 1건 → CAUTION")
    void openHighIssue_caution() {
        ProjectStatusCalculator.StatusInput input = new ProjectStatusCalculator.StatusInput(
            List.of(),
            List.of(new ProjectStatusCalculator.IssueInfo("HIGH", "OPEN", null)),
            null, null, null
        );
        assertThat(calc.calc(input, TODAY).status()).isEqualTo("CAUTION");
    }

    @Test
    @DisplayName("마지막 이벤트 정확히 14일 전 → CAUTION (미갱신)")
    void lastEventExactly14DaysAgo_caution() {
        ProjectStatusCalculator.StatusInput input = new ProjectStatusCalculator.StatusInput(
            List.of(), List.of(), TODAY.minusDays(14), null, null
        );
        assertThat(calc.calc(input, TODAY).status()).isEqualTo("CAUTION");
    }

    // =========================================================================
    // DANGER
    // =========================================================================

    @Test
    @DisplayName("마일스톤 15일 지연 → DANGER (경계값: 15일은 위험)")
    void milestone_15days_danger() {
        // ChronoUnit.DAYS.between(plannedDate, TODAY) = 15 → >14 → DANGER
        LocalDate plannedDate = TODAY.minusDays(15);
        ProjectStatusCalculator.StatusInput input = new ProjectStatusCalculator.StatusInput(
            List.of(new ProjectStatusCalculator.MilestoneInfo(plannedDate, "PENDING")),
            List.of(), null, null, null
        );
        assertThat(calc.calc(input, TODAY).status()).isEqualTo("DANGER");
    }

    @Test
    @DisplayName("해결 기한을 넘긴 HIGH 이슈 → DANGER")
    void overdueHighIssue_danger() {
        // targetDate = 어제 → 오늘이 기한 초과
        ProjectStatusCalculator.StatusInput input = new ProjectStatusCalculator.StatusInput(
            List.of(),
            List.of(new ProjectStatusCalculator.IssueInfo(
                "HIGH", "IN_PROGRESS", TODAY.minusDays(1))),
            null, null, null
        );
        assertThat(calc.calc(input, TODAY).status()).isEqualTo("DANGER");
    }

    // =========================================================================
    // 복합 조건
    // =========================================================================

    @Test
    @DisplayName("DANGER + CAUTION 조건 동시 → DANGER, 사유 목록에 둘 다 포함")
    void dangerAndCaution_returnsDangerWithBothReasons() {
        ProjectStatusCalculator.StatusInput input = new ProjectStatusCalculator.StatusInput(
            List.of(new ProjectStatusCalculator.MilestoneInfo(
                TODAY.minusDays(15), "PENDING")),           // DANGER
            List.of(new ProjectStatusCalculator.IssueInfo(
                "HIGH", "OPEN", null)),                     // CAUTION
            null, null, null
        );
        ProjectStatusCalculator.StatusSignal signal = calc.calc(input, TODAY);
        assertThat(signal.status()).isEqualTo("DANGER");
        assertThat(signal.reasons()).hasSizeGreaterThanOrEqualTo(2);
    }

    @Test
    @DisplayName("MID·LOW 등급 이슈는 상태 판정에 영향 없음")
    void midLowIssue_noEffect() {
        ProjectStatusCalculator.StatusInput input = new ProjectStatusCalculator.StatusInput(
            List.of(),
            List.of(
                new ProjectStatusCalculator.IssueInfo("MID", "OPEN", null),
                new ProjectStatusCalculator.IssueInfo("LOW", "OPEN", null)
            ),
            null, null, null
        );
        assertThat(calc.calc(input, TODAY).status()).isEqualTo("NORMAL");
    }
}
