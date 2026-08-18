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
    <div className="border-b border-amber-200 bg-amber-50 px-4 py-2 text-xs text-amber-800 sm:px-6">
      <form onSubmit={handleSave} className="mx-auto flex max-w-6xl flex-wrap items-center gap-2">
        <span>RA팀이신가요? 실제경험 메모를 남기려면 팀 PIN을 한 번만 입력해두세요.</span>
        <input
          type="password"
          value={pin}
          onChange={(e) => setPin(e.target.value)}
          placeholder="팀 PIN"
          className="rounded border border-amber-300 px-2 py-0.5 text-xs focus:outline-none"
        />
        <button
          type="submit"
          className="rounded bg-amber-600 px-2 py-0.5 font-medium text-white hover:bg-amber-700"
        >
          확인
        </button>
        <button type="button" onClick={handleSkip} className="text-amber-500 underline decoration-dotted hover:text-amber-700">
          나중에
        </button>
      </form>
    </div>
  )
}
