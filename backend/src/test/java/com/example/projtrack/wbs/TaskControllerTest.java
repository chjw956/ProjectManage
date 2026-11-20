package com.example.projtrack.wbs;

import com.example.projtrack.project.domain.Project;
import com.example.projtrack.wbs.controller.TaskController;
import com.example.projtrack.wbs.domain.Task;
import com.example.projtrack.wbs.dto.ChangeScheduleRequest;
import com.example.projtrack.wbs.dto.ChangeStatusRequest;
import com.example.projtrack.wbs.dto.CreateTaskRequest;
import com.example.projtrack.wbs.dto.DeleteRequest;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.webmvc.test.autoconfigure.WebMvcTest;
import org.springframework.boot.test.context.TestConfiguration;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Import;
import org.springframework.http.MediaType;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import tools.jackson.databind.ObjectMapper;

import java.time.Clock;
import java.time.LocalDate;
import java.time.ZoneId;

import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.when;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.csrf;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@WebMvcTest(TaskController.class)
@Import(TaskCalculator.class)
@WithMockUser
class TaskControllerTest {

    @Autowired MockMvc mockMvc;
    @Autowired ObjectMapper objectMapper;
    @MockitoBean TaskService taskService;

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
    @DisplayName("POST /processes → 201, 공정 생성")
    void createProcess_returns201() throws Exception {
        Task t = task(1L, 1L, "공정A");
        when(taskService.createProcess(eq(1L), eq("공정A"), any(), any(), any(), any()))
            .thenReturn(t);

        var req = new CreateTaskRequest("공정A", null, null, null, null);
        mockMvc.perform(post("/api/v1/projects/1/tasks/processes")
                .with(csrf())
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(req)))
            .andExpect(status().isCreated())
            .andExpect(jsonPath("$.taskId").value(1))
            .andExpect(jsonPath("$.name").value("공정A"))
            .andExpect(jsonPath("$.status").value("PENDING"));
    }

    @Test
    @DisplayName("PATCH /schedule with blank reason → 400 (Bean Validation)")
    void changeSchedule_blankReason_returns400() throws Exception {
        var req = new ChangeScheduleRequest(
            LocalDate.of(2026, 2, 1), LocalDate.of(2026, 2, 28), "");

        mockMvc.perform(patch("/api/v1/projects/1/tasks/1/schedule")
                .with(csrf())
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(req)))
            .andExpect(status().isBadRequest());
    }

    @Test
    @DisplayName("PATCH /status (IN_PROGRESS, reason=null) → 400 (서비스 IllegalArgumentException)")
    void changeStatus_nonDone_noReason_returns400() throws Exception {
        when(taskService.changeStatus(eq(1L), eq(1L), eq("IN_PROGRESS"), isNull()))
            .thenThrow(new IllegalArgumentException("상태 변경에는 사유가 필요합니다 (DONE 제외)."));

        var req = new ChangeStatusRequest("IN_PROGRESS", null);
        mockMvc.perform(patch("/api/v1/projects/1/tasks/1/status")
                .with(csrf())
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(req)))
            .andExpect(status().isBadRequest());
    }

    @Test
    @DisplayName("DELETE with blank reason → 400 (Bean Validation)")
    void deleteTask_blankReason_returns400() throws Exception {
        var req = new DeleteRequest("");

        mockMvc.perform(delete("/api/v1/projects/1/tasks/1")
                .with(csrf())
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(req)))
            .andExpect(status().isBadRequest());
    }

    // -------------------------------------------------------------------------

    private Task task(Long taskId, Long projectId, String name) {
        Task t = new Task();
        t.setTaskId(taskId);
        Project p = new Project();
        p.setProjectId(projectId);
        t.setProject(p);
        t.setName(name);
        t.setStatus("PENDING");
        t.setProgress(0);
        t.setSortOrder(1);
        return t;
    }
}
