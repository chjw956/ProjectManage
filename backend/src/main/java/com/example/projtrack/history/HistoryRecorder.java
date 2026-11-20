package com.example.projtrack.history;

import com.example.projtrack.history.domain.TimelineEvent;
import com.example.projtrack.history.repository.TimelineEventRepository;
import com.example.projtrack.project.repository.ProjectRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import tools.jackson.databind.ObjectMapper;

import java.time.Clock;
import java.time.LocalDate;
import java.util.Objects;

/**
 * 타임라인 이벤트를 기록하는 단일 창구 (history-logging 스킬 §구현 규칙 2).
 *
 * <ul>
 *   <li>이 메서드만 timeline_event를 생성한다. 각 서비스에서 직접 만들지 않는다.</li>
 *   <li>before == after (JSON 동치) 이면 기록하지 않는다.</li>
 *   <li>항상 호출자와 같은 {@code @Transactional} 안에서 실행한다.</li>
 * </ul>
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class HistoryRecorder {

    private final TimelineEventRepository eventRepo;
    private final ProjectRepository projectRepo;
    private final ObjectMapper objectMapper;
    private final Clock clock;

    /**
     * @param projectId   소속 사업 ID
     * @param type        이벤트 유형 (SCHEDULE_CHANGED, STATUS_CHANGED, …)
     * @param summary     한 줄 요약
     * @param before      변경 전 상태 (null 허용, JSON 직렬화됨)
     * @param after       변경 후 상태 (null 허용, JSON 직렬화됨)
     * @param reason      변경 사유 (null 허용 — 필수 여부는 호출자가 사전 검증)
     * @param refType     참조 엔티티 유형 (TASK, MILESTONE, …)
     * @param refEntityId 참조 엔티티 ID
     */
    public void record(Long projectId, String type, String summary,
                       Object before, Object after,
                       String reason, String refType, Long refEntityId) {
        String beforeJson = toJson(before);
        String afterJson  = toJson(after);

        if (Objects.equals(beforeJson, afterJson)) {
            log.debug("HistoryRecorder: before == after, 이벤트 생략 (type={})", type);
            return;
        }

        TimelineEvent event = new TimelineEvent();
        event.setProject(projectRepo.getReferenceById(projectId));
        event.setEventDate(LocalDate.now(clock));
        event.setType(type);
        event.setSummary(summary);
        event.setBeforeState(beforeJson);
        event.setAfterState(afterJson);
        event.setReason(reason);
        event.setRefType(refType);
        event.setRefEntityId(refEntityId);
        event.setSource("MANUAL");
        event.setAuthor(currentUser());
        eventRepo.save(event);
    }

    // -------------------------------------------------------------------------

    private String toJson(Object obj) {
        if (obj == null) return null;
        try {
            return objectMapper.writeValueAsString(obj);
        } catch (Exception e) {
            throw new IllegalStateException("HistoryRecorder: JSON 직렬화 실패", e);
        }
    }

    private String currentUser() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth != null && auth.isAuthenticated()
                && !"anonymousUser".equals(auth.getPrincipal())) {
            return auth.getName();
        }
        return "system";
    }
}
