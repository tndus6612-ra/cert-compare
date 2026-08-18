import { useMemo, useState } from 'react'
import certData from '../cert_data.json'
import { REGION_ORDER, categorize, TYPE_FILTERS } from './lib/certUtils'
import OverviewView from './OverviewView'
import TableView from './TableView'
import PinBanner from './components/PinBanner'

const VIEWS = [
  { key: 'overview', label: '한눈에 보기' },
  { key: 'table', label: '상세 테이블' },
]

export default function App() {
  const [view, setView] = useState('overview')
  const [search, setSearch] = useState('')
  const [regionFilter, setRegionFilter] = useState('전체')
  const [typeFilter, setTypeFilter] = useState('전체')

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase()
    return certData.filter((entry) => {
      const matchesSearch = query === '' || entry.country.toLowerCase().includes(query)
      const matchesRegion = regionFilter === '전체' || entry.region === regionFilter
      const matchesType = typeFilter === '전체' || categorize(entry.applicationType) === typeFilter
      return matchesSearch && matchesRegion && matchesType
    })
  }, [search, regionFilter, typeFilter])

  return (
    <div className="min-h-screen pb-16">
      <PinBanner />
      <header className="sticky top-0 z-10 border-b border-slate-200 bg-white/90 backdrop-blur">
        <div className="mx-auto max-w-6xl px-4 py-4 sm:px-6">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h1 className="text-xl font-bold text-slate-900">국가별 의료기기 인증 비교</h1>
              <p className="mt-0.5 text-sm text-slate-500">
                지역별 인증 소요기간과 정부수수료를 확인하세요 (수수료는 현지 통화 그대로 표기)
              </p>
            </div>

            <div className="flex shrink-0 gap-1 rounded-lg bg-slate-100 p-1">
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
          </div>

          <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center">
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="국가명 검색 (예: 대한민국, 미국...)"
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-slate-400 focus:outline-none sm:max-w-xs"
            />

            <div className="flex flex-wrap gap-1.5">
              <button
                onClick={() => setRegionFilter('전체')}
                className={`rounded-full px-3 py-1 text-xs font-medium transition ${
                  regionFilter === '전체' ? 'bg-slate-800 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                전체 지역
              </button>
              {REGION_ORDER.map((region) => (
                <button
                  key={region}
                  onClick={() => setRegionFilter(region)}
                  className={`rounded-full px-3 py-1 text-xs font-medium transition ${
                    regionFilter === region ? 'bg-slate-800 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {region}
                </button>
              ))}
            </div>

            <div className="flex flex-wrap gap-1.5">
              {TYPE_FILTERS.map((t) => (
                <button
                  key={t.key}
                  onClick={() => setTypeFilter(t.key)}
                  className={`rounded-full px-3 py-1 text-xs font-medium transition ${
                    typeFilter === t.key ? 'bg-slate-800 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>
          </div>

          <p className="mt-2 text-xs text-slate-400">
            전체 {certData.length}건 중 {filtered.length}건 표시 중
          </p>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-6 sm:px-6">
        {view === 'overview' ? <OverviewView filtered={filtered} /> : <TableView filtered={filtered} />}
      </main>
    </div>
  )
}
