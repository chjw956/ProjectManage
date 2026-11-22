import { isAxiosError } from 'axios'

/** 서버 ProblemDetail의 detail을 우선 반환하고, 없으면 기본 문구를 반환한다. */
export function toErrorMessage(error: unknown, fallback = '저장하지 못했습니다. 잠시 후 다시 시도하세요.'): string {
  if (isAxiosError<{ detail?: string }>(error) && error.response?.data?.detail) {
    return error.response.data.detail
  }
  return fallback
}
