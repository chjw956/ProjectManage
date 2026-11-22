import { useMutation, useQueryClient } from '@tanstack/react-query'
import { axiosInstance } from '@/api/axios-instance'
import { getListProjectsQueryKey } from '@/api/generated/project'
import type { ProjectSummaryResponse } from '@/api/generated/model'

export interface CreateProjectRequest {
  name: string
  type: string   // INTERNAL | GOV
  phase?: string | null
  startDate?: string | null
  endDate?: string | null
  summary?: string | null
}

export const createProject = (body: CreateProjectRequest) =>
  axiosInstance<ProjectSummaryResponse>({
    url: '/api/v1/projects',
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    data: body,
  })

export function useCreateProject() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: createProject,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: getListProjectsQueryKey() })
    },
  })
}
