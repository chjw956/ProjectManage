import { useQueryClient } from '@tanstack/react-query'
import { getGetGanttQueryKey } from '@/api/generated/gantt'
import { getListMilestonesQueryKey } from '@/api/generated/milestone'
import { getListTasksQueryKey } from '@/api/generated/task'
import { getGetHomeQueryKey, getListProjectsQueryKey } from '@/api/generated/project'

/** WBS·마일스톤 변경 후 간트·진척률·상태 신호가 서버 계산값으로 다시 표시되도록 관련 쿼리를 무효화한다. */
export function useInvalidateWbs(projectId: number) {
  const queryClient = useQueryClient()
  return () =>
    Promise.all([
      queryClient.invalidateQueries({ queryKey: getGetGanttQueryKey(projectId) }),
      queryClient.invalidateQueries({ queryKey: getListMilestonesQueryKey(projectId) }),
      queryClient.invalidateQueries({ queryKey: getListTasksQueryKey(projectId) }),
      queryClient.invalidateQueries({ queryKey: getGetHomeQueryKey(projectId) }),
      queryClient.invalidateQueries({ queryKey: getListProjectsQueryKey() }),
    ])
}
