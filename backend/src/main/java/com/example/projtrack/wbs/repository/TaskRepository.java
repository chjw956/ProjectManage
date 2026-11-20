package com.example.projtrack.wbs.repository;

import com.example.projtrack.wbs.domain.Task;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface TaskRepository extends JpaRepository<Task, Long> {

    /** 사업의 모든 공정·Task를 sort_order 순으로 조회 */
    List<Task> findByProjectProjectIdOrderBySortOrderAsc(Long projectId);

    /** 사업의 최상위 공정만(parent = null) sort_order 순으로 조회 */
    List<Task> findByProjectProjectIdAndParentIsNullOrderBySortOrderAsc(Long projectId);

    /** 특정 공정의 세부 Task를 sort_order 순으로 조회 */
    List<Task> findByParentTaskIdOrderBySortOrderAsc(Long parentTaskId);

    /** 같은 공정(parent) 하위에서 현재 최대 sort_order 조회 — reorder 시 순서 부여에 사용 */
    int countByProjectProjectIdAndParentIsNull(Long projectId);

    int countByParentTaskId(Long parentTaskId);

    /** 최상위 공정 중 최대 sort_order. 사업에 공정이 없으면 0 반환 */
    @Query("SELECT COALESCE(MAX(t.sortOrder), 0) FROM Task t " +
           "WHERE t.project.projectId = :projectId AND t.parent IS NULL")
    int findMaxSortOrderForProcesses(@Param("projectId") Long projectId);

    /** 특정 공정의 세부 Task 중 최대 sort_order. 세부 Task가 없으면 0 반환 */
    @Query("SELECT COALESCE(MAX(t.sortOrder), 0) FROM Task t " +
           "WHERE t.parent.taskId = :parentId")
    int findMaxSortOrderForSubtasks(@Param("parentId") Long parentId);
}
