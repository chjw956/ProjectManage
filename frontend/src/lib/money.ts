/** 원 단위 금액을 백만원으로 변환하고 천 단위 콤마를 붙여 반환. 예: 10927000000 → "10,927백만원" */
export function formatMillions(wonAmount: number | null | undefined): string {
  if (wonAmount == null) return '—'
  const millions = Math.round(wonAmount / 1_000_000)
  return `${millions.toLocaleString('ko-KR')}백만원`
}

/** 집행률을 "%"로 반환. 예: 0.734 → "73%" */
export function formatRate(rate: number): string {
  return `${Math.round(rate * 100)}%`
}
