package com.example.projtrack.history.repository;

import com.example.projtrack.history.domain.Issue;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface IssueRepository extends JpaRepository<Issue, Long> {

    /** 열린 이슈 목록 (CLOSED 제외) — 사업 홈 요약·상태 판정에 사용 */
    List<Issue> findByProjectProjectIdAndStatusNot(Long projectId, String status);

    long countByProjectProjectIdAndStatusNot(Long projectId, String status);
}
