package com.example.projtrack.nas;

import com.example.projtrack.nas.dto.CreateFileRequest;
import com.example.projtrack.nas.dto.NasFileInfo;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.io.IOException;
import java.io.OutputStream;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.List;
import java.util.Map;

@Tag(name = "NasFile", description = "NAS 파일 목록·스트리밍 API")
@RestController
@RequiredArgsConstructor
public class NasFileController {

    private final NasService nasService;
    private final NasFileRegistry registry;

    // -------------------------------------------------------------------------
    // 파일 목록
    // -------------------------------------------------------------------------

    @Operation(summary = "폴더 내 NAS 파일 목록 (fileKey UUID 발급)")
    @GetMapping("/api/v1/projects/{projectId}/folders/{folderId}/files")
    public List<NasFileInfo> listFiles(@PathVariable Long projectId,
                                       @PathVariable Long folderId) {
        return nasService.listFiles(projectId, folderId);
    }

    // -------------------------------------------------------------------------
    // 신규 파일 생성
    // -------------------------------------------------------------------------

    @Operation(summary = "신규 빈 파일 생성 → fileKey 반환")
    @PostMapping("/api/v1/projects/{projectId}/folders/{folderId}/files")
    @ResponseStatus(HttpStatus.CREATED)
    public Map<String, String> createFile(@PathVariable Long projectId,
                                           @PathVariable Long folderId,
                                           @RequestBody @Valid CreateFileRequest req) {
        String fileKey = nasService.createNewFile(projectId, folderId, req.name(), req.type());
        return Map.of("fileKey", fileKey);
    }

    // -------------------------------------------------------------------------
    // 파일 스트리밍 (브라우저 미리보기 + OnlyOffice 다운로드 공용)
    // -------------------------------------------------------------------------

    @Operation(summary = "파일 스트리밍 (key=UUID)")
    @GetMapping("/api/files/stream")
    public void streamFile(@RequestParam String key, HttpServletResponse response) throws IOException {
        Path path = registry.resolve(key);
        if (path == null || !Files.exists(path)) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "File not found for key: " + key);
        }

        String filename = path.getFileName().toString();
        String ext = filename.contains(".")
            ? filename.substring(filename.lastIndexOf('.') + 1).toLowerCase()
            : "";

        String contentType = resolveContentType(ext);
        response.setContentType(contentType);

        // 인라인 표시(PDF/이미지)와 다운로드 구분
        String disposition = "pdf".equals(ext) ? "inline" : "attachment";
        String encodedName = URLEncoder.encode(filename, StandardCharsets.UTF_8).replace("+", "%20");
        response.setHeader(HttpHeaders.CONTENT_DISPOSITION, disposition + "; filename*=UTF-8''" + encodedName);
        response.setContentLengthLong(Files.size(path));

        try (OutputStream out = response.getOutputStream()) {
            Files.copy(path, out);
        }
    }

    // -------------------------------------------------------------------------
    // 유틸
    // -------------------------------------------------------------------------

    private String resolveContentType(String ext) {
        return switch (ext) {
            case "pdf"  -> MediaType.APPLICATION_PDF_VALUE;
            case "xlsx" -> "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";
            case "xls"  -> "application/vnd.ms-excel";
            case "docx" -> "application/vnd.openxmlformats-officedocument.wordprocessingml.document";
            case "doc"  -> "application/msword";
            case "hwp"  -> "application/x-hwp";
            case "hwpx" -> "application/x-hwpx";
            case "png"  -> MediaType.IMAGE_PNG_VALUE;
            case "jpg", "jpeg" -> MediaType.IMAGE_JPEG_VALUE;
            default     -> MediaType.APPLICATION_OCTET_STREAM_VALUE;
        };
    }
}
