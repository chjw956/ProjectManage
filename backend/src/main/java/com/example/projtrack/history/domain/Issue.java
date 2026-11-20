package com.example.projtrack.history.domain;

import com.example.projtrack.common.AuditableEntity;
import com.example.projtrack.project.domain.Project;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDate;

/**
 * 이슈·리스크 레지스터 (설계서 4.5).
 * 이슈 CRUD는 history 슬라이스에서 구현하고, 지금은 엔티티·리포지토리만 추가한다.
 * ProjectStatusCalculator가 사업 상태 판정 시 열린 이슈를 조회하는 데 사용된다.
 */
@Entity
@Table(name = "issue")
@Getter
@Setter
@NoArgsConstructor
public class Issue extends AuditableEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "issue_id")
    private Long issueId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "project_id", nullable = false)
    private Project project;

    @Column(nullable = false)
    private String title;

    @Column(nullable = false)
    private String grade;               // HIGH, MID, LOW

    private String assignee;

    @Column(name = "occurred_at", nullable = false)
    private LocalDate occurredAt;

    @Column(name = "target_date")
    private LocalDate targetDate;

    @Column(columnDefinition = "TEXT")
    private String response;

    @Column(nullable = false)
    private String status = "OPEN";     // OPEN, IN_PROGRESS, CLOSED
}
