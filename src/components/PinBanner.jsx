import { useState } from 'react'
import { PIN_STORAGE_KEY, PIN_DISMISS_KEY } from '../lib/teamPin'

export default function PinBanner() {
  const [visible, setVisible] = useState(
    () => !localStorage.getItem(PIN_STORAGE_KEY) && !localStorage.getItem(PIN_DISMISS_KEY),
  )
  const [pin, setPin] = useState('')

  if (!visible) return null

  function handleSave(e) {
    e.preventDefault()
    if (!pin.trim()) return
    localStorage.setItem(PIN_STORAGE_KEY, pin.trim())
    setVisible(false)
  }

  function handleSkip() {
    localStorage.setItem(PIN_DISMISS_KEY, '1')
    setVisible(false)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-sm rounded-2xl bg-white p-6 text-center shadow-2xl">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-amber-100 text-2xl">🔑</div>
        <h2 className="mt-3 text-lg font-bold text-slate-900">RA팀이신가요?</h2>
        <p className="mt-1 text-sm text-slate-500">
          실제경험 메모를 남기려면 팀 PIN을 한 번만 입력해두세요.
          <br />
          입력 안 해도 사이트는 그대로 볼 수 있어요.
        </p>
        <form onSubmit={handleSave} className="mt-4 space-y-2">
          <input
            type="password"
            autoFocus
            value={pin}
            onChange={(e) => setPin(e.target.value)}
            placeholder="팀 PIN"
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-center text-sm focus:border-amber-400 focus:outline-none"
          />
          <button
            type="submit"
            className="w-full rounded-lg bg-amber-600 py-2 text-sm font-semibold text-white hover:bg-amber-700"
          >
            확인
          </button>
        </form>
        <button
          onClick={handleSkip}
          className="mt-3 text-xs text-slate-400 underline decoration-dotted hover:text-slate-600"
        >
          나중에 할게요 (그냥 둘러보기)
        </button>
      </div>
    </div>
  )
}
