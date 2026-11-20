package com.example.projtrack.project.repository;

import com.example.projtrack.project.domain.ProjectMember;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface ProjectMemberRepository extends JpaRepository<ProjectMember, Long> {

    List<ProjectMember> findByProjectProjectId(Long projectId);

    boolean existsByProjectProjectIdAndUserId(Long projectId, Long userId);
}
