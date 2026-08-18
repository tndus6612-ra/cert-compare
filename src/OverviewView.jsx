import { REGION_ORDER, REGION_STYLES } from './lib/certUtils'
import Badge from './components/Badge'
import TeamNotes from './components/TeamNotes'

function EntryRow({ entry }) {
  return (
    <div className="border-t border-slate-100 py-3 first:border-t-0 first:pt-0">
      <div className="flex flex-wrap items-center gap-2">
        <Badge applicationType={entry.applicationType} />
        <span className="text-sm font-semibold text-slate-800">{entry.productClass}</span>
      </div>
      <dl className="mt-2 grid grid-cols-1 gap-x-4 gap-y-1 text-sm sm:grid-cols-2">
        <div className="flex gap-1">
          <dt className="shrink-0 text-slate-400">심사기간</dt>
          <dd className="text-slate-700">
            {entry.periodDescription}
            {entry.monthsApprox != null && (
              <span className="ml-1 text-xs text-slate-400">(약 {entry.monthsApprox}개월)</span>
            )}
          </dd>
        </div>
        <div className="flex gap-1">
          <dt className="shrink-0 text-slate-400">정부수수료</dt>
          <dd className="font-medium text-slate-800">{entry.governmentFeeLocal}</dd>
        </div>
        <div className="flex gap-1">
          <dt className="shrink-0 text-slate-400">유효기간</dt>
          <dd className="text-slate-700">{entry.validity ?? '-'}</dd>
        </div>
        {entry.notes && (
          <div className="flex gap-1 sm:col-span-2">
            <dt className="shrink-0 text-slate-400">비고</dt>
            <dd className="text-slate-500">{entry.notes}</dd>
          </div>
        )}
      </dl>
      <p className="mt-1 text-xs text-slate-300">출처: {entry.source}</p>
      <TeamNotes certId={entry.id} />
    </div>
  )
}

function CountryCard({ country, authority, entries }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex items-baseline justify-between gap-2">
        <h3 className="text-base font-bold text-slate-900">{country}</h3>
        <span className="text-xs font-medium text-slate-400">{authority}</span>
      </div>
      <div>
        {entries.map((entry) => (
          <EntryRow key={entry.id} entry={entry} />
        ))}
      </div>
    </div>
  )
}

function RegionSection({ region, countries }) {
  const style = REGION_STYLES[region] ?? REGION_STYLES['아시아']
  const totalCount = countries.reduce((sum, [, entries]) => sum + entries.length, 0)

  return (
    <section className={`rounded-2xl border ${style.border} ${style.bg} p-4 sm:p-6`}>
      <div className="mb-4 flex items-center gap-2">
        <h2 className={`text-lg font-bold ${style.title}`}>{region}</h2>
        <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${style.chip}`}>
          {countries.length}개국 · {totalCount}건
        </span>
      </div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {countries.map(([country, entries]) => (
          <CountryCard key={country} country={country} authority={entries[0].authority} entries={entries} />
        ))}
      </div>
    </section>
  )
}

export default function OverviewView({ filtered }) {
  // 지역 -> 국가 -> 항목 리스트 순서로 묶기 (원래 데이터 순서 유지)
  const byRegion = new Map()
  for (const entry of filtered) {
    if (!byRegion.has(entry.region)) byRegion.set(entry.region, new Map())
    const byCountry = byRegion.get(entry.region)
    if (!byCountry.has(entry.country)) byCountry.set(entry.country, [])
    byCountry.get(entry.country).push(entry)
  }
  const grouped = REGION_ORDER.filter((r) => byRegion.has(r)).map((region) => ({
    region,
    countries: [...byRegion.get(region).entries()],
  }))

  if (grouped.length === 0) {
    return <p className="py-16 text-center text-sm text-slate-400">조건에 맞는 항목이 없습니다.</p>
  }

  return (
    <div className="space-y-6">
      {grouped.map(({ region, countries }) => (
        <RegionSection key={region} region={region} countries={countries} />
      ))}
    </div>
  )
}
