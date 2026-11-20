package com.example.projtrack.wbs;

import com.example.projtrack.auth.ProjectAccessChecker;
import com.example.projtrack.history.HistoryRecorder;
import com.example.projtrack.project.repository.ProjectRepository;
import com.example.projtrack.wbs.domain.Milestone;
import com.example.projtrack.wbs.repository.MilestoneRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.List;
import java.util.Map;
import java.util.NoSuchElementException;
import java.util.Objects;

@Service
@Transactional(readOnly = true)
@RequiredArgsConstructor
public class MilestoneService {

    private final MilestoneRepository milestoneRepo;
    private final ProjectRepository projectRepo;
    private final HistoryRecorder recorder;
    private final ProjectAccessChecker accessChecker;

    // -------------------------------------------------------------------------

    public List<Milestone> list(Long projectId) {
        accessChecker.checkRead(projectId);
        return milestoneRepo.findByProjectProjectIdOrderByPlannedDateAsc(projectId);
    }

    @Transactional
    public Milestone create(Long projectId, String name, String type, LocalDate plannedDate) {
        accessChecker.checkWrite(projectId);
        Milestone m = new Milestone();
        m.setProject(projectRepo.getReferenceById(projectId));
        m.setName(name);
        m.setType(type);
        m.setPlannedDate(plannedDate);
        return milestoneRepo.save(m);
    }

    /**
     * 마일스톤 수정.
     * plannedDate가 변경될 때만 사유를 필수로 받고 SCHEDULE_CHANGED 이벤트를 기록한다.
     */
    @Transactional
    public Milestone update(Long projectId, Long milestoneId,
                            String name, String type, LocalDate plannedDate,
                            LocalDate actualDate, String status, String reason) {
        accessChecker.checkWrite(projectId);
        Milestone m = load(projectId, milestoneId);

        boolean dateChanged = plannedDate != null
            && !Objects.equals(m.getPlannedDate(), plannedDate);
        if (dateChanged && (reason == null || reason.isBlank())) {
            throw new IllegalArgumentException("마일스톤 날짜 변경에는 사유가 필요합니다.");
        }

        LocalDate oldDate = m.getPlannedDate();
        if (name != null)        m.setName(name);
        if (type != null)        m.setType(type);
        if (plannedDate != null) m.setPlannedDate(plannedDate);
        if (actualDate != null)  m.setActualDate(actualDate);
        if (status != null)      m.setStatus(status);
        milestoneRepo.save(m);

        if (dateChanged) {
            recorder.record(projectId, "SCHEDULE_CHANGED",
                m.getName() + " 마일스톤 날짜 변경",
                Map.of("plannedDate", oldDate.toString()),
                Map.of("plannedDate", plannedDate.toString()),
                reason, "MILESTONE", milestoneId);
        }
        return m;
    }

    /** 마일스톤 삭제. 사유 필수, MILESTONE_DELETED 이벤트 기록 (보완 5). */
    @Transactional
    public void delete(Long projectId, Long milestoneId, String reason) {
        if (reason == null || reason.isBlank()) {
            throw new IllegalArgumentException("마일스톤 삭제에는 사유가 필요합니다.");
        }
        accessChecker.checkWrite(projectId);
        Milestone m = load(projectId, milestoneId);
        milestoneRepo.delete(m);
        recorder.record(projectId, "MILESTONE_DELETED",
            m.getName() + " 마일스톤 삭제",
            Map.of("name", m.getName(), "milestoneId", milestoneId), null,
            reason, "MILESTONE", milestoneId);
    }

    // -------------------------------------------------------------------------

    private Milestone load(Long projectId, Long milestoneId) {
        return milestoneRepo.findById(milestoneId)
            .filter(ms -> ms.getProject().getProjectId().equals(projectId))
            .orElseThrow(() -> new NoSuchElementException("Milestone not found: " + milestoneId));
    }
}
