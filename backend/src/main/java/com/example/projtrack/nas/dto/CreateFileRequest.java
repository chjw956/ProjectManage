package com.example.projtrack.nas.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;

public record CreateFileRequest(
    @NotBlank String name,
    @NotBlank @Pattern(regexp = "xlsx|docx") String type
) {}
