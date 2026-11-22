import { zodResolver } from '@hookform/resolvers/zod'
import { useMemo } from 'react'
import { useForm, useWatch } from 'react-hook-form'
import { z } from 'zod'
import { useCreateProcess, useCreateSubTask, useUpdateTask } from '@/api/generated/task'
import {
  FormError, Modal, ServerError, inputClass, primaryButtonClass, secondaryButtonClass,
} from '@/components/Modal'
import { toErrorMessage } from '@/lib/api-error'
import { useInvalidateWbs } from './useInvalidateWbs'

interface EditTarget {
  taskId: number
  name: string
  dept?: string | null
  assignee?: string | null
}

export type TaskFormMode =
  | { type: 'create-process' }
  | { type: 'create-subtask'; parentId: number; parentName: string }
  | { type: 'edit'; kind: 'process' | 'task'; target: EditTarget }

interface TaskFormModalProps {
  projectId: number
  mode: TaskFormMode
  onClose: () => void
}

const norm = (s?: string | null) => (s ?? '').trim()

/** 공정·세부 Task 추가 / 기본 정보(이름·부서·담당자) 수정 창. 담당자 변경 시 사유 필수. */
export function TaskFormModal({ projectId, mode, onClose }: TaskFormModalProps) {
  const isEdit = mode.type === 'edit'
  const originalAssignee = isEdit ? norm(mode.target.assignee) : ''

  const schema = useMemo(
    () =>
      z
        .object({
          name: z.string().trim().min(1, '이름을 입력하세요'),
          dept: z.string().optional(),
          assignee: z.string().optional(),
          plannedStart: z.string().optional(),
          plannedEnd: z.string().optional(),
          reason: z.string().optional(),
        })
        .refine((v) => !v.plannedStart || !v.plannedEnd || v.plannedEnd >= v.plannedStart, {
          message: '종료일은 시작일 이후여야 합니다',
          path: ['plannedEnd'],
        })
        .refine((v) => !isEdit || norm(v.assignee) === originalAssignee || !!norm(v.reason), {
          message: '담당자를 바꾸려면 변경 사유를 입력하세요',
          path: ['reason'],
        }),
    [isEdit, originalAssignee],
  )
  type FormValues = z.infer<typeof schema>

  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: isEdit
      ? { name: mode.target.name, dept: mode.target.dept ?? '', assignee: mode.target.assignee ?? '', reason: '' }
      : { name: '', dept: '', assignee: '', plannedStart: '', plannedEnd: '' },
  })
  const watchedAssignee = useWatch({ control, name: 'assignee' })

  const invalidate = useInvalidateWbs(projectId)
  const onSuccess = async () => {
    await invalidate()
    onClose()
  }
  const createProcess = useCreateProcess({ mutation: { onSuccess } })
  const createSubTask = useCreateSubTask({ mutation: { onSuccess } })
  const updateTask = useUpdateTask({ mutation: { onSuccess } })
  const active = isEdit ? updateTask : mode.type === 'create-process' ? createProcess : createSubTask

  const assigneeChanged = isEdit && norm(watchedAssignee) !== originalAssignee

  const onSubmit = (v: FormValues) => {
    if (mode.type === 'edit') {
      updateTask.mutate({
        projectId,
        taskId: mode.target.taskId,
        data: {
          name: v.name.trim(),
          dept: norm(v.dept),
          assignee: norm(v.assignee),
          ...(assigneeChanged ? { reason: norm(v.reason) } : {}),
        },
      })
      return
    }
    const data = {
      name: v.name.trim(),
      dept: norm(v.dept) || undefined,
      assignee: norm(v.assignee) || undefined,
      plannedStart: v.plannedStart || undefined,
      plannedEnd: v.plannedEnd || undefined,
    }
    if (mode.type === 'create-process') createProcess.mutate({ projectId, data })
    else createSubTask.mutate({ projectId, parentId: mode.parentId, data })
  }

  const title =
    mode.type === 'create-process' ? '공정 추가'
      : mode.type === 'create-subtask' ? '세부 Task 추가'
        : mode.kind === 'process' ? '공정 정보 수정' : 'Task 정보 수정'
  const subtitle =
    mode.type === 'create-subtask' ? `공정 · ${mode.parentName}`
      : mode.type === 'edit' ? mode.target.name : undefined

  return (
    <Modal
      title={title}
      subtitle={subtitle}
      onClose={onClose}
      footer={
        <>
          <button type="button" onClick={onClose} className={secondaryButtonClass}>취소</button>
          <button type="submit" form="task-form" disabled={active.isPending} className={primaryButtonClass}>
            {active.isPending ? '저장 중…' : isEdit ? '저장' : '추가'}
          </button>
        </>
      }
    >
      <form id="task-form" onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4 px-6 py-5">
        <div>
          <label htmlFor="task-name" className="block text-sm font-medium text-gray-700">
            {mode.type === 'create-process' || (isEdit && mode.kind === 'process') ? '공정명' : 'Task명'}{' '}
            <span className="text-red-500">*</span>
          </label>
          <input id="task-name" type="text" {...register('name')} className={inputClass} />
          <FormError message={errors.name?.message} />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label htmlFor="task-dept" className="block text-sm font-medium text-gray-700">담당 부서</label>
            <input id="task-dept" type="text" {...register('dept')} className={inputClass} />
          </div>
          <div>
            <label htmlFor="task-assignee" className="block text-sm font-medium text-gray-700">담당자</label>
            <input id="task-assignee" type="text" {...register('assignee')} className={inputClass} />
          </div>
        </div>

        {!isEdit && (
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label htmlFor="task-start" className="block text-sm font-medium text-gray-700">계획 시작일</label>
              <input id="task-start" type="date" {...register('plannedStart')} className={inputClass} />
            </div>
            <div>
              <label htmlFor="task-end" className="block text-sm font-medium text-gray-700">계획 종료일</label>
              <input id="task-end" type="date" {...register('plannedEnd')} className={inputClass} />
              <FormError message={errors.plannedEnd?.message} />
            </div>
          </div>
        )}

        {isEdit && (
          <p className="text-xs text-slate-400">계획 일정은 상세 창의 "일정 변경"에서 사유와 함께 바꿉니다.</p>
        )}

        {assigneeChanged && (
          <div className="rounded-md border border-amber-200 bg-amber-50 p-3">
            <p className="text-xs text-amber-800">
              담당자 변경: <strong>{originalAssignee || '미지정'}</strong> →{' '}
              <strong>{norm(watchedAssignee) || '미지정'}</strong>
            </p>
            <label htmlFor="task-reason" className="mt-2 block text-sm font-medium text-gray-700">
              변경 사유 <span className="text-red-500">*</span>
            </label>
            <textarea id="task-reason" rows={2} {...register('reason')} className={inputClass} />
            <FormError message={errors.reason?.message} />
          </div>
        )}
      </form>

      <ServerError message={active.error ? toErrorMessage(active.error) : null} />
    </Modal>
  )
}
