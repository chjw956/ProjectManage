package com.example.projtrack.auth;

import org.springframework.stereotype.Component;

/**
 * 사업 단위 접근 권한 확인.
 * 모든 서비스 메서드 시작 시 호출한다.
 *
 * <p>Phase 1: stub — 항상 통과.
 * Phase 2에서 project_member 테이블 조회로 교체 예정.</p>
 */
@Component
public class ProjectAccessChecker {

    /**
     * 사업 조회 권한 확인.
     * 권한 없으면 AccessDeniedException을 던진다.
     */
    public void checkRead(Long projectId) {
        // TODO: project_member에서 현재 사용자 참여 여부 확인
        // 보안등급 CONFIDENTIAL/SECRET 사업은 참여자만 허용
    }

    /**
     * 사업 쓰기 권한 확인 (PM 또는 MEMBER 역할).
     * 권한 없으면 AccessDeniedException을 던진다.
     */
    public void checkWrite(Long projectId) {
        // TODO: PM 또는 MEMBER 역할인지 확인
    }
}
