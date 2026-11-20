package com.example.projtrack.project;

import com.example.projtrack.project.controller.ProjectController;
import com.example.projtrack.project.domain.Project;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.webmvc.test.autoconfigure.WebMvcTest;
import org.springframework.boot.test.context.TestConfiguration;
import org.springframework.context.annotation.Bean;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;

import java.time.Clock;
import java.time.LocalDate;
import java.time.ZoneId;
import java.util.List;
import java.util.NoSuchElementException;

import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@WebMvcTest(ProjectController.class)
@WithMockUser
class ProjectControllerTest {

    @Autowired MockMvc mockMvc;
    @MockitoBean ProjectService projectService;

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
    @DisplayName("GET /api/v1/projects → 200, 목록 반환")
    void listProjects_returns200() throws Exception {
        Project p = project(1L, "차세대 ERP 구축");
        var signal = new ProjectStatusCalculator.StatusSignal("NORMAL", List.of());
        var data = new ProjectService.ProjectSummaryData(p, 42, 0L, signal, null);
        when(projectService.listProjectSummaries()).thenReturn(List.of(data));

        mockMvc.perform(get("/api/v1/projects"))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$[0].projectId").value(1))
            .andExpect(jsonPath("$[0].name").value("차세대 ERP 구축"))
            .andExpect(jsonPath("$[0].progress").value(42))
            .andExpect(jsonPath("$[0].statusSignal.status").value("NORMAL"));
    }

    @Test
    @DisplayName("GET /api/v1/projects/{id} → 200, 사업 홈 반환")
    void getHome_returns200() throws Exception {
        Project p = project(1L, "AI 최적화");
        p.setStatus("CAUTION");
        p.setSummary("AI 기반 공정 최적화");
        var signal = new ProjectStatusCalculator.StatusSignal("CAUTION", List.of("열린 HIGH 이슈"));
        var data = new ProjectService.ProjectHomeData(p, List.of(), 1L, null, signal, 30);
        when(projectService.getHome(1L)).thenReturn(data);

        mockMvc.perform(get("/api/v1/projects/1"))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.name").value("AI 최적화"))
            .andExpect(jsonPath("$.progress").value(30))
            .andExpect(jsonPath("$.statusSignal.status").value("CAUTION"))
            .andExpect(jsonPath("$.openIssueCount").value(1));
    }

    @Test
    @DisplayName("GET /api/v1/projects/999 → 404 (존재하지 않는 사업)")
    void getHome_notFound_returns404() throws Exception {
        when(projectService.getHome(999L))
            .thenThrow(new NoSuchElementException("Project not found: 999"));

        mockMvc.perform(get("/api/v1/projects/999"))
            .andExpect(status().isNotFound());
    }

    // -------------------------------------------------------------------------

    private Project project(Long id, String name) {
        Project p = new Project();
        p.setProjectId(id);
        p.setName(name);
        p.setType("INTERNAL");
        p.setStatus("NORMAL");
        return p;
    }
}
