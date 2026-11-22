package com.example.projtrack.nas.domain;

import com.example.projtrack.common.AuditableEntity;
import com.example.projtrack.project.domain.Project;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Table(name = "project_folder")
@Getter
@Setter
@NoArgsConstructor
public class ProjectFolder extends AuditableEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "folder_id")
    private Long folderId;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "project_id", nullable = false)
    private Project project;

    @Column(nullable = false, length = 200)
    private String label;

    @Column(name = "nas_path", nullable = false, length = 1000)
    private String nasPath;

    @Column(columnDefinition = "TEXT")
    private String description;

    @Column(name = "sort_order", nullable = false)
    private int sortOrder = 0;
}
