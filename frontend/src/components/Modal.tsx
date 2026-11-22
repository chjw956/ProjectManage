import { useEffect, useId } from 'react'

interface ModalProps {
  title: React.ReactNode
  subtitle?: React.ReactNode
  onClose: () => void
  children: React.ReactNode
  footer?: React.ReactNode
  /** Tailwind max-width 클래스 (기본 max-w-lg) */
  widthClass?: string
}

/** 공용 모달 틀: 배경 클릭·Esc·닫기(X)로 닫히고, 제목을 dialog의 접근 가능한 이름으로 쓴다. */
export function Modal({ title, subtitle, onClose, children, footer, widthClass = 'max-w-lg' }: ModalProps) {
  const titleId = useId()

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [onClose])

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={onClose}>
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className={`flex max-h-[85vh] w-full ${widthClass} flex-col rounded-lg bg-white shadow-xl`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-4 border-b border-slate-100 px-6 py-4">
          <div className="min-w-0">
            {subtitle && <p className="text-xs text-slate-500">{subtitle}</p>}
            <h2 id={titleId} className="mt-0.5 break-words text-base font-semibold text-slate-900">
              {title}
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="닫기"
            className="rounded p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
              <path d="M4 4L12 12M12 4L4 12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
          </button>
        </div>

        <div className="overflow-y-auto">{children}</div>

        {footer && (
          <div className="flex justify-end gap-2 border-t border-slate-100 px-6 py-4">{footer}</div>
        )}
      </div>
    </div>
  )
}

export const inputClass =
  'mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none'

export const primaryButtonClass =
  'rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50'

export const secondaryButtonClass =
  'rounded-md border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50'

export const dangerButtonClass =
  'rounded-md bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-50'

export function FormError({ message }: { message?: string | null }) {
  if (!message) return null
  return <p className="mt-1 text-xs text-red-500">{message}</p>
}

export function ServerError({ message }: { message?: string | null }) {
  if (!message) return null
  return (
    <p role="alert" className="mx-6 mb-4 rounded-md bg-red-50 px-3 py-2 text-xs text-red-600">
      {message}
    </p>
  )
}
