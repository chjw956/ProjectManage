import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { toErrorMessage } from '@/lib/api-error'
import { useCreateProject } from './api'

const schema = z
  .object({
    name: z.string().min(1, '사업명을 입력하세요'),
    type: z.enum(['INTERNAL', 'GOV'], { error: '사업 유형을 선택하세요' }),
    phase: z.string().optional(),
    startDate: z.string().optional(),
    endDate: z.string().optional(),
    summary: z.string().optional(),
    evidenceFolderLabel: z.string().optional(),
    evidenceFolderPath: z.string().optional(),
  })
  .refine(
    (v) => !v.startDate || !v.endDate || v.endDate >= v.startDate,
    { message: '종료일은 시작일 이후여야 합니다', path: ['endDate'] },
  )
  .refine(
    (v) => !v.evidenceFolderPath?.trim() || !!v.evidenceFolderLabel?.trim(),
    { message: '폴더 경로를 입력했다면 폴더 이름도 입력하세요', path: ['evidenceFolderLabel'] },
  )

type FormValues = z.infer<typeof schema>


interface NewProjectModalProps {
  onClose: () => void
}

export function NewProjectModal({ onClose }: NewProjectModalProps) {
  const { mutate, isPending, error } = useCreateProject()
  const serverError = error ? toErrorMessage(error, '등록하지 못했습니다. 잠시 후 다시 시도하세요.') : null

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { type: 'INTERNAL' },
  })

  const onSubmit = (values: FormValues) => {
    const evidencePath = values.evidenceFolderPath?.trim()
    mutate(
      {
        name: values.name,
        type: values.type,
        phase: values.phase || null,
        startDate: values.startDate || null,
        endDate: values.endDate || null,
        summary: values.summary || null,
        ...(evidencePath
          ? { evidenceFolderLabel: values.evidenceFolderLabel?.trim(), evidenceFolderPath: evidencePath }
          : {}),
      },
      { onSuccess: onClose },
    )
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="w-full max-w-md rounded-lg bg-white p-6 shadow-xl">
        <h2 className="mb-4 text-base font-semibold text-gray-900">새 프로젝트 등록</h2>

        <form onSubmit={handleSubmit(onSubmit)} noValidate>
          <div className="space-y-4">
            {/* 사업명 */}
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                사업명 <span className="text-red-500">*</span>
              </label>
              <input
                id="name"
                type="text"
                {...register('name')}
                placeholder="사업명을 입력하세요"
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
              />
              {errors.name && (
                <p className="mt-1 text-xs text-red-500">{errors.name.message}</p>
              )}
            </div>

            {/* 사업 유형 */}
            <fieldset>
              <legend className="text-sm font-medium text-gray-700">
                사업 유형 <span className="text-red-500">*</span>
              </legend>
              <div className="mt-1 flex gap-6">
                <label className="flex items-center gap-2 text-sm text-gray-700">
                  <input
                    type="radio"
                    value="INTERNAL"
                    {...register('type')}
                    className="accent-blue-600"
                  />
                  사내
                </label>
                <label className="flex items-center gap-2 text-sm text-gray-700">
                  <input
                    type="radio"
                    value="GOV"
                    {...register('type')}
                    className="accent-blue-600"
                  />
                  정부
                </label>
              </div>
              {errors.type && (
                <p className="mt-1 text-xs text-red-500">{errors.type.message}</p>
              )}
            </fieldset>

            {/* 단계 */}
            <div>
              <label htmlFor="phase" className="block text-sm font-medium text-gray-700">
                단계
              </label>
              <input
                id="phase"
                type="text"
                {...register('phase')}
                placeholder="예: 계획, 실행, 종료"
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
              />
            </div>

            {/* 시작일 / 종료일 */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label htmlFor="startDate" className="block text-sm font-medium text-gray-700">
                  시작일
                </label>
                <input
                  id="startDate"
                  type="date"
                  {...register('startDate')}
                  className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
                />
              </div>
              <div>
                <label htmlFor="endDate" className="block text-sm font-medium text-gray-700">
                  종료일
                </label>
                <input
                  id="endDate"
                  type="date"
                  {...register('endDate')}
                  className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
                />
                {errors.endDate && (
                  <p className="mt-1 text-xs text-red-500">{errors.endDate.message}</p>
                )}
              </div>
            </div>

            {/* 한 줄 요약 */}
            <div>
              <label htmlFor="summary" className="block text-sm font-medium text-gray-700">
                한 줄 요약
              </label>
              <textarea
                id="summary"
                rows={2}
                {...register('summary')}
                placeholder="사업 목적을 간략히 입력하세요"
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
              />
            </div>

            {/* 증적자료 폴더 (선택) */}
            <fieldset className="rounded-md border border-gray-200 p-3">
              <legend className="px-1 text-sm font-medium text-gray-700">
                증적자료 폴더 <span className="text-xs font-normal text-gray-400">(선택)</span>
              </legend>
              <div className="space-y-3">
                <div>
                  <label htmlFor="evidenceFolderLabel" className="block text-xs font-medium text-gray-600">
                    폴더 이름
                  </label>
                  <input
                    id="evidenceFolderLabel"
                    type="text"
                    {...register('evidenceFolderLabel')}
                    placeholder="예: 증적자료"
                    className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
                  />
                  {errors.evidenceFolderLabel && (
                    <p className="mt-1 text-xs text-red-500">{errors.evidenceFolderLabel.message}</p>
                  )}
                </div>
                <div>
                  <label htmlFor="evidenceFolderPath" className="block text-xs font-medium text-gray-600">
                    NAS 경로
                  </label>
                  <input
                    id="evidenceFolderPath"
                    type="text"
                    {...register('evidenceFolderPath')}
                    placeholder="예: /mnt/nas/사업명/증적자료"
                    className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 font-mono text-sm focus:border-blue-500 focus:outline-none"
                  />
                  <p className="mt-1 text-xs text-gray-400">
                    입력하면 사업 등록과 함께 NAS 폴더로 등록됩니다.
                  </p>
                </div>
              </div>
            </fieldset>
          </div>

          {serverError && (
            <p role="alert" className="mt-4 rounded-md bg-red-50 px-3 py-2 text-xs text-red-600">
              {serverError}
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
              {isPending ? '저장 중…' : '등록'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
