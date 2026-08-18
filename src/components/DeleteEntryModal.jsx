import { useState } from 'react'
import { createPortal } from 'react-dom'
import { PIN_STORAGE_KEY } from '../lib/teamPin'

const FUNCTION_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/delete-entry`

export default function DeleteEntryModal({ entry, onDeleted }) {
  const [open, setOpen] = useState(false)
  const [pinKnown, setPinKnown] = useState(false)
  const [pin, setPin] = useState('')
  const [deletedBy, setDeletedBy] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  function openModal() {
    const saved = localStorage.getItem(PIN_STORAGE_KEY)
    setPin(saved ?? '')
    setPinKnown(Boolean(saved))
    setError('')
    setOpen(true)
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setSubmitting(true)
    try {
      const res = await fetch(FUNCTION_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
          apikey: import.meta.env.VITE_SUPABASE_ANON_KEY,
        },
        body: JSON.stringify({
          pin,
          id: entry.id,
          isCustom: Boolean(entry.custom),
          deletedBy,
          region: entry.region,
          country: entry.country,
          authority: entry.authority,
          applicationType: entry.applicationType,
          productClass: entry.productClass,
          monthsApprox: entry.monthsApprox,
          periodDescription: entry.periodDescription,
          governmentFeeLocal: entry.governmentFeeLocal,
          validity: entry.validity,
          notes: entry.notes,
          source: entry.source,
        }),
      })
      const body = await res.json()
      if (!res.ok) {
        setError(body.error ?? '삭제에 실패했습니다')
        if (body.error?.includes('PIN')) {
          localStorage.removeItem(PIN_STORAGE_KEY)
          setPinKnown(false)
          setPin('')
        }
        return
      }
      localStorage.setItem(PIN_STORAGE_KEY, pin)
      setOpen(false)
      onDeleted?.(entry.id, Boolean(entry.custom))
    } catch {
      setError('네트워크 오류로 삭제하지 못했습니다')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <>
      <button
        onClick={openModal}
        className="rounded border border-red-200 px-1.5 py-0.5 text-xs text-red-500 hover:bg-red-50"
        title="이 항목 삭제"
      >
        🗑️ 삭제
      </button>

      {open &&
        createPortal(
          <div className="fixed inset-0 z-50 overflow-y-auto bg-black/40" onClick={() => setOpen(false)}>
            <div className="flex min-h-full items-center justify-center p-4">
              <div
                className="w-full max-w-sm rounded-xl bg-white p-5 text-left shadow-xl"
                onClick={(e) => e.stopPropagation()}
              >
                <h3 className="text-base font-bold text-slate-900">항목 삭제</h3>
                <p className="mt-1 text-sm text-slate-500">
                  <span className="font-medium text-slate-700">
                    {entry.country} · {entry.productClass}
                  </span>
                  {entry.custom
                    ? ' 항목을 완전히 삭제할까요? 되돌릴 수 없어요.'
                    : ' 항목을 화면에서 숨길까요? (원본 자료는 그대로 남고, 이력에서 복원 가능해요)'}
                </p>

                <form onSubmit={handleSubmit} className="mt-4 space-y-2">
                  <div className="flex gap-1.5">
                    <input
                      type="text"
                      placeholder="이름"
                      value={deletedBy}
                      onChange={(e) => setDeletedBy(e.target.value)}
                      required
                      className={
                        pinKnown
                          ? 'w-full rounded border border-slate-200 px-2 py-1 text-xs focus:outline-none'
                          : 'w-1/2 rounded border border-slate-200 px-2 py-1 text-xs focus:outline-none'
                      }
                    />
                    {!pinKnown && (
                      <input
                        type="password"
                        placeholder="팀 PIN"
                        value={pin}
                        onChange={(e) => setPin(e.target.value)}
                        required
                        className="w-1/2 rounded border border-slate-200 px-2 py-1 text-xs focus:outline-none"
                      />
                    )}
                  </div>
                  {error && <p className="text-xs text-red-600">{error}</p>}
                  <div className="flex gap-1.5">
                    <button
                      type="button"
                      onClick={() => setOpen(false)}
                      className="w-1/2 rounded border border-slate-200 px-2.5 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-50"
                    >
                      취소
                    </button>
                    <button
                      type="submit"
                      disabled={submitting}
                      className="w-1/2 rounded bg-red-600 px-2.5 py-1.5 text-xs font-medium text-white hover:bg-red-700 disabled:opacity-50"
                    >
                      {submitting ? '삭제 중...' : '삭제 확인'}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>,
          document.body,
        )}
    </>
  )
}
