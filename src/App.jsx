import { useEffect, useMemo, useState } from 'react'
import certData from '../cert_data.json'
import { REGION_ORDER, categorize, TYPE_FILTERS } from './lib/certUtils'
import { supabase } from './lib/supabaseClient'
import OverviewView from './OverviewView'
import TableView from './TableView'
import PinBanner from './components/PinBanner'
import AddEntryModal from './components/AddEntryModal'
import RecentActivity from './components/RecentActivity'
import EntryDetailModal from './components/EntryDetailModal'
import { BASELINE_VERIFIED_DATE } from './lib/freshness'

const VIEWS = [
  { key: 'overview', label: '한눈에 보기' },
  { key: 'table', label: '상세 테이블' },
]

function mapCustomEntry(row) {
  return {
    id: row.id,
    region: row.region,
    country: row.country,
    authority: row.authority,
    applicationType: row.application_type,
    productClass: row.product_class,
    monthsApprox: row.months_approx,
    periodDescription: row.period_description,
    governmentFeeLocal: row.government_fee_local,
    validity: row.validity,
    notes: row.notes,
    source: row.source,
    custom: true,
  }
}

function mapOverrideEntry(row) {
  return {
    id: row.id,
    region: row.region,
    country: row.country,
    authority: row.authority,
    applicationType: row.application_type,
    productClass: row.product_class,
    monthsApprox: row.months_approx,
    periodDescription: row.period_description,
    governmentFeeLocal: row.government_fee_local,
    validity: row.validity,
    notes: row.notes,
    source: row.source,
    edited: true,
    deleted: Boolean(row.deleted),
  }
}

function readFiltersFromUrl() {
  const params = new URLSearchParams(window.location.search)
  return {
    view: params.get('view') === 'table' ? 'table' : 'overview',
    search: params.get('q') ?? '',
    regionFilter: params.get('region') ?? '전체',
    typeFilter: params.get('type') ?? '전체',
    entryId: params.get('entry'),
  }
}

