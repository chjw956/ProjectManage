package com.example.projtrack.project.domain;

import com.example.projtrack.common.AuditableEntity;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDate;

@Entity
@Table(name = "project")
@Getter
@Setter
@NoArgsConstructor
public class Project extends AuditableEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "project_id")
    private Long projectId;

    @Column(nullable = false)
    private String name;

    @Column(nullable = false)
    private String type;                    // INTERNAL, GOV

    private String phase;

    @Column(nullable = false)
    private String status = "NORMAL";       // NORMAL, CAUTION, DANGER, CLOSED

    @Column(name = "start_date")
    private LocalDate startDate;

    @Column(name = "end_date")
    private LocalDate endDate;

    private String summary;

    @Column(name = "security_level", nullable = false)
    private String securityLevel = "NORMAL"; // NORMAL, CONFIDENTIAL, SECRET
}
