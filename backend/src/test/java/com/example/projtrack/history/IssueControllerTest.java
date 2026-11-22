package com.example.projtrack.history;

import com.example.projtrack.history.controller.IssueController;
import com.example.projtrack.history.dto.IssueResponse;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.webmvc.test.autoconfigure.WebMvcTest;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;

import java.time.LocalDate;
import java.util.List;
import java.util.NoSuchElementException;

import static org.mockito.Mockito.verifyNoInteractions;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@WebMvcTest(IssueController.class)
@WithMockUser
class IssueControllerTest {

    @Autowired MockMvc mockMvc;
    @MockitoBean IssueService issueService;

    @Test
    @DisplayName("GET /issues?status=open → 200, 응답 필드")
    void listOpenIssues_returns200() throws Exception {
        when(issueService.listOpenIssues(1L)).thenReturn(List.of(new IssueResponse(
            10L, "가상 이슈", "HIGH", "OPEN", "담당자A",
            LocalDate.of(2026, 11, 1), LocalDate.of(2026, 11, 10), "대응 중", true)));

        mockMvc.perform(get("/api/v1/projects/1/issues").param("status", "open"))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$[0].issueId").value(10))
            .andExpect(jsonPath("$[0].grade").value("HIGH"))
            .andExpect(jsonPath("$[0].targetDate").value("2026-11-10"))
            .andExpect(jsonPath("$[0].overdue").value(true));
    }

    @Test
    @DisplayName("GET /issues (status 생략) → open으로 처리")
    void defaultStatusIsOpen() throws Exception {
        when(issueService.listOpenIssues(1L)).thenReturn(List.of());

        mockMvc.perform(get("/api/v1/projects/1/issues"))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$").isEmpty());
    }

    @Test
    @DisplayName("GET /issues?status=closed → 400, 서비스 호출 안 함")
    void unsupportedStatus_returns400() throws Exception {
        mockMvc.perform(get("/api/v1/projects/1/issues").param("status", "closed"))
            .andExpect(status().isBadRequest());
        verifyNoInteractions(issueService);
    }

    @Test
    @DisplayName("존재하지 않는 사업 → 404")
    void unknownProject_returns404() throws Exception {
        when(issueService.listOpenIssues(99L)).thenThrow(new NoSuchElementException("Project not found: 99"));

        mockMvc.perform(get("/api/v1/projects/99/issues"))
            .andExpect(status().isNotFound());
    }
}
