package com.example.projtrack.wbs;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;

class TaskCalculatorTest {

    private TaskCalculator calc;

    @BeforeEach
    void setUp() {
        calc = new TaskCalculator();
    }

    // =========================================================================
    // calcProcessProgress
    // =========================================================================

    @Test
    @DisplayName("하위 Task 없는 공정 → 0%")
    void emptySubtasks_returns0() {
        assertThat(calc.calcProcessProgress(List.of())).isZero();
    }

    @Test
    @DisplayName("T1(30일, 100%) + T2(10일, 0%) 가중 평균 → 75%")
    void weightedAverage_30and10days() {
        // T1: 2026-01-01 ~ 2026-01-30 → between = 29일, +1 = 30일
        // T2: 2026-02-01 ~ 2026-02-10 → between = 9일, +1 = 10일
        // 가중합 = 100*30 + 0*10 = 3000, 총 가중 = 40 → 75.0 → 75%
        List<TaskCalculator.TaskProgress> subtasks = List.of(
            new TaskCalculator.TaskProgress(1L, 100,
                LocalDate.of(2026, 1, 1), LocalDate.of(2026, 1, 30), "DONE"),
            new TaskCalculator.TaskProgress(2L, 0,
                LocalDate.of(2026, 2, 1), LocalDate.of(2026, 2, 10), "PENDING")
        );
        assertThat(calc.calcProcessProgress(subtasks)).isEqualTo(75);
    }

    @Test
    @DisplayName("계획 기간 0일 Task(날짜 null) → 가중치 1일로 처리")
    void nullPlannedDays_treatedAsOne() {
        // 각 가중치 1 → (100 + 0) / 2 = 50%
        List<TaskCalculator.TaskProgress> subtasks = List.of(
            new TaskCalculator.TaskProgress(1L, 100, null, null, "DONE"),
            new TaskCalculator.TaskProgress(2L, 0,   null, null, "PENDING")
        );
        assertThat(calc.calcProcessProgress(subtasks)).isEqualTo(50);
    }

    @Test
    @DisplayName("공정 진척률로 사업 진척률 가중 평균")
    void projectProgressFromProcesses() {
        // P1: 90일(Jan~Mar), 100%  / P2: 30일(Apr), 0%
        // 가중합 = 100*90 + 0*30 = 9000, 총 120 → 75%
        List<TaskCalculator.ProcessProgress> processes = List.of(
            new TaskCalculator.ProcessProgress(100,
                LocalDate.of(2026, 1, 1), LocalDate.of(2026, 3, 31)),
            new TaskCalculator.ProcessProgress(0,
                LocalDate.of(2026, 4, 1), LocalDate.of(2026, 4, 30))
        );
        assertThat(calc.calcProjectProgress(processes)).isEqualTo(75);
    }

    @Test
    @DisplayName("반올림은 마지막에 한 번만 — 중간 반올림 오류 방지")
    void roundingOnce() {
        // 각 10일, progress: 34%, 34%, 33%
        // weightedSum = 34*10 + 34*10 + 33*10 = 1010, totalWeight = 30
        // 1010/30 = 33.666... → 반올림 34%
        // (중간 반올림하면 각 11+11+11=33% — 오류)
        List<TaskCalculator.TaskProgress> subtasks = List.of(
            new TaskCalculator.TaskProgress(1L, 34,
                LocalDate.of(2026, 1, 1), LocalDate.of(2026, 1, 10), "IN_PROGRESS"),
            new TaskCalculator.TaskProgress(2L, 34,
                LocalDate.of(2026, 1, 1), LocalDate.of(2026, 1, 10), "IN_PROGRESS"),
            new TaskCalculator.TaskProgress(3L, 33,
                LocalDate.of(2026, 1, 1), LocalDate.of(2026, 1, 10), "IN_PROGRESS")
        );
        assertThat(calc.calcProcessProgress(subtasks)).isEqualTo(34);
    }

    // =========================================================================
    // isDelayed
    // =========================================================================

