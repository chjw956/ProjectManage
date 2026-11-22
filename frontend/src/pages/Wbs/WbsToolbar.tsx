import { useSearchParams } from 'react-router-dom'

const QUICK_FILTERS = [
  { value: 'all',      label: '전체' },
  { value: 'delayed',  label: '⚠ 지연' },
  { value: 'deadline', label: '마감 임박' },
  { value: 'week',     label: '7일 이내' },
] as const

interface WbsToolbarProps {
  totalCount: number
  filteredCount: number
  depts: string[]
}

export function WbsToolbar({ totalCount, filteredCount, depts }: WbsToolbarProps) {
  const [searchParams, setSearchParams] = useSearchParams()

  const view        = (searchParams.get('view')       ?? 'gantt') as 'gantt' | 'list'
  const scale       = (searchParams.get('scale')      ?? 'fit')  as 'week' | 'fit'
  const q           = searchParams.get('q')           ?? ''
  const deptFilter  = searchParams.get('dept')        ?? ''
  const statusFilter= searchParams.get('taskStatus')  ?? ''
  const quickFilter = searchParams.get('quick')       ?? 'all'

  const setParam = (key: string, value: string) => {
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev)
      if (value) next.set(key, value)
      else next.delete(key)
      return next
    })
  }

  const isFiltered = filteredCount < totalCount

  return (
    <div className="bg-white border-b border-slate-200">
      {/* 메인 툴바 */}
      <div className="flex items-center gap-2 px-5 py-2.5">
        {/* 검색 */}
        <div className="relative flex-1 max-w-xs">
          <svg
            className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
            width="14" height="14" viewBox="0 0 14 14" fill="none"
          >
            <circle cx="6" cy="6" r="4.5" stroke="currentColor" strokeWidth="1.4" />
            <path d="M9.5 9.5L12 12" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
          </svg>
          <input
            type="search"
            value={q}
            onChange={(e) => setParam('q', e.target.value)}
            placeholder="Task · 담당자 검색"
            className="w-full pl-8 pr-3 py-1.5 text-sm border border-slate-300 rounded-lg focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-200"
          />
        </div>

        {/* 부서 필터 */}
        <select
          value={deptFilter}
          onChange={(e) => setParam('dept', e.target.value)}
          className="text-sm border border-slate-300 rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-blue-500 text-slate-700"
        >
          <option value="">전체 부서</option>
          {depts.map((d) => <option key={d} value={d}>{d}</option>)}
        </select>

        {/* 상태 필터 */}
        <select
          value={statusFilter}
          onChange={(e) => setParam('taskStatus', e.target.value)}
          className="text-sm border border-slate-300 rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-blue-500 text-slate-700"
        >
          <option value="">전체 상태</option>
          <option value="PENDING">예정</option>
          <option value="IN_PROGRESS">진행중</option>
          <option value="DONE">완료</option>
          <option value="DELAYED">지연</option>
        </select>

        {/* 간격 채움 */}
        <div className="flex-1" />

        {/* 건수 표시 */}
        <span data-testid="task-count" className="text-xs text-slate-400 whitespace-nowrap">
          {isFiltered ? (
            <><strong className="text-blue-600">{filteredCount}</strong> / {totalCount}건</>
          ) : (
            <><strong className="text-slate-600">{totalCount}</strong>건</>
          )}
        </span>

        {/* 주단위 / 기간축소 */}
        {view === 'gantt' && (
          <button
            type="button"
            onClick={() => setParam('scale', scale === 'week' ? 'fit' : 'week')}
            className="flex items-center gap-1.5 text-xs font-medium border border-slate-300 rounded-lg px-3 py-1.5 text-slate-600 hover:bg-slate-50 transition-colors"
          >
            <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
              <path d="M1 6.5h11M4 3.5L1 6.5l3 3M9 3.5l3 3-3 3" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            {scale === 'week' ? '기간 축소' : '주 단위'}
          </button>
        )}

        {/* 목록 / 간트 토글 */}
        <div className="flex border border-slate-300 rounded-lg overflow-hidden text-xs font-medium">
          <button
            type="button"
            onClick={() => setParam('view', 'list')}
            className={`flex items-center gap-1.5 px-3 py-1.5 transition-colors ${
              view === 'list'
                ? 'bg-blue-600 text-white'
                : 'bg-white text-slate-600 hover:bg-slate-50'
            }`}
          >
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
              <path d="M1 2.5h10M1 6h10M1 9.5h10" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
            </svg>
            목록
          </button>
          <button
            type="button"
            onClick={() => setParam('view', 'gantt')}
            className={`flex items-center gap-1.5 px-3 py-1.5 border-l border-slate-300 transition-colors ${
              view === 'gantt'
                ? 'bg-blue-600 text-white border-blue-600'
                : 'bg-white text-slate-600 hover:bg-slate-50'
            }`}
          >
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
              <rect x="1" y="2" width="5" height="2" rx="0.5" fill="currentColor" />
              <rect x="4" y="5.5" width="7" height="2" rx="0.5" fill="currentColor" />
              <rect x="2" y="9" width="4" height="2" rx="0.5" fill="currentColor" />
            </svg>
            간트
          </button>
        </div>
      </div>

      {/* 빠른 필터 */}
      <div className="flex items-center gap-1.5 px-5 pb-2.5">
        {QUICK_FILTERS.map((f) => (
          <button
            key={f.value}
            type="button"
            onClick={() => setParam('quick', f.value === quickFilter ? 'all' : f.value)}
            className={`rounded-full px-3 py-0.5 text-xs font-medium transition-colors ${
              quickFilter === f.value
                ? 'bg-blue-600 text-white'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>
    </div>
  )
}
