package com.example.projtrack.nas;

import org.springframework.boot.context.properties.ConfigurationProperties;

import java.util.List;

@ConfigurationProperties(prefix = "nas")
public record NasProperties(List<String> allowedRoots) {}
