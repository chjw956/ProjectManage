package com.example.projtrack.wbs.domain;

import com.example.projtrack.common.AuditableEntity;
import com.example.projtrack.project.domain.Project;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDate;

@Entity
@Table(name = "milestone")
@Getter
@Setter
@NoArgsConstructor
public class Milestone extends AuditableEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "milestone_id")
    private Long milestoneId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "project_id", nullable = false)
    private Project project;

    @Column(nullable = false)
    private String name;

    private String type;

    @Column(name = "planned_date", nullable = false)
    private LocalDate plannedDate;

    @Column(name = "actual_date")
    private LocalDate actualDate;

    @Column(nullable = false)
    private String status = "PENDING";  // PENDING, IN_PROGRESS, DONE, DELAYED
}
