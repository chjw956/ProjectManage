package com.example.projtrack.common;

import org.springframework.data.domain.AuditorAware;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;

import java.util.Optional;

/**
 * JPA 감사 필드(@CreatedBy, @LastModifiedBy)에 현재 사용자명을 제공.
 *
 * <ul>
 *   <li>인증된 사용자가 있으면 해당 username을 반환</li>
 *   <li>없으면(배치·마이그레이션 등) "system" 반환</li>
 *   <li>local 프로필에서는 SecurityConfig의 필터가 "dev-user"를 SecurityContext에 주입</li>
 * </ul>
 */
@Component("auditorAware")
public class AuditorAwareImpl implements AuditorAware<String> {

    @Override
    public Optional<String> getCurrentAuditor() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth != null && auth.isAuthenticated()
                && !"anonymousUser".equals(auth.getPrincipal())) {
            return Optional.of(auth.getName());
        }
        return Optional.of("system");
    }
}
