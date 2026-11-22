package com.example.projtrack.nas;

import com.example.projtrack.auth.ProjectAccessChecker;
import com.example.projtrack.nas.domain.ProjectFolder;
import com.example.projtrack.nas.dto.*;
import com.example.projtrack.nas.repository.ProjectFolderRepository;
import com.example.projtrack.project.domain.Project;
import com.example.projtrack.project.repository.ProjectRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.core.io.ClassPathResource;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.io.IOException;
import java.io.InputStream;
import java.nio.file.*;
import java.nio.file.attribute.BasicFileAttributes;
import java.time.OffsetDateTime;
import java.time.ZoneId;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.NoSuchElementException;

@Service
@RequiredArgsConstructor
public class NasService {

    private final ProjectFolderRepository folderRepo;
    private final ProjectRepository projectRepo;
    private final ProjectAccessChecker accessChecker;
    private final NasProperties nasProps;
    private final NasFileRegistry registry;

    private static final DateTimeFormatter ISO_FORMATTER =
        DateTimeFormatter.ofPattern("yyyy-MM-dd'T'HH:mm:ss");

    // -------------------------------------------------------------------------
    // 폴더 CRUD
    // -------------------------------------------------------------------------

    @Transactional(readOnly = true)
    public List<ProjectFolderResponse> listFolders(Long projectId) {
        accessChecker.checkRead(projectId);
        return folderRepo.findByProjectProjectIdOrderBySortOrderAsc(projectId)
            .stream()
            .map(this::toResponse)
            .toList();
    }

    @Transactional
    public ProjectFolderResponse createFolder(Long projectId, String label, String nasPath, String description) {
        accessChecker.checkWrite(projectId);
        validatePath(nasPath);

        Project project = projectRepo.findById(projectId)
            .orElseThrow(() -> new NoSuchElementException("Project not found: " + projectId));

        int nextOrder = folderRepo.findByProjectProjectIdOrderBySortOrderAsc(projectId).size() + 1;

        ProjectFolder folder = new ProjectFolder();
        folder.setProject(project);
        folder.setLabel(label);
        folder.setNasPath(nasPath);
        folder.setDescription(description);
        folder.setSortOrder(nextOrder);

        return toResponse(folderRepo.save(folder));
    }

    @Transactional
    public ProjectFolderResponse updateFolder(Long projectId, Long folderId,
                                               String label, String nasPath, String description, int sortOrder) {
        accessChecker.checkWrite(projectId);
        validatePath(nasPath);

        ProjectFolder folder = folderRepo.findByFolderIdAndProjectProjectId(folderId, projectId)
            .orElseThrow(() -> new NoSuchElementException("Folder not found: " + folderId));

        folder.setLabel(label);
        folder.setNasPath(nasPath);
        folder.setDescription(description);
        folder.setSortOrder(sortOrder);

        return toResponse(folderRepo.save(folder));
    }

    @Transactional
    public void deleteFolder(Long projectId, Long folderId) {
        accessChecker.checkWrite(projectId);
        ProjectFolder folder = folderRepo.findByFolderIdAndProjectProjectId(folderId, projectId)
            .orElseThrow(() -> new NoSuchElementException("Folder not found: " + folderId));
        folderRepo.delete(folder);
    }

    // -------------------------------------------------------------------------
    // 파일 목록
    // -------------------------------------------------------------------------

    @Transactional(readOnly = true)
    public List<NasFileInfo> listFiles(Long projectId, Long folderId) {
        accessChecker.checkRead(projectId);

        ProjectFolder folder = folderRepo.findByFolderIdAndProjectProjectId(folderId, projectId)
            .orElseThrow(() -> new NoSuchElementException("Folder not found: " + folderId));

        Path dir = Path.of(folder.getNasPath()).normalize();
        validatePath(dir.toString());

        if (!Files.exists(dir) || !Files.isDirectory(dir)) {
            return List.of();
        }

        try (var stream = Files.list(dir)) {
            return stream
                .filter(Files::isRegularFile)
                .sorted()
                .map(p -> {
                    String key = registry.register(p);
                    String ext = getExtension(p.getFileName().toString());
                    long size = fileSize(p);
                    String modified = fileModified(p);
                    return new NasFileInfo(p.getFileName().toString(), key, size, modified, ext);
                })
                .toList();
        } catch (IOException e) {
            throw new RuntimeException("Failed to list files: " + dir, e);
        }
    }

    // -------------------------------------------------------------------------
    // 신규 파일 생성
    // -------------------------------------------------------------------------

    @Transactional(readOnly = true)
    public String createNewFile(Long projectId, Long folderId, String name, String type) {
        accessChecker.checkWrite(projectId);

        ProjectFolder folder = folderRepo.findByFolderIdAndProjectProjectId(folderId, projectId)
            .orElseThrow(() -> new NoSuchElementException("Folder not found: " + folderId));

        Path dir = Path.of(folder.getNasPath()).normalize();
        validatePath(dir.toString());

        String filename = name.endsWith("." + type) ? name : name + "." + type;
        Path target = dir.resolve(filename);
        validatePath(target.toString());

        try {
            Files.createDirectories(dir);
            String templatePath = "templates/blank." + type;
            ClassPathResource resource = new ClassPathResource(templatePath);
            if (resource.exists()) {
                try (InputStream is = resource.getInputStream()) {
                    Files.copy(is, target, StandardCopyOption.REPLACE_EXISTING);
                }
            } else {
                Files.createFile(target);
            }
        } catch (IOException e) {
            throw new RuntimeException("Failed to create file: " + target, e);
        }

        return registry.register(target);
    }

    // -------------------------------------------------------------------------
    // 경로 보안 검증
    // -------------------------------------------------------------------------

    /**
     * 요청 경로가 허용된 루트 중 하나의 하위 경로인지 검증한다.
     * traversal 공격(../)을 차단하고 사내망 외 경로 접근을 방지한다.
     */
    public void validatePath(String path) {
        Path requested = Path.of(path).normalize();
        boolean allowed = nasProps.allowedRoots().stream()
            .anyMatch(root -> requested.startsWith(Path.of(root).normalize()));
        if (!allowed) {
            throw new InvalidNasPathException(path);
        }
    }

    // -------------------------------------------------------------------------
    // DTO 변환 / 유틸
    // -------------------------------------------------------------------------

    private ProjectFolderResponse toResponse(ProjectFolder f) {
        return new ProjectFolderResponse(
            f.getFolderId(),
            f.getProject().getProjectId(),
            f.getLabel(),
            f.getNasPath(),
            f.getDescription(),
            f.getSortOrder()
        );
    }

    private String getExtension(String filename) {
        int dot = filename.lastIndexOf('.');
        return dot >= 0 ? filename.substring(dot + 1).toLowerCase() : "";
    }

    private long fileSize(Path p) {
        try { return Files.size(p); } catch (IOException e) { return -1L; }
    }

    private String fileModified(Path p) {
        try {
            BasicFileAttributes attrs = Files.readAttributes(p, BasicFileAttributes.class);
            return OffsetDateTime
                .ofInstant(attrs.lastModifiedTime().toInstant(), ZoneId.of("Asia/Seoul"))
                .format(ISO_FORMATTER);
        } catch (IOException e) {
            return "";
        }
    }
}
