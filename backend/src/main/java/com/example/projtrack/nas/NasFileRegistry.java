package com.example.projtrack.nas;

import org.springframework.stereotype.Component;

import java.nio.file.Path;
import java.util.UUID;
import java.util.concurrent.ConcurrentHashMap;

/**
 * UUID ↔ NAS Path 매핑 레지스트리.
 * 브라우저 / OnlyOffice 모두 UUID 키로 파일에 접근한다.
 * 서버 재시작 시 초기화되므로 세션 범위의 휘발성 캐시로 사용한다.
 */
@Component
public class NasFileRegistry {

    private final ConcurrentHashMap<String, Path> registry = new ConcurrentHashMap<>();

    /** Path를 등록하고 UUID 키를 반환한다. */
    public String register(Path path) {
        String key = UUID.randomUUID().toString();
        registry.put(key, path);
        return key;
    }

    /** UUID 키로 Path를 조회한다. 없으면 null을 반환한다. */
    public Path resolve(String key) {
        return registry.get(key);
    }
}
