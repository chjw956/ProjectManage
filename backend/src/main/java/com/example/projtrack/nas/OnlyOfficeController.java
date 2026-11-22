package com.example.projtrack.nas;

import com.example.projtrack.nas.dto.OnlyOfficeConfigResponse;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.client.RestClient;
import org.springframework.web.server.ResponseStatusException;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.StandardCopyOption;
import java.util.Map;

@Tag(name = "OnlyOffice", description = "OnlyOffice 에디터 설정 및 저장 콜백 API")
@RestController
@RequestMapping("/api/v1/onlyoffice")
@RequiredArgsConstructor
public class OnlyOfficeController {

    private final NasFileRegistry registry;
    private final OnlyOfficeProperties ooProps;
    private final NasService nasService;

    // -------------------------------------------------------------------------
    // 에디터 설정 JSON 반환
    // -------------------------------------------------------------------------

    @Operation(summary = "OnlyOffice 에디터 설정 반환 (key=UUID, mode=view|edit)")
    @GetMapping("/config")
    public OnlyOfficeConfigResponse getConfig(@RequestParam String key,
                                               @RequestParam(defaultValue = "view") String mode) {
        Path path = registry.resolve(key);
        if (path == null) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "File key not found: " + key);
        }

        String filename = path.getFileName().toString();
        String ext = filename.contains(".")
            ? filename.substring(filename.lastIndexOf('.') + 1).toLowerCase()
            : "";

        String documentType = resolveDocumentType(ext);
        String callbackHost = ooProps.callbackHost();

        // OnlyOffice 컨테이너 → 백엔드 호출 경로
        String documentUrl = callbackHost + "/api/files/stream?key=" + key;
        String callbackUrl = callbackHost + "/api/v1/onlyoffice/callback?key=" + key;

        return new OnlyOfficeConfigResponse(
            documentType,
            new OnlyOfficeConfigResponse.Document(ext, key, documentUrl, filename),
            new OnlyOfficeConfigResponse.EditorConfig(mode, callbackUrl)
        );
    }

    // -------------------------------------------------------------------------
    // 저장 콜백 (status=2: 저장 완료, OnlyOffice가 호출)
    // -------------------------------------------------------------------------

    @Operation(operationId = "onlyOfficeCallback", summary = "OnlyOffice 저장 콜백 — NAS 파일 덮어쓰기")
    @PostMapping("/callback")
    public Map<String, Integer> callback(@RequestParam String key,
                                          @RequestBody OnlyOfficeCallbackPayload payload) {
        // status=2: 문서가 닫히고 최종 버전이 저장 준비된 상태
        if (payload.status() != null && payload.status() == 2 && payload.url() != null) {
            Path target = registry.resolve(key);
            if (target == null) {
                return Map.of("error", 1);
            }
            nasService.validatePath(target.toString());

            byte[] bytes = RestClient.create().get()
                .uri(payload.url())
                .retrieve()
                .body(byte[].class);

            if (bytes != null) {
                try {
                    Files.write(target, bytes, java.nio.file.StandardOpenOption.CREATE,
                        java.nio.file.StandardOpenOption.TRUNCATE_EXISTING);
                } catch (IOException e) {
                    return Map.of("error", 1);
                }
            }
        }
        // OnlyOffice 필수 응답: {"error": 0}
        return Map.of("error", 0);
    }

    // -------------------------------------------------------------------------
    // 유틸
    // -------------------------------------------------------------------------

    private String resolveDocumentType(String ext) {
        return switch (ext) {
            case "xlsx", "xls", "csv", "ods" -> "cell";
            case "docx", "doc", "odt", "rtf", "txt" -> "word";
            case "pptx", "ppt", "odp" -> "slide";
            case "pdf" -> "pdf";
            default -> "word";
        };
    }

    /** OnlyOffice 콜백 페이로드 (최소 필드). */
    public record OnlyOfficeCallbackPayload(
        Integer status,
        String url
    ) {}
}
