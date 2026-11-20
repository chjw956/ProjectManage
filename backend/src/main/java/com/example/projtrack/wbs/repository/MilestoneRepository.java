package com.example.projtrack.wbs.repository;

import com.example.projtrack.wbs.domain.Milestone;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface MilestoneRepository extends JpaRepository<Milestone, Long> {

    List<Milestone> findByProjectProjectIdOrderByPlannedDateAsc(Long projectId);
}
