import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import {
  FormError, Modal, ServerError, dangerButtonClass, inputClass, secondaryButtonClass,
} from '@/components/Modal'
import { toErrorMessage } from '@/lib/api-error'

const schema = z.object({
  reason: z.string().trim().min(1, '삭제 사유를 입력하세요'),
})
type FormValues = z.infer<typeof schema>

interface DeleteConfirmModalProps {
  /** 예: "공정 삭제", "마일스톤 삭제" */
  title: string
  targetName: string
  /** 삭제 대상 요약 (계획 기간 등) */
  details?: React.ReactNode
  /** 함께 삭제되는 항목 경고 등 */
  warning?: React.ReactNode
  isPending: boolean
  error: unknown
  onConfirm: (reason: string) => void
  onClose: () => void
}

/** 사유 필수 삭제 확인 창. 삭제 기록은 백엔드가 타임라인에 남긴다. */
export function DeleteConfirmModal({
  title, targetName, details, warning, isPending, error, onConfirm, onClose,
}: DeleteConfirmModalProps) {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormValues>({ resolver: zodResolver(schema), defaultValues: { reason: '' } })

  return (
    <Modal
      title={title}
      onClose={onClose}
      widthClass="max-w-md"
      footer={
        <>
          <button type="button" onClick={onClose} className={secondaryButtonClass}>취소</button>
          <button type="submit" form="delete-form" disabled={isPending} className={dangerButtonClass}>
            {isPending ? '삭제 중…' : '삭제'}
          </button>
        </>
      }
    >
      <form
        id="delete-form"
        onSubmit={handleSubmit((v) => onConfirm(v.reason.trim()))}
        noValidate
        className="space-y-4 px-6 py-5"
      >
        <div className="rounded-md bg-slate-50 px-3 py-2">
          <p className="text-sm font-medium text-slate-900">{targetName}</p>
          {details && <div className="mt-0.5 text-xs text-slate-500">{details}</div>}
        </div>

        {warning && (
          <p className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">{warning}</p>
        )}

        <div>
          <label htmlFor="delete-reason" className="block text-sm font-medium text-gray-700">
            삭제 사유 <span className="text-red-500">*</span>
          </label>
          <textarea
            id="delete-reason"
            rows={3}
            {...register('reason')}
            placeholder="삭제 사유는 타임라인에 기록됩니다"
            className={inputClass}
          />
          <FormError message={errors.reason?.message} />
        </div>
      </form>

      <ServerError message={error ? toErrorMessage(error, '삭제하지 못했습니다. 잠시 후 다시 시도하세요.') : null} />
    </Modal>
  )
}
