import { zodResolver } from '@hookform/resolvers/zod'
import { useForm, useWatch } from 'react-hook-form'
import { z } from 'zod'
import { useChangeSchedule } from '@/api/generated/task'
import { toErrorMessage } from '@/lib/api-error'
import { formatDate } from '@/lib/date'
import { useInvalidateWbs } from './useInvalidateWbs'

const schema = z
  .object({
    plannedStart: z.string().min(1, '시작일을 입력하세요'),
    plannedEnd: z.string().min(1, '종료일을 입력하세요'),
    reason: z.string().trim().min(1, '변경 사유를 입력하세요'),
  })
  .refine((v) => v.plannedEnd >= v.plannedStart, {
    message: '종료일은 시작일 이후여야 합니다',
    path: ['plannedEnd'],
  })

type FormValues = z.infer<typeof schema>

interface ChangeScheduleModalProps {
  projectId: number
  taskId: number
  initialStart: string | null
  initialEnd: string | null
  onClose: () => void
}

export function ChangeScheduleModal({
  projectId,
  taskId,
  initialStart,
  initialEnd,
  onClose,
}: ChangeScheduleModalProps) {
  const invalidate = useInvalidateWbs(projectId)
  const { mutate, isPending, error } = useChangeSchedule({
    mutation: {
      onSuccess: async () => {
        await invalidate()
        onClose()
      },
    },
  })

  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      plannedStart: initialStart ?? '',
      plannedEnd: initialEnd ?? '',
      reason: '',
    },
  })
  const watchedStart = useWatch({ control, name: 'plannedStart' })
  const watchedEnd = useWatch({ control, name: 'plannedEnd' })

  const onSubmit = (values: FormValues) => {
    mutate({
      projectId,
      taskId,
      data: {
        plannedStart: values.plannedStart,
        plannedEnd: values.plannedEnd,
        reason: values.reason,
      },
    })
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="w-full max-w-md rounded-lg bg-white p-6 shadow-xl">
        <h2 className="mb-2 text-base font-semibold text-gray-900">계획 일정 변경</h2>
        <p data-testid="schedule-diff" className="mb-4 rounded-md bg-slate-50 px-3 py-2 text-xs text-slate-600">
          {formatDate(initialStart)} ~ {formatDate(initialEnd)}
          <span className="mx-1.5 text-slate-400">→</span>
          <strong className="text-slate-800">
            {formatDate(watchedStart || null)} ~ {formatDate(watchedEnd || null)}
          </strong>
        </p>
        <form onSubmit={handleSubmit(onSubmit)} noValidate>
          <div className="space-y-3">
            <div>
              <label htmlFor="plannedStart" className="block text-sm font-medium text-gray-700">
                시작일
              </label>
              <input
                id="plannedStart"
                type="date"
                {...register('plannedStart')}
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
              />
              {errors.plannedStart && (
                <p className="mt-1 text-xs text-red-500">{errors.plannedStart.message}</p>
              )}
            </div>
            <div>
              <label htmlFor="plannedEnd" className="block text-sm font-medium text-gray-700">
                종료일
              </label>
              <input
                id="plannedEnd"
                type="date"
                {...register('plannedEnd')}
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
              />
              {errors.plannedEnd && (
                <p className="mt-1 text-xs text-red-500">{errors.plannedEnd.message}</p>
              )}
            </div>
            <div>
              <label htmlFor="reason" className="block text-sm font-medium text-gray-700">
                변경 사유 <span className="text-red-500">*</span>
              </label>
              <textarea
                id="reason"
                rows={3}
                {...register('reason')}
                placeholder="변경 사유를 입력하세요"
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
              />
              {errors.reason && (
                <p className="mt-1 text-xs text-red-500">{errors.reason.message}</p>
              )}
            </div>
          </div>

          {error != null && (
            <p role="alert" className="mt-4 rounded-md bg-red-50 px-3 py-2 text-xs text-red-600">
              {toErrorMessage(error)}
            </p>
          )}

          <div className="mt-5 flex justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-md border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              취소
            </button>
            <button
              type="submit"
              disabled={isPending}
              className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
            >
              {isPending ? '저장 중…' : '저장'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
