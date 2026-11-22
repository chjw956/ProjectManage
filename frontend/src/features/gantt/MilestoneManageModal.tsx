import { zodResolver } from '@hookform/resolvers/zod'
import { useMemo, useState } from 'react'
import { useForm, useWatch } from 'react-hook-form'
import { z } from 'zod'
import { useCreateMilestone, useDeleteMilestone, useUpdateMilestone } from '@/api/generated/milestone'
import type { MilestoneResponse } from '@/api/generated/model'
import {
  FormError, Modal, inputClass, primaryButtonClass, secondaryButtonClass,
} from '@/components/Modal'
import { toErrorMessage } from '@/lib/api-error'
import { MILESTONE_STATUS_LABEL, MILESTONE_TYPE_LABEL } from '@/lib/constants'
import { formatDate } from '@/lib/date'
import { DeleteConfirmModal } from './DeleteConfirmModal'
import { useInvalidateWbs } from './useInvalidateWbs'

interface MilestoneManageModalProps {
  projectId: number
  milestones: MilestoneResponse[]
  onClose: () => void
}

/** 마일스톤 추가·수정·삭제. 계획일 변경·삭제는 사유 필수 (타임라인 기록은 백엔드). */
export function MilestoneManageModal({ projectId, milestones, onClose }: MilestoneManageModalProps) {
  // 'new' = 추가 폼, number = 수정 중인 milestoneId
  const [editing, setEditing] = useState<'new' | number | null>(null)
  const [deleting, setDeleting] = useState<MilestoneResponse | null>(null)

  const invalidate = useInvalidateWbs(projectId)
  const deleteMilestone = useDeleteMilestone({
    mutation: {
      onSuccess: async () => {
        await invalidate()
        setDeleting(null)
      },
    },
  })

  if (deleting) {
    return (
      <DeleteConfirmModal
        title="마일스톤 삭제"
        targetName={deleting.name ?? ''}
        details={<>{MILESTONE_TYPE_LABEL[deleting.type ?? ''] ?? deleting.type ?? '유형 없음'} · 계획 {formatDate(deleting.plannedDate)}</>}
        isPending={deleteMilestone.isPending}
        error={deleteMilestone.error}
        onConfirm={(reason) =>
          deleteMilestone.mutate({ projectId, milestoneId: deleting.milestoneId ?? 0, data: { reason } })
        }
        onClose={() => {
          deleteMilestone.reset()
          setDeleting(null)
        }}
      />
    )
  }

  return (
    <Modal title="마일스톤 관리" subtitle={`${milestones.length}개`} onClose={onClose} widthClass="max-w-2xl">
      <div className="space-y-3 px-6 py-5">
        {editing === 'new' ? (
          <MilestoneForm projectId={projectId} onDone={() => setEditing(null)} />
        ) : (
          <button
            type="button"
            onClick={() => setEditing('new')}
            className="w-full rounded-md border border-dashed border-slate-300 py-2 text-sm font-medium text-blue-600 hover:bg-blue-50"
          >
            + 마일스톤 추가
          </button>
        )}

        {milestones.length === 0 && editing !== 'new' && (
          <p className="py-6 text-center text-sm text-slate-400">등록된 마일스톤이 없습니다.</p>
        )}

        <ul className="space-y-2">
          {milestones.map((m) =>
            editing === m.milestoneId ? (
              <li key={m.milestoneId}>
                <MilestoneForm projectId={projectId} milestone={m} onDone={() => setEditing(null)} />
              </li>
            ) : (
              <li
                key={m.milestoneId}
                className="flex items-center gap-3 rounded-md border border-slate-200 px-3 py-2"
              >
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-slate-900">{m.name}</p>
                  <p className="text-xs text-slate-500">
                    {MILESTONE_TYPE_LABEL[m.type ?? ''] ?? m.type ?? '유형 없음'} · 계획 {formatDate(m.plannedDate)}
                    {m.actualDate && ` · 실제 ${formatDate(m.actualDate)}`}
                  </p>
                </div>
                <span className="shrink-0 rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-600">
                  {MILESTONE_STATUS_LABEL[m.status ?? ''] ?? m.status}
                </span>
                <button
                  type="button"
                  onClick={() => setEditing(m.milestoneId ?? null)}
                  aria-label={`${m.name} 수정`}
                  className="shrink-0 text-xs font-medium text-slate-600 hover:text-blue-700"
                >
                  수정
                </button>
                <button
                  type="button"
                  onClick={() => setDeleting(m)}
                  aria-label={`${m.name} 삭제`}
                  className="shrink-0 text-xs font-medium text-red-600 hover:text-red-700"
                >
                  삭제
                </button>
              </li>
            ),
          )}
        </ul>
      </div>
    </Modal>
  )
}

// -------------------------------------------------------------------------

