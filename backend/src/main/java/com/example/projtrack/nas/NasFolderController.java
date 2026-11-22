package com.example.projtrack.nas;

import com.example.projtrack.nas.dto.CreateFolderRequest;
import com.example.projtrack.nas.dto.ProjectFolderResponse;
import com.example.projtrack.nas.dto.UpdateFolderRequest;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@Tag(name = "NasFolder", description = "사업별 NAS 폴더 등록·관리 API")
@RestController
@RequestMapping("/api/v1/projects/{projectId}/folders")
@RequiredArgsConstructor
public class NasFolderController {

    private final NasService nasService;

    @Operation(summary = "등록 폴더 목록 조회")
    @GetMapping
    public List<ProjectFolderResponse> listFolders(@PathVariable Long projectId) {
        return nasService.listFolders(projectId);
    }

    @Operation(summary = "폴더 등록")
    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public ProjectFolderResponse createFolder(@PathVariable Long projectId,
                                               @RequestBody @Valid CreateFolderRequest req) {
        return nasService.createFolder(projectId, req.label(), req.nasPath(), req.description());
    }

    @Operation(summary = "폴더 수정")
    @PutMapping("/{folderId}")
    public ProjectFolderResponse updateFolder(@PathVariable Long projectId,
                                               @PathVariable Long folderId,
                                               @RequestBody @Valid UpdateFolderRequest req) {
        return nasService.updateFolder(projectId, folderId,
            req.label(), req.nasPath(), req.description(), req.sortOrder());
    }

    @Operation(summary = "폴더 등록 삭제 (NAS 파일은 삭제하지 않음)")
    @DeleteMapping("/{folderId}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void deleteFolder(@PathVariable Long projectId,
                              @PathVariable Long folderId) {
        nasService.deleteFolder(projectId, folderId);
    }
}
