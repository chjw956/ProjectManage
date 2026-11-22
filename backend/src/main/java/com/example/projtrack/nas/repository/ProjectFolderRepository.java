package com.example.projtrack.nas.repository;

import com.example.projtrack.nas.domain.ProjectFolder;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface ProjectFolderRepository extends JpaRepository<ProjectFolder, Long> {

    List<ProjectFolder> findByProjectProjectIdOrderBySortOrderAsc(Long projectId);

    Optional<ProjectFolder> findByFolderIdAndProjectProjectId(Long folderId, Long projectId);
}
