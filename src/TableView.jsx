import { useMemo, useState } from 'react'
import Badge from './components/Badge'
import EditEntryModal from './components/EditEntryModal'
import DeleteEntryModal from './components/DeleteEntryModal'
import HistoryModal from './components/HistoryModal'
import { downloadEntriesAsCsv } from './lib/csvExport'
import { getFreshnessStatus } from './lib/freshness'
import { getCountryFlag } from './lib/certUtils'

const COLUMNS = [
  { key: 'region', label: '지역', filterable: true },
  { key: 'country', label: '국가' },
  { key: 'authority', label: '인증기관', filterable: true },
  { key: 'applicationType', label: '신청유형', filterable: true },
  { key: 'productClass', label: '제품등급' },
  { key: 'monthsApprox', label: '심사기간' },
  { key: 'governmentFeeLocal', label: '정부수수료' },
  { key: 'validity', label: '유효기간' },
  { key: 'notes', label: '비고' },
  { key: 'source', label: '출처' },
  { key: 'lastVerified', label: '최신성' },
]

const FILTERABLE_KEYS = COLUMNS.filter((c) => c.filterable).map((c) => c.key)

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
    case 'country':
      return (
        <span>
          {getCountryFlag(entry.country) && <span className="mr-1">{getCountryFlag(entry.country)}</span>}
          {entry.country}
        </span>
      )
    case 'applicationType':
      return <Badge applicationType={entry.applicationType} />
    case 'productClass':
      return (
        <span>
          {entry.productClass}
          {entry.custom && (
            <span className="ml-1.5 rounded-full bg-violet-100 px-1.5 py-0.5 text-[10px] font-medium text-violet-700">
              팀 추가
            </span>
          )}
          {entry.edited && (
            <span className="ml-1.5 rounded-full bg-sky-100 px-1.5 py-0.5 text-[10px] font-medium text-sky-700">
              수정됨
            </span>
          )}
        </span>
      )
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
    case 'lastVerified': {
      if (!entry.lastVerified) return '-'
      const freshness = getFreshnessStatus(entry.lastVerified)
      return <span className={`whitespace-nowrap rounded-full px-1.5 py-0.5 text-[10px] font-medium ${freshness.className}`}>{freshness.label}</span>
    }
    default:
      return entry[key]
  }
}

const EMPTY_COLUMN_FILTERS = Object.fromEntries(FILTERABLE_KEYS.map((key) => [key, '전체']))

export default function TableView({ filtered, onEntryUpdated, onEntryDeleted }) {
  const [sort, setSort] = useState({ key: null, direction: 'asc' })
  const [columnFilters, setColumnFilters] = useState(EMPTY_COLUMN_FILTERS)

  const columnFilterOptions = useMemo(() => {
    const options = {}
    for (const key of FILTERABLE_KEYS) {
      options[key] = [...new Set(filtered.map((e) => e[key]))].sort((a, b) => a.localeCompare(b, 'ko'))
    }
    return options
  }, [filtered])

  const columnFiltered = useMemo(() => {
    return filtered.filter((entry) => FILTERABLE_KEYS.every((key) => columnFilters[key] === '전체' || entry[key] === columnFilters[key]))
  }, [filtered, columnFilters])

  const sorted = useMemo(() => {
    if (sort.key == null) return columnFiltered
    const copy = [...columnFiltered]
    copy.sort((a, b) => compareValues(a, b, sort.key) * (sort.direction === 'asc' ? 1 : -1))
    return copy
  }, [columnFiltered, sort])

  function handleSort(key) {
    setSort((prev) => (prev.key === key ? { key, direction: prev.direction === 'asc' ? 'desc' : 'asc' } : { key, direction: 'asc' }))
  }

  function handleColumnFilterChange(key, value) {
    setColumnFilters((prev) => ({ ...prev, [key]: value }))
  }

  if (filtered.length === 0) {
    return <p className="py-16 text-center text-sm text-slate-400">조건에 맞는 항목이 없습니다.</p>
  }

  return (
    <div>
      <div className="mb-3 flex justify-end">
        <button
          onClick={() => downloadEntriesAsCsv(sorted)}
          className="rounded-lg border border-slate-300 px-3 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-50"
        >
          ⬇️ CSV 다운로드 ({sorted.length}건)
        </button>
      </div>
      <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-sm">
      {columnFiltered.length === 0 ? (
        <p className="py-16 text-center text-sm text-slate-400">필터 조건에 맞는 항목이 없습니다.</p>
      ) : (
      <table className="min-w-full divide-y divide-slate-200 text-sm">
        <thead className="bg-slate-50">
          <tr>
            {COLUMNS.map((col) => (
              <th
                key={col.key}
                className="whitespace-nowrap px-3 py-2 text-left text-xs font-semibold text-slate-500"
              >
                <span
                  onClick={() => handleSort(col.key)}
                  className="inline-flex cursor-pointer select-none items-center gap-1 rounded px-1 py-0.5 hover:bg-slate-100"
                >
                  {col.label}
                  <SortArrow active={sort.key === col.key} direction={sort.direction} />
                </span>
                {col.filterable && (
                  <select
                    value={columnFilters[col.key]}
                    onChange={(e) => handleColumnFilterChange(col.key, e.target.value)}
                    onClick={(e) => e.stopPropagation()}
                    className="mt-1 block w-full max-w-[8rem] rounded border border-slate-200 bg-white px-1 py-0.5 text-[11px] font-normal text-slate-600"
                  >
                    <option value="전체">전체</option>
                    {columnFilterOptions[col.key]?.map((value) => (
                      <option key={value} value={value}>
                        {value}
                      </option>
                    ))}
                  </select>
                )}
              </th>
            ))}
            <th className="whitespace-nowrap px-3 py-2 text-left text-xs font-semibold text-slate-500">관리</th>
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
              <td className="px-3 py-2 align-top">
                <div className="flex flex-wrap gap-1">
                  <EditEntryModal entry={entry} onSaved={onEntryUpdated} />
                  <HistoryModal entry={entry} />
                  <DeleteEntryModal entry={entry} onDeleted={onEntryDeleted} />
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      )}
      </div>
    </div>
  )
}
