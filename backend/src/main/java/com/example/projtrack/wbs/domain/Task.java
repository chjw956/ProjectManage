package com.example.projtrack.wbs.domain;

import com.example.projtrack.common.AuditableEntity;
import com.example.projtrack.project.domain.Project;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

import java.math.BigDecimal;
import java.time.LocalDate;

/**
 * WBS 항목 (공정 + 세부 Task).
 * parent == null → 공정, parent != null → 세부 Task
 */
@Entity
@Table(name = "task")
@Getter
@Setter
@NoArgsConstructor
public class Task extends AuditableEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "task_id")
    private Long taskId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "project_id", nullable = false)
    private Project project;

    /** 공정 자기참조. null이면 최상위 공정 */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "parent_id")
    private Task parent;

    @Column(nullable = false)
    private String name;

    private String dept;

    private String assignee;

    @Column(name = "planned_start")
    private LocalDate plannedStart;

    @Column(name = "planned_end")
    private LocalDate plannedEnd;

    @Column(name = "actual_start")
    private LocalDate actualStart;

    @Column(name = "actual_end")
    private LocalDate actualEnd;

    @Column(nullable = false)
    private String status = "PENDING";  // PENDING, IN_PROGRESS, DONE, DELAYED

    @JdbcTypeCode(SqlTypes.SMALLINT)
    @Column(nullable = false)
    private int progress = 0;           // 0~100

    @Column(name = "sort_order", nullable = false)
    private int sortOrder = 0;

    /**
     * 공사 여부 플래그.
     * Lombok @Getter가 boolean 필드 'work'에 대해 isWork() 생성.
     * @Column(name="is_work")으로 DB 컬럼과 매핑.
     */
    @Column(name = "is_work", nullable = false)
    private boolean work = false;

    private BigDecimal amount;
}