export default function App() {
  const initialFilters = useMemo(readFiltersFromUrl, [])
  const [view, setView] = useState(initialFilters.view)
  const [search, setSearch] = useState(initialFilters.search)
  const [regionFilter, setRegionFilter] = useState(initialFilters.regionFilter)
  const [typeFilter, setTypeFilter] = useState(initialFilters.typeFilter)
  const [customEntries, setCustomEntries] = useState([])
  const [overrides, setOverrides] = useState([])
  const [lastVerifiedMap, setLastVerifiedMap] = useState({})
  const [linkCopied, setLinkCopied] = useState(false)
  const [selectedEntryId, setSelectedEntryId] = useState(initialFilters.entryId)

  useEffect(() => {
    const params = new URLSearchParams()
    if (view !== 'overview') params.set('view', view)
    if (search !== '') params.set('q', search)
    if (regionFilter !== '전체') params.set('region', regionFilter)
    if (typeFilter !== '전체') params.set('type', typeFilter)
    if (selectedEntryId) params.set('entry', selectedEntryId)
    const queryString = params.toString()
    const newUrl = window.location.pathname + (queryString ? `?${queryString}` : '')
    window.history.replaceState(null, '', newUrl)
  }, [view, search, regionFilter, typeFilter, selectedEntryId])

  async function handleCopyLink() {
    await navigator.clipboard.writeText(window.location.href)
    setLinkCopied(true)
    setTimeout(() => setLinkCopied(false), 2000)
  }

  useEffect(() => {
    let cancelled = false
    async function loadTeamData() {
      const [customRes, overrideRes, historyRes] = await Promise.all([
        supabase.from('custom_entries').select('*').order('created_at', { ascending: true }),
        supabase.from('entry_overrides').select('*'),
        supabase.from('entry_history').select('entry_id, changed_at').order('changed_at', { ascending: false }),
      ])
      if (!cancelled) {
        if (!customRes.error && customRes.data) setCustomEntries(customRes.data.map(mapCustomEntry))
        if (!overrideRes.error && overrideRes.data) setOverrides(overrideRes.data.map(mapOverrideEntry))
        if (!historyRes.error && historyRes.data) {
          // 이미 changed_at 내림차순 정렬이라, id별로 처음 만나는 값이 가장 최근 기록이다.
          const map = {}
          for (const row of historyRes.data) {
            if (!(row.entry_id in map)) map[row.entry_id] = row.changed_at
          }
          setLastVerifiedMap(map)
        }
      }
    }
    loadTeamData()
    return () => {
      cancelled = true
    }
  }, [])

  function handleEntryUpdated(data, isCustom) {
    if (isCustom) {
      const mapped = mapCustomEntry(data)
      setCustomEntries((prev) => prev.map((e) => (e.id === mapped.id ? mapped : e)))
    } else {
      const mapped = mapOverrideEntry(data)
      setOverrides((prev) => (prev.some((o) => o.id === mapped.id) ? prev.map((o) => (o.id === mapped.id ? mapped : o)) : [...prev, mapped]))
    }
  }

  function handleEntryDeleted(id, isCustom) {
    if (isCustom) {
      setCustomEntries((prev) => prev.filter((e) => e.id !== id))
    } else {
      setOverrides((prev) =>
        prev.some((o) => o.id === id) ? prev.map((o) => (o.id === id ? { ...o, deleted: true } : o)) : [...prev, { id, deleted: true }],
      )
    }
  }

  const allEntries = useMemo(() => {
    const overrideMap = new Map(overrides.map((o) => [o.id, o]))
    const effectiveStatic = certData.map((e) => overrideMap.get(e.id) ?? e).filter((e) => !e.deleted)
    const withVerified = (entry) => ({
      ...entry,
      lastVerified: lastVerifiedMap[entry.id] ?? BASELINE_VERIFIED_DATE,
    })
    return [...effectiveStatic.map(withVerified), ...customEntries.map(withVerified)]
  }, [customEntries, overrides, lastVerifiedMap])

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase()
    return allEntries.filter((entry) => {
      const matchesSearch =
        query === '' ||
        entry.country.toLowerCase().includes(query) ||
        entry.productClass.toLowerCase().includes(query) ||
        entry.authority.toLowerCase().includes(query)
      const matchesRegion = regionFilter === '전체' || entry.region === regionFilter
      const matchesType = typeFilter === '전체' || categorize(entry.applicationType) === typeFilter
      return matchesSearch && matchesRegion && matchesType
    })
  }, [allEntries, search, regionFilter, typeFilter])

  const selectedEntry = useMemo(
    () => allEntries.find((e) => e.id === selectedEntryId) ?? null,
    [allEntries, selectedEntryId],
  )

  return (
    <div className="min-h-screen pb-16">
      <PinBanner />
      <header className="border-b border-slate-200 bg-white/90 backdrop-blur sm:sticky sm:top-0 sm:z-10">
        <div className="mx-auto max-w-6xl px-4 py-3 sm:px-6 sm:py-4">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h1 className="text-xl font-bold text-slate-900">국가별 의료기기 인증 비교</h1>
              <p className="mt-0.5 hidden text-sm text-slate-500 sm:block">
                지역별 인증 소요기간과 정부수수료를 확인하세요 (수수료는 현지 통화 그대로 표기)
              </p>
            </div>

            <div className="flex shrink-0 items-center gap-2">
              <div className="flex gap-1 rounded-lg bg-slate-100 p-1">
                {VIEWS.map((v) => (
                  <button
                    key={v.key}
                    onClick={() => setView(v.key)}
                    className={`rounded-md px-3 py-1.5 text-xs font-semibold transition ${
                      view === v.key ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'
                    }`}
                  >
                    {v.label}
                  </button>
                ))}
              </div>
              <AddEntryModal onAdded={(row) => setCustomEntries((prev) => [...prev, mapCustomEntry(row)])} />
            </div>
          </div>

          <div className="mt-3 flex flex-col gap-2 sm:mt-4 sm:gap-3 sm:flex-row sm:items-center">
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="국가명·제품등급·인증기관 검색 (예: 대한민국, Class III, MFDS...)"
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-slate-400 focus:outline-none sm:max-w-xs"
            />

            <div className="-mx-4 flex gap-1.5 overflow-x-auto px-4 sm:mx-0 sm:flex-wrap sm:overflow-visible sm:px-0">
              <button
                onClick={() => setRegionFilter('전체')}
                className={`shrink-0 whitespace-nowrap rounded-full px-3 py-1 text-xs font-medium transition ${
                  regionFilter === '전체' ? 'bg-slate-800 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                전체 지역
              </button>
              {REGION_ORDER.map((region) => (
                <button
                  key={region}
                  onClick={() => setRegionFilter(region)}
                  className={`shrink-0 whitespace-nowrap rounded-full px-3 py-1 text-xs font-medium transition ${
                    regionFilter === region ? 'bg-slate-800 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {region}
                </button>
              ))}
            </div>

            <div className="-mx-4 flex gap-1.5 overflow-x-auto px-4 sm:mx-0 sm:flex-wrap sm:overflow-visible sm:px-0">
              {TYPE_FILTERS.map((t) => (
                <button
                  key={t.key}
                  onClick={() => setTypeFilter(t.key)}
                  className={`shrink-0 whitespace-nowrap rounded-full px-3 py-1 text-xs font-medium transition ${
                    typeFilter === t.key ? 'bg-slate-800 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>

            <button
              onClick={handleCopyLink}
              className="shrink-0 self-start rounded-full border border-slate-300 px-3 py-1 text-xs font-medium text-slate-600 hover:bg-slate-50 sm:ml-auto sm:self-auto"
            >
              {linkCopied ? '✅ 링크 복사됨' : '🔗 지금 화면 링크 복사'}
            </button>
          </div>

          <p className="mt-1.5 text-xs text-slate-400 sm:mt-2">
            전체 {allEntries.length}건 중 {filtered.length}건 표시 중
          </p>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-6 sm:px-6">
        <RecentActivity />
        {view === 'overview' ? (
          <OverviewView filtered={filtered} onSelectEntry={setSelectedEntryId} />
        ) : (
          <TableView filtered={filtered} onEntryUpdated={handleEntryUpdated} onEntryDeleted={handleEntryDeleted} />
        )}
      </main>

      <EntryDetailModal entry={selectedEntry} onClose={() => setSelectedEntryId(null)} />
    </div>
  )
}
