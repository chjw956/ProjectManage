package com.example.projtrack.project.domain;

import com.example.projtrack.common.AuditableEntity;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDate;

@Entity
@Table(name = "project_member")
@Getter
@Setter
@NoArgsConstructor
public class ProjectMember extends AuditableEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "member_id")
    private Long memberId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "project_id", nullable = false)
    private Project project;

    /** app_user.user_id FK — AppUser 엔티티는 auth 슬라이스에서 추가 */
    @Column(name = "user_id", nullable = false)
    private Long userId;

    @Column(nullable = false)
    private String role;                // PM, MEMBER, APPROVER, EXTERNAL

    @Column(name = "joined_at", nullable = false)
    private LocalDate joinedAt;

    @Column(name = "left_at")
    private LocalDate leftAt;
}
