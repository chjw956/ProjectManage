package com.example.projtrack.common;

import jakarta.persistence.Column;
import jakarta.persistence.EntityListeners;
import jakarta.persistence.MappedSuperclass;
import lombok.Getter;
import org.springframework.data.annotation.CreatedBy;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.LastModifiedBy;
import org.springframework.data.annotation.LastModifiedDate;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

import java.time.OffsetDateTime;

/**
 * 모든 엔티티가 상속하는 감사 필드 베이스 클래스.
 *
 * <p>{@code created_by}, {@code created_at}은 최초 저장 시 자동 입력되며 이후 변경되지 않는다.
 * {@code updated_by}, {@code updated_at}은 저장·수정 시마다 갱신된다.</p>
 *
 * <p>감사자(auditor)는 {@link AuditorAwareImpl}이 SecurityContext에서 꺼낸다.
 * 시각은 {@link AppConfig#dateTimeProvider}가 Asia/Seoul Clock으로 제공한다.</p>
 */
@Getter
@MappedSuperclass
@EntityListeners(AuditingEntityListener.class)
public abstract class AuditableEntity {

    @CreatedBy
    @Column(name = "created_by", updatable = false, nullable = false)
    private String createdBy;

    @CreatedDate
    @Column(name = "created_at", updatable = false, nullable = false)
    private OffsetDateTime createdAt;

    @LastModifiedBy
    @Column(name = "updated_by", nullable = false)
    private String updatedBy;

    @LastModifiedDate
    @Column(name = "updated_at", nullable = false)
    private OffsetDateTime updatedAt;
}
