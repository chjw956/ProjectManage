package com.example.projtrack.nas.dto;

public record OnlyOfficeConfigResponse(
    String documentType,
    Document document,
    EditorConfig editorConfig
) {
    public record Document(
        String fileType,
        String key,
        String url,
        String title
    ) {}

    public record EditorConfig(
        String mode,
        String callbackUrl
    ) {}
}
