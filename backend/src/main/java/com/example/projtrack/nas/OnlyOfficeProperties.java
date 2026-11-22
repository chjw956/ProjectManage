package com.example.projtrack.nas;

import org.springframework.boot.context.properties.ConfigurationProperties;

@ConfigurationProperties(prefix = "onlyoffice")
public record OnlyOfficeProperties(String serverUrl, String callbackHost) {}
