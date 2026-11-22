/** Task·공정 상태 → 한국어 라벨 */
export const TASK_STATUS_LABEL: Record<string, string> = {
  PENDING: '예정',
  TODO: '예정',
  IN_PROGRESS: '진행중',
  DONE: '완료',
  DELAYED: '지연',
}

/** Task·공정 상태 → Tailwind 색상 클래스 (bg + text) */
export const TASK_STATUS_COLOR: Record<string, string> = {
  PENDING: 'bg-slate-100 text-slate-600',
  TODO: 'bg-slate-100 text-slate-600',
  IN_PROGRESS: 'bg-blue-100 text-blue-700',
  DONE: 'bg-emerald-100 text-emerald-700',
  DELAYED: 'bg-red-100 text-red-700',
}

/** 사업 상태 신호 → 한국어 라벨 */
export const SIGNAL_LABEL: Record<string, string> = {
  NORMAL: '정상',
  CAUTION: '주의',
  DANGER: '위험',
}

/** 사업 상태 신호 → Tailwind 색상 클래스 */
export const SIGNAL_COLOR: Record<string, string> = {
  NORMAL: 'bg-green-500',
  CAUTION: 'bg-orange-400',
  DANGER: 'bg-red-500',
}

/** 마일스톤 유형 → 색상 (hex) — 간트 칩 */
export const MILESTONE_COLOR: Record<string, string> = {
  REVIEW: '#3b82f6',   // blue-500
  CONTRACT: '#ef4444', // red-500
  SUBMIT: '#22c55e',   // green-500
  ESTABLISH: '#f59e0b', // amber-500
  DEFAULT: '#8b5cf6',  // violet-500
}

export const WEEK_COL_WIDTH_PX = 80
