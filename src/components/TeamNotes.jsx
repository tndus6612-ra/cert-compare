import { useEffect, useMemo, useState } from 'react'
import { supabase } from '../lib/supabaseClient'

const FUNCTION_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/add-note`
const PIN_STORAGE_KEY = 'certCompareTeamPin'

function formatDate(iso) {
  const d = new Date(iso)
  return `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, '0')}.${String(d.getDate()).padStart(2, '0')}`
}

function formatNumber(n) {
  return Number(n).toLocaleString('ko-KR', { maximumFractionDigits: 1 })
}

// 정부수수료 텍스트 맨 앞의 통화 표기만 뽑아냄 (예: "KRW 130,000" -> "KRW", "약 $400" -> "$")
function extractCurrencyLabel(feeStr) {
  if (!feeStr) return ''
  const cleaned = feeStr.replace(/^약\s*/, '')
  const match = cleaned.match(/^[^\d]+/)
  return match ? match[0].trim() : ''
}

export default function TeamNotes({ entry }) {
  const [notes, setNotes] = useState([])
  const [loading, setLoading] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)
  const [pinKnown, setPinKnown] = useState(false)
  const [author, setAuthor] = useState('')
  const [pin, setPin] = useState('')
  const [actualMonths, setActualMonths] = useState('')
  const [actualFee, setActualFee] = useState('')
  const [note, setNote] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  const currencyLabel = useMemo(() => extractCurrencyLabel(entry.governmentFeeLocal), [entry.governmentFeeLocal])

  useEffect(() => {
    let cancelled = false
    async function load() {
      const { data, error } = await supabase
        .from('team_notes')
        .select('*')
        .eq('cert_id', entry.id)
        .order('created_at', { ascending: false })
      if (!cancelled) {
        if (!error) setNotes(data ?? [])
        setLoading(false)
      }
    }
    load()
    return () => {
      cancelled = true
    }
  }, [entry.id])

  const aggregate = useMemo(() => {
    const months = notes.map((n) => n.actual_months).filter((v) => v != null)
    const fees = notes.map((n) => n.actual_fee).filter((v) => v != null)
    return {
      avgMonths: months.length ? months.reduce((a, b) => a + b, 0) / months.length : null,
      monthsCount: months.length,
      avgFee: fees.length ? fees.reduce((a, b) => a + b, 0) / fees.length : null,
      feesCount: fees.length,
    }
  }, [notes])

  function openModal() {
    const saved = localStorage.getItem(PIN_STORAGE_KEY)
    if (saved) {
      setPin(saved)
      setPinKnown(true)
    } else {
      setPin('')
      setPinKnown(false)
    }
    setModalOpen(true)
  }

  const summaryParts = []
  if (aggregate.avgMonths != null) summaryParts.push(`약 ${aggregate.avgMonths.toFixed(1)}개월`)
  if (aggregate.avgFee != null) summaryParts.push(`${currencyLabel} ${formatNumber(aggregate.avgFee)}`.trim())
  const summaryText = summaryParts.join(' · ')

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
          cert_id: entry.id,
          author,
          note,
          actual_months: actualMonths === '' ? null : actualMonths,
          actual_fee: actualFee === '' ? null : actualFee,
        }),
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
      setNotes((prev) => [body.data, ...prev])
      setAuthor('')
      setActualMonths('')
      setActualFee('')
      setNote('')
    } catch {
      setError('네트워크 오류로 저장하지 못했습니다')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="mt-2 flex items-center gap-2 text-xs">
      {!loading && notes.length > 0 ? (
        <>
          <span className="rounded-full bg-amber-100 px-2 py-0.5 font-medium text-amber-800">
            팀 실제경험{summaryText && ` · ${summaryText}`} ({notes.length}건)
          </span>
          <button
            onClick={openModal}
            className="font-medium text-amber-700 underline decoration-dotted hover:text-amber-900"
          >
            이력보기
          </button>
        </>
      ) : (
        <button
          onClick={openModal}
          className="font-medium text-slate-400 underline decoration-dotted hover:text-slate-600"
        >
          + 실제경험 기록하기
        </button>
      )}

      {modalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
          onClick={() => setModalOpen(false)}
        >
          <div
            className="max-h-[85vh] w-full max-w-lg overflow-y-auto rounded-xl bg-white p-5 text-left shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-2">
              <div>
                <h3 className="text-base font-bold text-slate-900">{entry.country}</h3>
                <p className="text-xs text-slate-400">{entry.productClass} · 우리 팀 실제 경험</p>
              </div>
              <button onClick={() => setModalOpen(false)} className="text-lg text-slate-400 hover:text-slate-600">
                ✕
              </button>
            </div>

            {(aggregate.avgMonths != null || aggregate.avgFee != null) && (
              <div className="mt-3 rounded-lg bg-amber-50 p-2.5 text-xs text-amber-800">
                {aggregate.avgMonths != null && (
                  <p>
                    실제 평균 심사기간: 약 {aggregate.avgMonths.toFixed(1)}개월 ({aggregate.monthsCount}건 기준, 공개자료 추정치:{' '}
                    {entry.periodDescription})
                  </p>
                )}
                {aggregate.avgFee != null && (
                  <p>
                    실제 평균 수수료: {currencyLabel} {formatNumber(aggregate.avgFee)} ({aggregate.feesCount}건 기준, 공개자료 추정치:{' '}
                    {entry.governmentFeeLocal})
                  </p>
                )}
              </div>
            )}

            <ul className="mt-3 divide-y divide-slate-100">
              {notes.length === 0 && !loading && (
                <li className="py-2 text-sm text-slate-400">아직 기록된 경험이 없어요. 처음으로 남겨보세요.</li>
              )}
              {notes.map((n) => (
                <li key={n.id} className="py-2 text-sm first:pt-0">
                  <div className="flex items-center gap-2 text-xs text-slate-400">
                    <span className="font-medium text-slate-700">{n.author}</span>
                    <span>{formatDate(n.created_at)}</span>
                  </div>
                  {(n.actual_months != null || n.actual_fee != null) && (
                    <div className="mt-0.5 flex flex-wrap gap-x-3 text-xs text-slate-600">
                      {n.actual_months != null && <span>실제기간: 약 {n.actual_months}개월</span>}
                      {n.actual_fee != null && (
                        <span>
                          실제수수료: {currencyLabel} {formatNumber(n.actual_fee)}
                        </span>
                      )}
                    </div>
                  )}
                  {n.note && <p className="mt-0.5 text-slate-700">{n.note}</p>}
                </li>
              ))}
            </ul>

            <form onSubmit={handleSubmit} className="mt-4 space-y-1.5 border-t border-slate-100 pt-3">
              <div className="flex items-center justify-between">
                <p className="text-xs font-semibold text-slate-500">새 경험 추가</p>
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
                  value={author}
                  onChange={(e) => setAuthor(e.target.value)}
                  required
                  className={pinKnown ? 'w-full rounded border border-slate-200 px-2 py-1 text-xs focus:outline-none' : 'w-1/2 rounded border border-slate-200 px-2 py-1 text-xs focus:outline-none'}
                />
                {!pinKnown && (
                  <input
                    type="password"
                    placeholder="팀 PIN (최초 1회만 입력)"
                    value={pin}
                    onChange={(e) => setPin(e.target.value)}
                    required
                    className="w-1/2 rounded border border-slate-200 px-2 py-1 text-xs focus:outline-none"
                  />
                )}
              </div>
              <div className="flex gap-1.5">
                <input
                  type="number"
                  step="0.1"
                  placeholder="실제 소요기간(개월)"
                  value={actualMonths}
                  onChange={(e) => setActualMonths(e.target.value)}
                  className="w-1/2 rounded border border-slate-200 px-2 py-1 text-xs focus:outline-none"
                />
                <input
                  type="number"
                  placeholder={`실제 수수료(${currencyLabel || '숫자만'})`}
                  value={actualFee}
                  onChange={(e) => setActualFee(e.target.value)}
                  className="w-1/2 rounded border border-slate-200 px-2 py-1 text-xs focus:outline-none"
                />
              </div>
              <textarea
                placeholder="코멘트 (선택)"
                value={note}
                onChange={(e) => setNote(e.target.value)}
                rows={2}
                className="w-full rounded border border-slate-200 px-2 py-1 text-xs focus:outline-none"
              />
              {error && <p className="text-xs text-red-600">{error}</p>}
              <button
                type="submit"
                disabled={submitting}
                className="rounded bg-amber-600 px-2.5 py-1 text-xs font-medium text-white hover:bg-amber-700 disabled:opacity-50"
              >
                {submitting ? '저장 중...' : '저장'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
