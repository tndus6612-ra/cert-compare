import { useState } from 'react'
import { createPortal } from 'react-dom'
import { IconPlus, IconX } from '@tabler/icons-react'
import { REGION_ORDER } from '../lib/certUtils'
import { PIN_STORAGE_KEY } from '../lib/teamPin'

const FUNCTION_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/add-entry`

const EMPTY_FORM = {
  region: REGION_ORDER[0],
  country: '',
  authority: '',
  applicationType: '',
  productClass: '',
  monthsApprox: '',
  periodDescription: '',
  governmentFeeLocal: '',
  validity: '',
  notes: '',
  source: '',
  author: '',
}

export default function AddEntryModal({ onAdded }) {
  const [open, setOpen] = useState(false)
  const [pinKnown, setPinKnown] = useState(false)
  const [pin, setPin] = useState('')
  const [form, setForm] = useState(EMPTY_FORM)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  function openModal() {
    const saved = localStorage.getItem(PIN_STORAGE_KEY)
    setPin(saved ?? '')
    setPinKnown(Boolean(saved))
    setForm(EMPTY_FORM)
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
        body: JSON.stringify({ ...form, pin }),
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
      onAdded?.(body.data)
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
        className="inline-flex items-center gap-1 rounded-lg border border-slate-300 px-3 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-50"
      >
        <IconPlus size={14} /> 새 카드 추가
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
                <h3 className="text-base font-bold text-slate-900">새 카드 추가</h3>
                <p className="text-xs text-slate-400">
                  공개자료 조사와 별도로, 팀 경험을 바탕으로 새 항목을 추가할 수 있어요. "팀 추가" 배지로 구분되어 표시돼요.
                </p>
              </div>
              <button onClick={() => setOpen(false)} className="text-slate-400 hover:text-slate-600">
                <IconX size={20} />
              </button>
            </div>

            {success ? (
              <div className="mt-4 rounded-lg bg-emerald-50 p-3 text-sm text-emerald-800">
                저장했어요! 화면에 바로 반영됩니다.
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
                    placeholder="국가명 (예: 대한민국)"
                    value={form.country}
                    onChange={(e) => update('country', e.target.value)}
                    required
                    className="w-1/2 rounded border border-slate-200 px-2 py-1 text-xs focus:outline-none"
                  />
                </div>
                <div className="flex gap-1.5">
                  <input
                    type="text"
                    placeholder="인증기관 (예: MFDS)"
                    value={form.authority}
                    onChange={(e) => update('authority', e.target.value)}
                    required
                    className="w-1/2 rounded border border-slate-200 px-2 py-1 text-xs focus:outline-none"
                  />
                  <input
                    type="text"
                    placeholder="신청유형 (예: 변경)"
                    value={form.applicationType}
                    onChange={(e) => update('applicationType', e.target.value)}
                    required
                    className="w-1/2 rounded border border-slate-200 px-2 py-1 text-xs focus:outline-none"
                  />
                </div>
                <input
                  type="text"
                  placeholder="제품등급 (예: Class II 변경허가)"
                  value={form.productClass}
                  onChange={(e) => update('productClass', e.target.value)}
                  required
                  className="w-full rounded border border-slate-200 px-2 py-1 text-xs focus:outline-none"
                />
                <div className="flex gap-1.5">
                  <input
                    type="text"
                    placeholder="심사기간 설명 (예: 15 영업일)"
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
                    placeholder="정부수수료 (현지통화, 예: KRW 200,000)"
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
                  placeholder="출처 (예: 의료기기법 시행규칙 제65조)"
                  value={form.source}
                  onChange={(e) => update('source', e.target.value)}
                  required
                  className="w-full rounded border border-slate-200 px-2 py-1 text-xs focus:outline-none"
                />

                <div className="flex items-center justify-between border-t border-slate-100 pt-2">
                  <p className="text-xs font-semibold text-slate-500">작성 정보</p>
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
                    placeholder="이름"
                    value={form.author}
                    onChange={(e) => update('author', e.target.value)}
                    required
                    className={pinKnown ? 'w-full rounded border border-slate-200 px-2 py-1 text-xs focus:outline-none' : 'w-1/2 rounded border border-slate-200 px-2 py-1 text-xs focus:outline-none'}
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
                  {submitting ? '저장 중...' : '카드 저장'}
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
