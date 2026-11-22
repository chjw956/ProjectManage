package com.example.projtrack.nas.dto;

public record ProjectFolderResponse(
    Long folderId,
    Long projectId,
    String label,
    String nasPath,
    String description,
    int sortOrder
) {}
