import { formatDate } from '@/lib/date'
import type { MilestoneResponse } from '@/api/generated/model'

interface MilestoneBarProps {
  milestones: MilestoneResponse[]
}

const TYPE_STYLE: Record<string, { bg: string; text: string; dot: string }> = {
  REVIEW:    { bg: 'bg-blue-100',   text: 'text-blue-800',   dot: 'bg-blue-400' },
  REPORT:    { bg: 'bg-violet-100', text: 'text-violet-800', dot: 'bg-violet-500' },
  SUBMIT:    { bg: 'bg-emerald-100',text: 'text-emerald-800',dot: 'bg-emerald-500' },
  DELIVERY:  { bg: 'bg-amber-100',  text: 'text-amber-800',  dot: 'bg-amber-500' },
  ESTABLISH: { bg: 'bg-orange-100', text: 'text-orange-800', dot: 'bg-orange-400' },
  DECISION:  { bg: 'bg-sky-100',    text: 'text-sky-800',    dot: 'bg-sky-500' },
  DEFAULT:   { bg: 'bg-slate-100',  text: 'text-slate-700',  dot: 'bg-slate-400' },
}

const STATUS_STYLE: Record<string, string> = {
  DONE:    'opacity-60',
  DELAYED: 'ring-1 ring-red-400',
  default: '',
}

export function MilestoneBar({ milestones }: MilestoneBarProps) {
  if (milestones.length === 0) return null

  return (
    <div data-testid="milestone-bar" className="flex flex-wrap items-center gap-2 px-5 py-2.5 bg-white border-b border-slate-200">
      <span className="text-xs font-semibold text-slate-500 mr-1">마일스톤</span>
      {milestones.map((m) => {
        const style = TYPE_STYLE[m.type ?? 'DEFAULT'] ?? TYPE_STYLE['DEFAULT']
        const statusCls = STATUS_STYLE[m.status ?? ''] ?? STATUS_STYLE['default']
        const isDone = m.status === 'DONE'

        return (
          <span
            key={m.milestoneId}
            className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ${style.bg} ${style.text} ${statusCls}`}
            title={`${m.name} · ${formatDate(m.plannedDate)}`}
          >
            <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${style.dot}`} />
            <span>{m.name}</span>
            <span className="opacity-70">{formatDate(m.plannedDate)}</span>
            {isDone && <span className="ml-0.5">✓</span>}
          </span>
        )
      })}
    </div>
  )
}
