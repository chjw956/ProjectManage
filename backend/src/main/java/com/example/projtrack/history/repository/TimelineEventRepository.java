package com.example.projtrack.history.repository;

import com.example.projtrack.history.domain.TimelineEvent;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface TimelineEventRepository extends JpaRepository<TimelineEvent, Long> {

    List<TimelineEvent> findByProjectProjectIdOrderByEventDateDesc(Long projectId, Pageable pageable);

    /** 사업의 가장 최근 이벤트 날짜 조회 — 미갱신 판정에 사용 */
    Optional<TimelineEvent> findTopByProjectProjectIdOrderByEventDateDesc(Long projectId);
}
