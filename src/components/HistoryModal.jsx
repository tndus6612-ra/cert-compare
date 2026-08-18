import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { supabase } from '../lib/supabaseClient'

const ACTION_LABEL = {
  add: { text: '추가됨', className: 'bg-violet-100 text-violet-700' },
  edit: { text: '수정됨', className: 'bg-sky-100 text-sky-700' },
  delete: { text: '삭제됨', className: 'bg-red-100 text-red-700' },
}

function formatDateTime(iso) {
  const d = new Date(iso)
  return `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, '0')}.${String(d.getDate()).padStart(2, '0')} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
}

export default function HistoryModal({ entry }) {
  const [open, setOpen] = useState(false)
  const [history, setHistory] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!open) return
    let cancelled = false
    setLoading(true)
    supabase
      .from('entry_history')
      .select('*')
      .eq('entry_id', entry.id)
      .order('changed_at', { ascending: false })
      .then(({ data, error }) => {
        if (!cancelled) {
          if (!error) setHistory(data ?? [])
          setLoading(false)
        }
      })
    return () => {
      cancelled = true
    }
  }, [open, entry.id])

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="rounded border border-slate-200 px-1.5 py-0.5 text-xs text-slate-500 hover:bg-slate-50"
        title="변경 이력 보기"
      >
        🕓 이력
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
                    <h3 className="text-base font-bold text-slate-900">변경 이력</h3>
                    <p className="text-xs text-slate-400">
                      {entry.country} · {entry.productClass}
                    </p>
                  </div>
                  <button onClick={() => setOpen(false)} className="text-lg text-slate-400 hover:text-slate-600">
                    ✕
                  </button>
                </div>

                <ul className="mt-3 max-h-[60vh] divide-y divide-slate-100 overflow-y-auto">
                  {!loading && history.length === 0 && (
                    <li className="py-3 text-sm text-slate-400">아직 기록된 변경 이력이 없어요.</li>
                  )}
                  {history.map((h) => {
                    const label = ACTION_LABEL[h.action] ?? { text: h.action, className: 'bg-slate-100 text-slate-600' }
                    const snap = h.snapshot ?? {}
                    return (
                      <li key={h.id} className="py-2.5 text-sm">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${label.className}`}>
                            {label.text}
                          </span>
                          <span className="font-medium text-slate-700">{h.changed_by}</span>
                          <span className="text-xs text-slate-400">{formatDateTime(h.changed_at)}</span>
                        </div>
                        <dl className="mt-1 grid grid-cols-1 gap-x-3 gap-y-0.5 text-xs text-slate-500 sm:grid-cols-2">
                          {snap.period_description && (
                            <div className="flex gap-1">
                              <dt className="shrink-0">심사기간:</dt>
                              <dd>{snap.period_description}</dd>
                            </div>
                          )}
                          {snap.government_fee_local && (
                            <div className="flex gap-1">
                              <dt className="shrink-0">수수료:</dt>
                              <dd>{snap.government_fee_local}</dd>
                            </div>
                          )}
                          {snap.validity && (
                            <div className="flex gap-1">
                              <dt className="shrink-0">유효기간:</dt>
                              <dd>{snap.validity}</dd>
                            </div>
                          )}
                        </dl>
                      </li>
                    )
                  })}
                </ul>
              </div>
            </div>
          </div>,
          document.body,
        )}
    </>
  )
}
