import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { IconHistory, IconX } from '@tabler/icons-react'
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
  const [open, setOpen] = useState(false)

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

  return (
    <div className="mb-6">
      <button
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-50"
      >
        <IconHistory size={14} />
        최근 변경사항
        {items.length > 0 && (
          <span className="rounded-full bg-slate-100 px-1.5 py-0.5 text-[10px] font-semibold text-slate-500">
            {items.length}
          </span>
        )}
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
                  <h3 className="text-base font-bold text-slate-900">최근 변경사항</h3>
                  <button onClick={() => setOpen(false)} className="text-slate-400 hover:text-slate-600">
                    <IconX size={20} />
                  </button>
                </div>

                <ul className="mt-3 max-h-[60vh] divide-y divide-slate-100 overflow-y-auto">
                  {items.length === 0 && <li className="py-3 text-sm text-slate-400">아직 변경사항이 없어요.</li>}
                  {items.map((h) => {
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
              </div>
            </div>
          </div>,
          document.body,
        )}
    </div>
  )
}
