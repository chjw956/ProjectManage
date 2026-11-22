package com.example.projtrack.nas;

/**
 * NAS 경로가 허용 루트(nas.allowed-roots) 밖일 때 던진다.
 * IllegalArgumentException 하위이므로 GlobalExceptionHandler에서 400으로 응답한다.
 */
public class InvalidNasPathException extends IllegalArgumentException {
    public InvalidNasPathException(String path) {
        super("허용되지 않은 NAS 경로입니다: " + path);
    }
}
