import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabaseClient'

const ACTION_LABEL = {
  add: { text: '추가됨', className: 'bg-violet-100 text-violet-700' },
  edit: { text: '수정됨', className: 'bg-sky-100 text-sky-700' },
  delete: { text: '삭제됨', className: 'bg-red-100 text-red-700' },
}

function timeAgo(iso) {
  const diffMs = Date.now() - new Date(iso).getTime()
  const min = Math.floor(diffMs / 60000)
  if (min < 1) return '방금 전'
  if (min < 60) return `${min}분 전`
  const hr = Math.floor(min / 60)
  if (hr < 24) return `${hr}시간 전`
  const day = Math.floor(hr / 24)
  if (day === 1) return '어제'
  if (day < 7) return `${day}일 전`
  const d = new Date(iso)
  return `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, '0')}.${String(d.getDate()).padStart(2, '0')}`
}

export default function RecentActivity() {
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [expanded, setExpanded] = useState(false)

  useEffect(() => {
    let cancelled = false
    supabase
      .from('entry_history')
      .select('*')
      .order('changed_at', { ascending: false })
      .limit(20)
      .then(({ data, error }) => {
        if (!cancelled) {
          if (!error) setItems(data ?? [])
          setLoading(false)
        }
      })
    return () => {
      cancelled = true
    }
  }, [])

  if (!loading && items.length === 0) return null

  const visible = expanded ? items : items.slice(0, 5)

  return (
    <section className="mb-6 rounded-xl border border-slate-200 bg-white p-4 sm:p-5">
      <h2 className="text-sm font-bold text-slate-900">최근 변경사항</h2>
      <ul className="mt-2 divide-y divide-slate-100">
        {visible.map((h) => {
          const label = ACTION_LABEL[h.action] ?? { text: h.action, className: 'bg-slate-100 text-slate-600' }
          const snap = h.snapshot ?? {}
          return (
            <li key={h.id} className="flex flex-wrap items-start justify-between gap-2 py-2.5 text-sm">
              <div className="flex items-start gap-2">
                <span className={`mt-0.5 shrink-0 rounded-full px-2 py-0.5 text-xs font-medium ${label.className}`}>
                  {label.text}
                </span>
                <div>
                  <p className="text-slate-800">
                    {h.country} · {h.product_class}
                  </p>
                  {h.action !== 'delete' && (snap.government_fee_local || snap.period_description) && (
                    <p className="text-xs text-slate-400">
                      {[snap.period_description, snap.government_fee_local].filter(Boolean).join(' · ')}
                    </p>
                  )}
                </div>
              </div>
              <div className="shrink-0 text-right text-xs text-slate-400">
                <p className="text-slate-600">{h.changed_by}</p>
                <p>{timeAgo(h.changed_at)}</p>
              </div>
            </li>
          )
        })}
      </ul>
      {items.length > 5 && (
        <button
          onClick={() => setExpanded((v) => !v)}
          className="mt-1 text-xs font-medium text-slate-500 underline decoration-dotted hover:text-slate-700"
        >
          {expanded ? '접기' : `더보기 (${items.length - 5}개 더)`}
        </button>
      )}
    </section>
  )
}
