package com.example.projtrack.wbs;

import com.example.projtrack.project.domain.Project;
import com.example.projtrack.wbs.controller.MilestoneController;
import com.example.projtrack.wbs.domain.Milestone;
import com.example.projtrack.wbs.dto.DeleteRequest;
import com.example.projtrack.wbs.dto.MilestoneRequest;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.webmvc.test.autoconfigure.WebMvcTest;
import org.springframework.boot.test.context.TestConfiguration;
import org.springframework.context.annotation.Bean;
import org.springframework.http.MediaType;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import tools.jackson.databind.ObjectMapper;

import java.time.Clock;
import java.time.LocalDate;
import java.time.ZoneId;
import java.util.List;

import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.when;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.csrf;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@WebMvcTest(MilestoneController.class)
@WithMockUser
class MilestoneControllerTest {

    @Autowired MockMvc mockMvc;
    @Autowired ObjectMapper objectMapper;
    @MockitoBean MilestoneService milestoneService;

    @TestConfiguration
    static class TestConfig {
        @Bean
        Clock clock() {
            return Clock.fixed(
                LocalDate.of(2026, 11, 19).atStartOfDay(ZoneId.of("Asia/Seoul")).toInstant(),
                ZoneId.of("Asia/Seoul"));
        }
    }

    // -------------------------------------------------------------------------

    @Test
    @DisplayName("GET /milestones → 200, 목록 반환")
    void listMilestones_returns200() throws Exception {
        Milestone m = milestone(1L, 1L, "1차 중간 보고", LocalDate.of(2027, 3, 1));
        when(milestoneService.list(1L)).thenReturn(List.of(m));

        mockMvc.perform(get("/api/v1/projects/1/milestones"))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$[0].milestoneId").value(1))
            .andExpect(jsonPath("$[0].name").value("1차 중간 보고"))
            .andExpect(jsonPath("$[0].dDay").value(102));  // 2026-11-19 → 2027-03-01 = 102일
    }

    @Test
    @DisplayName("POST /milestones → 201, 마일스톤 생성")
    void createMilestone_returns201() throws Exception {
        LocalDate planned = LocalDate.of(2027, 6, 1);
        Milestone m = milestone(2L, 1L, "최종 보고", planned);
        when(milestoneService.create(eq(1L), eq("최종 보고"), isNull(), eq(planned))).thenReturn(m);

        var req = new MilestoneRequest("최종 보고", null, planned, null, null, null);
        mockMvc.perform(post("/api/v1/projects/1/milestones")
                .with(csrf())
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(req)))
            .andExpect(status().isCreated())
            .andExpect(jsonPath("$.milestoneId").value(2))
            .andExpect(jsonPath("$.name").value("최종 보고"))
            .andExpect(jsonPath("$.status").value("PENDING"));
    }

    @Test
    @DisplayName("DELETE with blank reason → 400 (Bean Validation)")
    void deleteMilestone_blankReason_returns400() throws Exception {
        var req = new DeleteRequest("");

        mockMvc.perform(delete("/api/v1/projects/1/milestones/1")
                .with(csrf())
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(req)))
            .andExpect(status().isBadRequest());
    }

    // -------------------------------------------------------------------------

    private Milestone milestone(Long id, Long projectId, String name, LocalDate plannedDate) {
        Milestone m = new Milestone();
        m.setMilestoneId(id);
        Project p = new Project();
        p.setProjectId(projectId);
        m.setProject(p);
        m.setName(name);
        m.setPlannedDate(plannedDate);
        m.setStatus("PENDING");
        return m;
    }
}
