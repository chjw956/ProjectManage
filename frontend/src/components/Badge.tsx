import { TASK_STATUS_COLOR, TASK_STATUS_LABEL } from '@/lib/constants'

interface BadgeProps {
  status: string
  delayed?: boolean
}

/** 상태 배지. delayed=true 이면 항상 "지연(빨강)"으로 표시 */
export function Badge({ status, delayed = false }: BadgeProps) {
  const key = delayed ? 'DELAYED' : status
  const label = TASK_STATUS_LABEL[key] ?? status
  const colorClass = TASK_STATUS_COLOR[key] ?? 'bg-gray-100 text-gray-700'
  return (
    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${colorClass}`}>
      {label}
    </span>
  )
}
