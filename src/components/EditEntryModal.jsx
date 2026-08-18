import { useState } from 'react'
import { createPortal } from 'react-dom'
import { REGION_ORDER } from '../lib/certUtils'
import { PIN_STORAGE_KEY } from '../lib/teamPin'

const FUNCTION_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/edit-entry`

function toFormState(entry) {
  return {
    region: entry.region,
    country: entry.country,
    authority: entry.authority,
    applicationType: entry.applicationType,
    productClass: entry.productClass,
    monthsApprox: entry.monthsApprox ?? '',
    periodDescription: entry.periodDescription,
    governmentFeeLocal: entry.governmentFeeLocal,
    validity: entry.validity ?? '',
    notes: entry.notes ?? '',
    source: entry.source,
  }
}

export default function EditEntryModal({ entry, onSaved }) {
  const [open, setOpen] = useState(false)
  const [pinKnown, setPinKnown] = useState(false)
  const [pin, setPin] = useState('')
  const [form, setForm] = useState(() => toFormState(entry))
  const [editedBy, setEditedBy] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  function openModal() {
    const saved = localStorage.getItem(PIN_STORAGE_KEY)
    setPin(saved ?? '')
    setPinKnown(Boolean(saved))
    setForm(toFormState(entry))
    setError('')
    setSuccess(false)
    setOpen(true)
  }

  function update(field, value) {
    setForm((prev) => ({ ...prev, [field]: value }))
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
        body: JSON.stringify({ ...form, pin, id: entry.id, isCustom: Boolean(entry.custom), editedBy }),
      })
      const body = await res.json()
      if (!res.ok) {
        setError(body.error ?? '저장에 실패했습니다')
        if (body.error?.includes('PIN')) {
          localStorage.removeItem(PIN_STORAGE_KEY)
          setPinKnown(false)
          setPin('')
        }
        return
      }
      localStorage.setItem(PIN_STORAGE_KEY, pin)
      setPinKnown(true)
      setSuccess(true)
      onSaved?.(body.data, body.isCustom)
    } catch {
      setError('네트워크 오류로 저장하지 못했습니다')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <>
      <button
        onClick={openModal}
        className="rounded border border-slate-200 px-1.5 py-0.5 text-xs text-slate-500 hover:bg-slate-50"
        title="이 항목 수정"
      >
        ✏️ 수정
      </button>

      {open &&
        createPortal(
          <div className="fixed inset-0 z-50 overflow-y-auto bg-black/40" onClick={() => setOpen(false)}>
            <div className="flex min-h-full items-center justify-center p-4">
              <div
                className="w-full max-w-lg rounded-xl bg-white p-5 text-left shadow-xl"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h3 className="text-base font-bold text-slate-900">항목 수정</h3>
                    <p className="text-xs text-slate-400">
                      {entry.country} · {entry.productClass}
                      {!entry.custom && ' (공개자료 원본 위에 수정 내역이 표시돼요)'}
                    </p>
                  </div>
                  <button onClick={() => setOpen(false)} className="text-lg text-slate-400 hover:text-slate-600">
                    ✕
                  </button>
                </div>

                {success ? (
                  <div className="mt-4 rounded-lg bg-emerald-50 p-3 text-sm text-emerald-800">
                    수정했어요! 화면에 바로 반영됩니다.
                    <button
                      onClick={() => setOpen(false)}
                      className="mt-2 block rounded bg-emerald-600 px-2.5 py-1 text-xs font-medium text-white hover:bg-emerald-700"
                    >
                      닫기
                    </button>
                  </div>
                ) : (
                  <form onSubmit={handleSubmit} className="mt-4 space-y-2">
                    <div className="flex gap-1.5">
                      <select
                        value={form.region}
                        onChange={(e) => update('region', e.target.value)}
                        className="w-1/2 rounded border border-slate-200 px-2 py-1 text-xs focus:outline-none"
                      >
                        {REGION_ORDER.map((r) => (
                          <option key={r} value={r}>
                            {r}
                          </option>
                        ))}
                      </select>
                      <input
                        type="text"
                        placeholder="국가명"
                        value={form.country}
                        onChange={(e) => update('country', e.target.value)}
                        required
                        className="w-1/2 rounded border border-slate-200 px-2 py-1 text-xs focus:outline-none"
                      />
                    </div>
                    <div className="flex gap-1.5">
                      <input
                        type="text"
                        placeholder="인증기관"
                        value={form.authority}
                        onChange={(e) => update('authority', e.target.value)}
                        required
                        className="w-1/2 rounded border border-slate-200 px-2 py-1 text-xs focus:outline-none"
                      />
                      <input
                        type="text"
                        placeholder="신청유형"
                        value={form.applicationType}
                        onChange={(e) => update('applicationType', e.target.value)}
                        required
                        className="w-1/2 rounded border border-slate-200 px-2 py-1 text-xs focus:outline-none"
                      />
                    </div>
                    <input
                      type="text"
                      placeholder="제품등급"
                      value={form.productClass}
                      onChange={(e) => update('productClass', e.target.value)}
                      required
                      className="w-full rounded border border-slate-200 px-2 py-1 text-xs focus:outline-none"
                    />
                    <div className="flex gap-1.5">
                      <input
                        type="text"
                        placeholder="심사기간 설명"
                        value={form.periodDescription}
                        onChange={(e) => update('periodDescription', e.target.value)}
                        required
                        className="w-1/2 rounded border border-slate-200 px-2 py-1 text-xs focus:outline-none"
                      />
                      <input
                        type="number"
                        step="0.1"
                        placeholder="약 개월수 (선택)"
                        value={form.monthsApprox}
                        onChange={(e) => update('monthsApprox', e.target.value)}
                        className="w-1/2 rounded border border-slate-200 px-2 py-1 text-xs focus:outline-none"
                      />
                    </div>
                    <div className="flex gap-1.5">
                      <input
                        type="text"
                        placeholder="정부수수료"
                        value={form.governmentFeeLocal}
                        onChange={(e) => update('governmentFeeLocal', e.target.value)}
                        required
                        className="w-1/2 rounded border border-slate-200 px-2 py-1 text-xs focus:outline-none"
                      />
                      <input
                        type="text"
                        placeholder="유효기간"
                        value={form.validity}
                        onChange={(e) => update('validity', e.target.value)}
                        required
                        className="w-1/2 rounded border border-slate-200 px-2 py-1 text-xs focus:outline-none"
                      />
                    </div>
                    <textarea
                      placeholder="비고 (선택)"
                      value={form.notes}
                      onChange={(e) => update('notes', e.target.value)}
                      rows={2}
                      className="w-full rounded border border-slate-200 px-2 py-1 text-xs focus:outline-none"
                    />
                    <input
                      type="text"
                      placeholder="출처"
                      value={form.source}
                      onChange={(e) => update('source', e.target.value)}
                      required
                      className="w-full rounded border border-slate-200 px-2 py-1 text-xs focus:outline-none"
                    />

                    <div className="flex items-center justify-between border-t border-slate-100 pt-2">
                      <p className="text-xs font-semibold text-slate-500">수정 정보</p>
                      {pinKnown && (
                        <button
                          type="button"
                          onClick={() => {
                            localStorage.removeItem(PIN_STORAGE_KEY)
                            setPinKnown(false)
                            setPin('')
                          }}
                          className="text-xs text-slate-400 underline decoration-dotted hover:text-slate-600"
                        >
                          PIN 다시 입력
                        </button>
                      )}
                    </div>
                    <div className="flex gap-1.5">
                      <input
                        type="text"
                        placeholder="수정자 이름"
                        value={editedBy}
                        onChange={(e) => setEditedBy(e.target.value)}
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
                          placeholder="팀 PIN (최초 1회만)"
                          value={pin}
                          onChange={(e) => setPin(e.target.value)}
                          required
                          className="w-1/2 rounded border border-slate-200 px-2 py-1 text-xs focus:outline-none"
                        />
                      )}
                    </div>

                    {error && <p className="text-xs text-red-600">{error}</p>}
                    <button
                      type="submit"
                      disabled={submitting}
                      className="w-full rounded bg-slate-800 px-2.5 py-1.5 text-xs font-medium text-white hover:bg-slate-900 disabled:opacity-50"
                    >
                      {submitting ? '저장 중...' : '수정 저장'}
                    </button>
                  </form>
                )}
              </div>
            </div>
          </div>,
          document.body,
        )}
    </>
  )
}
