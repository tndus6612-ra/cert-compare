import { useMemo, useState } from 'react'
import Badge from './components/Badge'

const COLUMNS = [
  { key: 'region', label: '지역' },
  { key: 'country', label: '국가' },
  { key: 'authority', label: '인증기관' },
  { key: 'applicationType', label: '신청유형' },
  { key: 'productClass', label: '제품등급' },
  { key: 'monthsApprox', label: '심사기간' },
  { key: 'governmentFeeLocal', label: '정부수수료' },
  { key: 'validity', label: '유효기간' },
  { key: 'notes', label: '비고' },
  { key: 'source', label: '출처' },
]

// 값이 없는(null) 항목은 정렬 방향과 상관없이 항상 맨 뒤로 보낸다.
function compareValues(a, b, key) {
  const av = a[key]
  const bv = b[key]
  if (av == null && bv == null) return 0
  if (av == null) return 1
  if (bv == null) return -1
  if (typeof av === 'number' && typeof bv === 'number') return av - bv
  return String(av).localeCompare(String(bv), 'ko')
}

function SortArrow({ active, direction }) {
  if (!active) return <span className="text-slate-300">↕</span>
  return <span className="text-slate-700">{direction === 'asc' ? '↑' : '↓'}</span>
}

function renderCell(entry, key) {
  switch (key) {
    case 'applicationType':
      return <Badge applicationType={entry.applicationType} />
    case 'monthsApprox':
      return (
        <span>
          {entry.periodDescription}
          {entry.monthsApprox != null && <span className="ml-1 text-xs text-slate-400">(약 {entry.monthsApprox}개월)</span>}
        </span>
      )
    case 'governmentFeeLocal':
      return <span className="font-medium text-slate-800">{entry.governmentFeeLocal}</span>
    case 'validity':
      return entry.validity ?? '-'
    case 'notes':
      return entry.notes ?? '-'
    default:
      return entry[key]
  }
}

export default function TableView({ filtered }) {
  const [sort, setSort] = useState({ key: null, direction: 'asc' })

  const sorted = useMemo(() => {
    if (sort.key == null) return filtered
    const copy = [...filtered]
    copy.sort((a, b) => compareValues(a, b, sort.key) * (sort.direction === 'asc' ? 1 : -1))
    return copy
  }, [filtered, sort])

  function handleSort(key) {
    setSort((prev) => (prev.key === key ? { key, direction: prev.direction === 'asc' ? 'desc' : 'asc' } : { key, direction: 'asc' }))
  }

  if (filtered.length === 0) {
    return <p className="py-16 text-center text-sm text-slate-400">조건에 맞는 항목이 없습니다.</p>
  }

  return (
    <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-sm">
      <table className="min-w-full divide-y divide-slate-200 text-sm">
        <thead className="bg-slate-50">
          <tr>
            {COLUMNS.map((col) => (
              <th
                key={col.key}
                onClick={() => handleSort(col.key)}
                className="cursor-pointer select-none whitespace-nowrap px-3 py-2 text-left text-xs font-semibold text-slate-500 hover:bg-slate-100"
              >
                <span className="inline-flex items-center gap-1">
                  {col.label}
                  <SortArrow active={sort.key === col.key} direction={sort.direction} />
                </span>
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {sorted.map((entry) => (
            <tr key={entry.id} className="hover:bg-slate-50">
              {COLUMNS.map((col) => (
                <td key={col.key} className="max-w-[16rem] px-3 py-2 align-top text-slate-700">
                  {renderCell(entry, col.key)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
