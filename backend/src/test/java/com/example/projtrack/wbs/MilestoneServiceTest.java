package com.example.projtrack.wbs;

import com.example.projtrack.TestcontainersConfiguration;
import com.example.projtrack.project.domain.Project;
import com.example.projtrack.wbs.repository.MilestoneRepository;
import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.context.annotation.Import;
import org.springframework.transaction.annotation.Transactional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

@SpringBootTest
@Import(TestcontainersConfiguration.class)
@Transactional
class MilestoneServiceTest {

    @Autowired MilestoneService milestoneService;
    @Autowired MilestoneRepository milestoneRepo;
    @PersistenceContext EntityManager em;

    @Test
    @DisplayName("create: 계획일 없음 → IllegalArgumentException(400), DB 제약 위반(500) 대신 저장 안 됨")
    void create_withoutPlannedDate_throws() {
        Project p = new Project();
        p.setName("가상 마일스톤 테스트 사업");
        p.setType("INTERNAL");
        em.persist(p);

        assertThatThrownBy(() -> milestoneService.create(p.getProjectId(), "날짜 미정 마일스톤", "REVIEW", null))
            .isInstanceOf(IllegalArgumentException.class);
        assertThat(milestoneRepo.findByProjectProjectIdOrderByPlannedDateAsc(p.getProjectId())).isEmpty();
    }
}
