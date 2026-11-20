package com.example.projtrack.wbs.dto;

import java.time.LocalDate;

/** 실제 시작·종료일 변경 요청. 사유 선택. */
public record ChangeActualDatesRequest(
    LocalDate actualStart,
    LocalDate actualEnd,
    String reason
) {}
