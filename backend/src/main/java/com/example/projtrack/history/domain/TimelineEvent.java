package com.example.projtrack.history.domain;

import com.example.projtrack.common.AuditableEntity;
import com.example.projtrack.project.domain.Project;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

import java.time.LocalDate;

@Entity
@Table(name = "timeline_event")
@Getter
@Setter
@NoArgsConstructor
public class TimelineEvent extends AuditableEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "event_id")
    private Long eventId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "project_id", nullable = false)
    private Project project;

    @Column(name = "event_date", nullable = false)
    private LocalDate eventDate;

    @Column(nullable = false)
    private String type;

    @Column(nullable = false)
    private String summary;

    /** 행위자(actor). V1의 author 컬럼이 담당 */
    private String author;

    @Column(nullable = false)
    private String source = "MANUAL";   // MANUAL, AUTO

    @JdbcTypeCode(SqlTypes.SMALLINT)
    @Column(nullable = false)
    private int importance = 0;

    // ---- V2 추가 필드 ----

    /** 변경 전 상태 (JSON 직렬화 문자열) */
    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "before_state")
    private String beforeState;

    /** 변경 후 상태 (JSON 직렬화 문자열) */
    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "after_state")
    private String afterState;

    private String reason;

    @Column(name = "ref_type")
    private String refType;             // TASK, MILESTONE, PROJECT, ...

    @Column(name = "ref_entity_id")
    private Long refEntityId;
}
