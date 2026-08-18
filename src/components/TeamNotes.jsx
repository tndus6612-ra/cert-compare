import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabaseClient'

const FUNCTION_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/add-note`

function formatDate(iso) {
  const d = new Date(iso)
  return `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, '0')}.${String(d.getDate()).padStart(2, '0')}`
}

export default function TeamNotes({ certId }) {
  const [notes, setNotes] = useState([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [author, setAuthor] = useState('')
  const [pin, setPin] = useState('')
  const [note, setNote] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    let cancelled = false
    async function load() {
      const { data, error } = await supabase
        .from('team_notes')
        .select('*')
        .eq('cert_id', certId)
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
  }, [certId])

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
        body: JSON.stringify({ pin, cert_id: certId, author, note }),
      })
      const body = await res.json()
      if (!res.ok) {
        setError(body.error ?? '저장에 실패했습니다')
        return
      }
      setNotes((prev) => [body.data, ...prev])
      setNote('')
      setPin('')
      setShowForm(false)
    } catch {
      setError('네트워크 오류로 저장하지 못했습니다')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="mt-2 rounded-lg bg-amber-50/60 p-2.5">
      <div className="flex items-center justify-between">
        <h4 className="text-xs font-semibold text-amber-800">우리 팀 실제 경험 {notes.length > 0 && `(${notes.length})`}</h4>
        <button
          onClick={() => setShowForm((v) => !v)}
          className="text-xs font-medium text-amber-700 underline decoration-dotted hover:text-amber-900"
        >
          {showForm ? '닫기' : '+ 메모 추가'}
        </button>
      </div>

      {!loading && notes.length > 0 && (
        <ul className="mt-1.5 space-y-1.5">
          {notes.map((n) => (
            <li key={n.id} className="text-xs text-amber-900">
              <span className="font-medium">{n.author}</span>
              <span className="ml-1 text-amber-500">({formatDate(n.created_at)})</span>
              <p className="text-amber-800">{n.note}</p>
            </li>
          ))}
        </ul>
      )}

      {showForm && (
        <form onSubmit={handleSubmit} className="mt-2 space-y-1.5">
          <div className="flex gap-1.5">
            <input
              type="text"
              placeholder="이름"
              value={author}
              onChange={(e) => setAuthor(e.target.value)}
              required
              className="w-24 rounded border border-amber-200 px-2 py-1 text-xs focus:outline-none"
            />
            <input
              type="password"
              placeholder="팀 PIN"
              value={pin}
              onChange={(e) => setPin(e.target.value)}
              required
              className="w-24 rounded border border-amber-200 px-2 py-1 text-xs focus:outline-none"
            />
          </div>
          <textarea
            placeholder="실제 경험 내용을 적어주세요"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            required
            rows={2}
            className="w-full rounded border border-amber-200 px-2 py-1 text-xs focus:outline-none"
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
      )}
    </div>
  )
}
