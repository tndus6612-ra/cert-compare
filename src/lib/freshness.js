// 원본 데이터셋을 전체적으로 조사·검증한 기준일.
// 이 이후로 팀이 직접 수정/추가한 항목은 그 시점을 기준으로 계산한다.
export const BASELINE_VERIFIED_DATE = '2026-08-18'

const MS_PER_MONTH = 1000 * 60 * 60 * 24 * 30

export function monthsSince(iso) {
  const diffMs = Date.now() - new Date(iso).getTime()
  return Math.floor(diffMs / MS_PER_MONTH)
}

export function getFreshnessStatus(lastVerifiedIso) {
  const months = monthsSince(lastVerifiedIso)
  if (months < 6) {
    return { level: 'fresh', label: '최신', className: 'bg-emerald-100 text-emerald-700' }
  }
  if (months < 12) {
    return { level: 'warning', label: `${months}개월 경과`, className: 'bg-amber-100 text-amber-700' }
  }
  return { level: 'stale', label: '재확인 필요', className: 'bg-red-100 text-red-700' }
}
