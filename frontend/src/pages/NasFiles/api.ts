import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import axios from 'axios'
import type {
  ProjectFolderResponse,
  NasFileInfo,
  OnlyOfficeConfig,
  CreateFileRequest,
} from './types'

// -------------------------------------------------------------------------
// 폴더
// -------------------------------------------------------------------------

export function useListFolders(projectId: number) {
  return useQuery<ProjectFolderResponse[]>({
    queryKey: ['folders', projectId],
    queryFn: () =>
      axios.get(`/api/v1/projects/${projectId}/folders`).then((r) => r.data),
  })
}

export function useCreateFolder(projectId: number) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: { label: string; nasPath: string; description?: string }) =>
      axios.post<ProjectFolderResponse>(`/api/v1/projects/${projectId}/folders`, data).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['folders', projectId] }),
  })
}

export function useDeleteFolder(projectId: number) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (folderId: number) =>
      axios.delete(`/api/v1/projects/${projectId}/folders/${folderId}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['folders', projectId] }),
  })
}

// -------------------------------------------------------------------------
// 파일
// -------------------------------------------------------------------------

export function useListFiles(projectId: number, folderId: number | null) {
  return useQuery<NasFileInfo[]>({
    queryKey: ['nas-files', projectId, folderId],
    queryFn: () =>
      axios.get(`/api/v1/projects/${projectId}/folders/${folderId}/files`).then((r) => r.data),
    enabled: folderId !== null,
  })
}

export function useCreateFile(projectId: number, folderId: number | null) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: CreateFileRequest) =>
      axios
        .post<{ fileKey: string }>(
          `/api/v1/projects/${projectId}/folders/${folderId}/files`,
          data,
        )
        .then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['nas-files', projectId, folderId] }),
  })
}

// -------------------------------------------------------------------------
// OnlyOffice
// -------------------------------------------------------------------------

export async function fetchOnlyOfficeConfig(key: string, mode: 'view' | 'edit'): Promise<OnlyOfficeConfig> {
  const { data } = await axios.get<OnlyOfficeConfig>('/api/v1/onlyoffice/config', {
    params: { key, mode },
  })
  return data
}
