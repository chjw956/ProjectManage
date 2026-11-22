package com.example.projtrack.nas;

import org.springframework.boot.context.properties.EnableConfigurationProperties;
import org.springframework.context.annotation.Configuration;

@Configuration
@EnableConfigurationProperties({NasProperties.class, OnlyOfficeProperties.class})
public class NasConfig {}