    @Test
    @DisplayName("완료(DONE) 상태 Task는 종료일이 지나도 지연 아님")
    void doneTask_notDelayed() {
        TaskCalculator.TaskProgress task = new TaskCalculator.TaskProgress(
            1L, 100,
            LocalDate.of(2026, 1, 1), LocalDate.of(2026, 1, 10),
            "DONE"
        );
        assertThat(calc.isDelayed(task, LocalDate.of(2026, 2, 1))).isFalse();
    }

    @Test
    @DisplayName("오늘 = 계획 종료일 → 조건 1(>)은 발동 안 함")
    void today_equals_plannedEnd_condition1_notTriggered() {
        // 마지막 날 progress=90: expectedProgress = 9/10*100 = 90%, diff=0 < 30 → 조건 2도 false
        // → 종료일 당일에는 "초과"가 아니므로 not delayed
        TaskCalculator.TaskProgress task = new TaskCalculator.TaskProgress(
            1L, 90,
            LocalDate.of(2026, 1, 1), LocalDate.of(2026, 1, 10),
            "IN_PROGRESS"
        );
        assertThat(calc.isDelayed(task, LocalDate.of(2026, 1, 10))).isFalse();
    }

    @Test
    @DisplayName("오늘 = 계획 종료일 + 1일 → 지연")
    void today_one_day_after_plannedEnd_delayed() {
        TaskCalculator.TaskProgress task = new TaskCalculator.TaskProgress(
            1L, 50,
            LocalDate.of(2026, 1, 1), LocalDate.of(2026, 1, 10),
            "IN_PROGRESS"
        );
        assertThat(calc.isDelayed(task, LocalDate.of(2026, 1, 11))).isTrue();
    }

    @Test
    @DisplayName("기대 진행률 − 실제 진행률 = 29%p → 지연 아님 / 30%p → 지연 (경계값)")
    void expectedVsActual_boundary_30pp() {
        // planned: Jan 1 ~ Jan 10 (plannedDays = 10)
        // today  : Jan 6 → elapsed = between(Jan 1, Jan 6) = 5일
        // expectedProgress = 5/10 * 100 = 50%
        //   progress=21 → 50-21=29%p < 30 → NOT delayed
        //   progress=20 → 50-20=30%p ≥ 30 → delayed
        LocalDate today = LocalDate.of(2026, 1, 6);
        LocalDate start = LocalDate.of(2026, 1, 1);
        LocalDate end   = LocalDate.of(2026, 1, 10);

        TaskCalculator.TaskProgress notDelayed = new TaskCalculator.TaskProgress(
            1L, 21, start, end, "IN_PROGRESS");
        TaskCalculator.TaskProgress delayed = new TaskCalculator.TaskProgress(
            2L, 20, start, end, "IN_PROGRESS");

        assertThat(calc.isDelayed(notDelayed, today)).isFalse();
        assertThat(calc.isDelayed(delayed, today)).isTrue();
    }

    // =========================================================================
    // calcProcessPlannedRange (보완 8)
    // =========================================================================

    @Test
    @DisplayName("공정 계획 기간 = 하위 Task 최소 시작 ~ 최대 종료")
    void processPlannedRange_minStart_maxEnd() {
        List<TaskCalculator.TaskProgress> subtasks = List.of(
            new TaskCalculator.TaskProgress(1L, 0,
                LocalDate.of(2026, 2, 1), LocalDate.of(2026, 3, 31), "PENDING"),
            new TaskCalculator.TaskProgress(2L, 0,
                LocalDate.of(2026, 1, 1), LocalDate.of(2026, 4, 30), "PENDING")
        );
        Optional<TaskCalculator.DateRange> range = calc.calcProcessPlannedRange(subtasks);
        assertThat(range).isPresent();
        assertThat(range.get().start()).isEqualTo(LocalDate.of(2026, 1, 1));
        assertThat(range.get().end()).isEqualTo(LocalDate.of(2026, 4, 30));
    }

    @Test
    @DisplayName("날짜가 없는 Task만 있으면 범위 empty")
    void processPlannedRange_allNullDates_empty() {
        List<TaskCalculator.TaskProgress> subtasks = List.of(
            new TaskCalculator.TaskProgress(1L, 0, null, null, "PENDING")
        );
        assertThat(calc.calcProcessPlannedRange(subtasks)).isEmpty();
    }
}
