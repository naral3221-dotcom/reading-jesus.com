'use client'

/**
 * PersonalProject React Query Hooks
 *
 * 개인 성경 읽기 프로젝트 관련 React Query 훅.
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { SupabasePersonalProjectRepository } from '@/infrastructure/repositories/SupabasePersonalProjectRepository'
import {
  GetUserProjects,
  GetProject,
  CreateProject,
  UpdateProject,
  DeleteProject,
  ToggleProjectCheck,
  GetProjectChecks,
} from '@/application/use-cases/personal-project'
import type {
  CreatePersonalProjectInput,
  UpdatePersonalProjectInput,
} from '@/domain/entities/PersonalProject'

// Repository 인스턴스 (싱글톤)
const projectRepository = new SupabasePersonalProjectRepository()

// Use Case 인스턴스
const getUserProjects = new GetUserProjects(projectRepository)
const getProject = new GetProject(projectRepository)
const createProject = new CreateProject(projectRepository)
const updateProject = new UpdateProject(projectRepository)
const deleteProject = new DeleteProject(projectRepository)
const toggleProjectCheck = new ToggleProjectCheck(projectRepository)
const getProjectChecks = new GetProjectChecks(projectRepository)

// Query Keys
export const personalProjectKeys = {
  all: ['personalProjects'] as const,
  lists: () => [...personalProjectKeys.all, 'list'] as const,
  list: (userId: string, activeOnly?: boolean) =>
    [...personalProjectKeys.lists(), { userId, activeOnly }] as const,
  details: () => [...personalProjectKeys.all, 'detail'] as const,
  detail: (id: string, userId: string) =>
    [...personalProjectKeys.details(), id, userId] as const,
  checks: (projectId: string) =>
    [...personalProjectKeys.all, 'checks', projectId] as const,
}

/**
 * 사용자의 프로젝트 목록 조회
 */
export function useUserProjects(userId: string | null, activeOnly = true) {
  return useQuery({
    queryKey: personalProjectKeys.list(userId ?? '', activeOnly),
    queryFn: async () => {
      if (!userId) return []
      const result = await getUserProjects.execute({ userId, activeOnly })
      if (result.error) throw new Error(result.error)
      return result.projects
    },
    enabled: !!userId,
  })
}

/**
 * 프로젝트 상세 조회
 */
export function useProject(id: string | null, userId: string | null) {
  return useQuery({
    queryKey: personalProjectKeys.detail(id ?? '', userId ?? ''),
    queryFn: async () => {
      if (!id || !userId) return null
      const result = await getProject.execute(id, userId)
      if (result.error) throw new Error(result.error)
      return result.project
    },
    enabled: !!id && !!userId,
  })
}

/**
 * 프로젝트 체크 목록 조회
 */
export function useProjectChecks(projectId: string | null) {
  return useQuery({
    queryKey: personalProjectKeys.checks(projectId ?? ''),
    queryFn: async () => {
      if (!projectId) return []
      const result = await getProjectChecks.execute(projectId)
      if (result.error) throw new Error(result.error)
      return result.checkedDays
    },
    enabled: !!projectId,
  })
}

/**
 * 프로젝트 생성
 */
export function useCreateProject() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (input: CreatePersonalProjectInput) => {
      const result = await createProject.execute(input)
      if (result.error) throw new Error(result.error)
      return result.project
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: personalProjectKeys.list(variables.userId),
      })
    },
  })
}

/**
 * 프로젝트 수정
 */
export function useUpdateProject() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({
      id,
      userId,
      input,
    }: {
      id: string
      userId: string
      input: UpdatePersonalProjectInput
    }) => {
      const result = await updateProject.execute(id, userId, input)
      if (result.error) throw new Error(result.error)
      return result.project
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: personalProjectKeys.list(variables.userId),
      })
      queryClient.invalidateQueries({
        queryKey: personalProjectKeys.detail(variables.id, variables.userId),
      })
    },
  })
}

/**
 * 프로젝트 삭제
 */
export function useDeleteProject() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, userId }: { id: string; userId: string }) => {
      const result = await deleteProject.execute(id, userId)
      if (!result.success) throw new Error(result.error ?? '삭제 실패')
      return { id, userId }
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: personalProjectKeys.list(variables.userId),
      })
    },
  })
}

/**
 * 프로젝트 체크 토글
 */
export function useToggleProjectCheck() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({
      projectId,
      dayNumber,
      userId,
    }: {
      projectId: string
      dayNumber: number
      userId: string
    }) => {
      const result = await toggleProjectCheck.execute(projectId, dayNumber)
      if (result.error) throw new Error(result.error)
      return { isChecked: result.isChecked, projectId, userId }
    },
    onSuccess: (data) => {
      // 체크 목록 갱신
      queryClient.invalidateQueries({
        queryKey: personalProjectKeys.checks(data.projectId),
      })
      // 프로젝트 상세 갱신 (통계 포함)
      queryClient.invalidateQueries({
        queryKey: personalProjectKeys.detail(data.projectId, data.userId),
      })
      // 프로젝트 목록 갱신
      queryClient.invalidateQueries({
        queryKey: personalProjectKeys.list(data.userId),
      })
    },
  })
}
