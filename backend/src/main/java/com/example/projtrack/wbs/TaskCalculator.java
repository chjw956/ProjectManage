package com.example.projtrack.wbs;

import org.springframework.stereotype.Component;

import java.time.LocalDate;
import java.time.temporal.ChronoUnit;
import java.util.List;
import java.util.Optional;

/**
 * WBS 계산 로직 (순수 함수, DB 접근 없음).
 * calc-rules 스킬 §1·§2 구현.
 */
@Component
public class TaskCalculator {

    // -------------------------------------------------------------------------
    // Input records
    // -------------------------------------------------------------------------

    public record TaskProgress(
        Long taskId,
        int progress,               // 0~100
        LocalDate plannedStart,     // nullable
        LocalDate plannedEnd,       // nullable
        String status               // PENDING, IN_PROGRESS, DONE, DELAYED
    ) {}

    public record ProcessProgress(
        int progress,
        LocalDate plannedStart,     // nullable
        LocalDate plannedEnd        // nullable
    ) {}

    public record DateRange(LocalDate start, LocalDate end) {}

    // -------------------------------------------------------------------------
    // 진척률 계산
    // -------------------------------------------------------------------------

    /**
     * 공정 진척률 = 하위 Task 진행률을 계획 기간(일수)으로 가중 평균.
     * - 하위 Task 없으면 0
     * - 계획 기간 0일인 Task → 가중치 1일
     * - 반올림은 마지막에 한 번만
     */
    public int calcProcessProgress(List<TaskProgress> subtasks) {
        if (subtasks == null || subtasks.isEmpty()) return 0;

        long totalWeight = 0;
        long weightedSum = 0;
        for (TaskProgress t : subtasks) {
            long weight = plannedDays(t.plannedStart(), t.plannedEnd());
            totalWeight += weight;
            weightedSum += (long) t.progress() * weight;
        }
        if (totalWeight == 0) return 0;
        return (int) Math.round((double) weightedSum / totalWeight);
    }

    /**
     * 사업 진척률 = 공정 진척률을 공정 계획 기간으로 가중 평균.
     */
    public int calcProjectProgress(List<ProcessProgress> processes) {
        if (processes == null || processes.isEmpty()) return 0;

        long totalWeight = 0;
        long weightedSum = 0;
        for (ProcessProgress p : processes) {
            long weight = plannedDays(p.plannedStart(), p.plannedEnd());
            totalWeight += weight;
            weightedSum += (long) p.progress() * weight;
        }
        if (totalWeight == 0) return 0;
        return (int) Math.round((double) weightedSum / totalWeight);
    }

    // -------------------------------------------------------------------------
    // 지연 판정
    // -------------------------------------------------------------------------

    /**
     * Task 지연 판정 (calc-rules 스킬 §2).
     * <ol>
     *   <li>완료(DONE) 상태면 항상 false</li>
     *   <li>오늘 &gt; 계획 종료일</li>
     *   <li>기대 진행률 − 실제 진행률 ≥ 30%p</li>
     * </ol>
     */
    public boolean isDelayed(TaskProgress task, LocalDate today) {
        if ("DONE".equals(task.status())) return false;
        if (task.plannedEnd() == null) return false;

        if (today.isAfter(task.plannedEnd())) return true;

        if (task.plannedStart() != null) {
            long totalDays = plannedDays(task.plannedStart(), task.plannedEnd());
            long elapsed = ChronoUnit.DAYS.between(task.plannedStart(), today);
            if (elapsed < 0) return false;  // 아직 시작 전

            double expectedProgress = Math.min(100.0, (double) elapsed / totalDays * 100);
            if (expectedProgress - task.progress() >= 30.0) return true;
        }
        return false;
    }

    // -------------------------------------------------------------------------
    // 공정 행 집계 (보완 8: 간트 공정 막대)
    // -------------------------------------------------------------------------

    /**
     * 공정의 계획 기간 = min(subtask.plannedStart) ~ max(subtask.plannedEnd).
     * 날짜가 없는 Task는 범위 계산에서 제외.
     */
    public Optional<DateRange> calcProcessPlannedRange(List<TaskProgress> subtasks) {
        if (subtasks == null || subtasks.isEmpty()) return Optional.empty();

        LocalDate minStart = null;
        LocalDate maxEnd = null;
        for (TaskProgress t : subtasks) {
            if (t.plannedStart() != null
                    && (minStart == null || t.plannedStart().isBefore(minStart))) {
                minStart = t.plannedStart();
            }
            if (t.plannedEnd() != null
                    && (maxEnd == null || t.plannedEnd().isAfter(maxEnd))) {
                maxEnd = t.plannedEnd();
            }
        }
        if (minStart == null || maxEnd == null) return Optional.empty();
        return Optional.of(new DateRange(minStart, maxEnd));
    }

    // -------------------------------------------------------------------------
    // 내부 유틸
    // -------------------------------------------------------------------------

    /** 계획 기간(일수). start·end 중 하나라도 null이거나 기간이 0 이하면 1을 반환 */
    private long plannedDays(LocalDate start, LocalDate end) {
        if (start == null || end == null) return 1L;
        long days = ChronoUnit.DAYS.between(start, end) + 1;  // 양 끝 포함
        return days <= 0 ? 1L : days;
    }
}