function MilestoneForm({
  projectId, milestone, onDone,
}: {
  projectId: number
  milestone?: MilestoneResponse
  onDone: () => void
}) {
  const isEdit = !!milestone
  const originalDate = milestone?.plannedDate ?? ''

  const schema = useMemo(
    () =>
      z
        .object({
          name: z.string().trim().min(1, '마일스톤 명칭을 입력하세요'),
          type: z.string().optional(),
          plannedDate: z.string().min(1, '계획일을 입력하세요'),
          actualDate: z.string().optional(),
          status: z.string().optional(),
          reason: z.string().optional(),
        })
        .refine((v) => !isEdit || v.plannedDate === originalDate || !!v.reason?.trim(), {
          message: '계획일을 바꾸려면 변경 사유를 입력하세요',
          path: ['reason'],
        }),
    [isEdit, originalDate],
  )
  type FormValues = z.infer<typeof schema>

  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: milestone?.name ?? '',
      type: milestone?.type ?? 'REVIEW',
      plannedDate: originalDate,
      actualDate: milestone?.actualDate ?? '',
      status: milestone?.status ?? 'TODO',
      reason: '',
    },
  })
  const watchedDate = useWatch({ control, name: 'plannedDate' })

  const invalidate = useInvalidateWbs(projectId)
  const onSuccess = async () => {
    await invalidate()
    onDone()
  }
  const create = useCreateMilestone({ mutation: { onSuccess } })
  const update = useUpdateMilestone({ mutation: { onSuccess } })
  const active = isEdit ? update : create

  const dateChanged = isEdit && watchedDate !== originalDate
  const idPrefix = isEdit ? `ms-${milestone?.milestoneId}` : 'ms-new'

  const onSubmit = (v: FormValues) => {
    const data = {
      name: v.name.trim(),
      type: v.type || undefined,
      plannedDate: v.plannedDate,
    }
    if (!isEdit) {
      create.mutate({ projectId, data })
      return
    }
    update.mutate({
      projectId,
      milestoneId: milestone.milestoneId ?? 0,
      data: {
        ...data,
        status: v.status || undefined,
        actualDate: v.actualDate || undefined,
        ...(dateChanged ? { reason: v.reason?.trim() } : {}),
      },
    })
  }

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      noValidate
      aria-label={isEdit ? '마일스톤 수정' : '마일스톤 추가'}
      className="space-y-3 rounded-md border border-blue-200 bg-blue-50/40 p-3"
    >
      <div className="grid grid-cols-3 gap-3">
        <div className="col-span-2">
          <label htmlFor={`${idPrefix}-name`} className="block text-xs font-medium text-gray-700">
            명칭 <span className="text-red-500">*</span>
          </label>
          <input id={`${idPrefix}-name`} type="text" {...register('name')} className={inputClass} />
          <FormError message={errors.name?.message} />
        </div>
        <div>
          <label htmlFor={`${idPrefix}-type`} className="block text-xs font-medium text-gray-700">유형</label>
          <select id={`${idPrefix}-type`} {...register('type')} className={inputClass}>
            {Object.entries(MILESTONE_TYPE_LABEL).map(([value, label]) => (
              <option key={value} value={value}>{label}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-3">
        <div>
          <label htmlFor={`${idPrefix}-planned`} className="block text-xs font-medium text-gray-700">
            계획일 <span className="text-red-500">*</span>
          </label>
          <input id={`${idPrefix}-planned`} type="date" {...register('plannedDate')} className={inputClass} />
          <FormError message={errors.plannedDate?.message} />
        </div>
        {isEdit && (
          <>
            <div>
              <label htmlFor={`${idPrefix}-status`} className="block text-xs font-medium text-gray-700">상태</label>
              <select id={`${idPrefix}-status`} {...register('status')} className={inputClass}>
                {Object.entries(MILESTONE_STATUS_LABEL).map(([value, label]) => (
                  <option key={value} value={value}>{label}</option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor={`${idPrefix}-actual`} className="block text-xs font-medium text-gray-700">실제일</label>
              <input id={`${idPrefix}-actual`} type="date" {...register('actualDate')} className={inputClass} />
            </div>
          </>
        )}
      </div>

      {dateChanged && (
        <div className="rounded-md border border-amber-200 bg-amber-50 p-3">
          <p className="text-xs text-amber-800">
            계획일 변경: <strong>{formatDate(originalDate)}</strong> → <strong>{formatDate(watchedDate || null)}</strong>
          </p>
          <label htmlFor={`${idPrefix}-reason`} className="mt-2 block text-xs font-medium text-gray-700">
            변경 사유 <span className="text-red-500">*</span>
          </label>
          <textarea id={`${idPrefix}-reason`} rows={2} {...register('reason')} className={inputClass} />
          <FormError message={errors.reason?.message} />
        </div>
      )}

      {active.error != null && (
        <p role="alert" className="rounded-md bg-red-50 px-3 py-2 text-xs text-red-600">
          {toErrorMessage(active.error)}
        </p>
      )}

      <div className="flex justify-end gap-2">
        <button type="button" onClick={onDone} className={secondaryButtonClass}>취소</button>
        <button type="submit" disabled={active.isPending} className={primaryButtonClass}>
          {active.isPending ? '저장 중…' : isEdit ? '저장' : '추가'}
        </button>
      </div>
    </form>
  )
}
