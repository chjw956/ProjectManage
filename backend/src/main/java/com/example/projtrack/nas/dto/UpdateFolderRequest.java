package com.example.projtrack.nas.dto;

import jakarta.validation.constraints.NotBlank;

public record UpdateFolderRequest(
    @NotBlank String label,
    @NotBlank String nasPath,
    String description,
    int sortOrder
) {}
