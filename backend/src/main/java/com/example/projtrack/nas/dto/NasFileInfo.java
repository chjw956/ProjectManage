package com.example.projtrack.nas.dto;

public record NasFileInfo(
    String name,
    String fileKey,
    long size,
    String lastModified,
    String extension
) {}
