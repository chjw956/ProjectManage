/** 왼쪽 고정 표 헤더 */
export function GanttLeftTableHeader() {
  return (
    <div
      className="flex h-10 flex-shrink-0 items-center border-b border-gray-200 bg-gray-50 font-medium text-xs text-gray-600"
      style={{ width: 480 }}
    >
      <div className="w-56 px-3">공정 / 세부 TASK</div>
      <div className="w-28 px-2">담당 부서</div>
      <div className="w-20 px-2">담당자</div>
      <div className="w-20 px-2">상태</div>
      <div className="w-16 px-2 text-right">진행률</div>
    </div>
  )
}
