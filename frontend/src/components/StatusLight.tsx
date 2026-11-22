import { SIGNAL_COLOR, SIGNAL_LABEL } from '@/lib/constants'

interface StatusLightProps {
  status: string
}

/** 상태 신호등. 색만으로 구분하지 않고 텍스트 라벨을 반드시 함께 표시 */
export function StatusLight({ status }: StatusLightProps) {
  const colorClass = SIGNAL_COLOR[status] ?? 'bg-gray-400'
  const label = SIGNAL_LABEL[status] ?? status
  return (
    <span className="inline-flex items-center gap-1.5">
      <span className={`inline-block h-2.5 w-2.5 rounded-full ${colorClass}`} aria-hidden="true" />
      <span className="text-sm font-medium">{label}</span>
    </span>
  )
}
