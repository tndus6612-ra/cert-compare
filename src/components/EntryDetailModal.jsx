import { useState } from 'react'
import { createPortal } from 'react-dom'
import { IconX, IconLink, IconCheck, IconExternalLink } from '@tabler/icons-react'
import Badge from './Badge'
import { getFreshnessStatus } from '../lib/freshness'
import CountryFlag from './CountryFlag'

export default function EntryDetailModal({ entry, onClose }) {
  const [copied, setCopied] = useState(false)

  if (!entry) return null

  async function handleCopyLink() {
    const url = new URL(window.location.href)
    url.searchParams.set('entry', entry.id)
    await navigator.clipboard.writeText(url.toString())
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const freshness = entry.lastVerified ? getFreshnessStatus(entry.lastVerified) : null

  return createPortal(
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/40" onClick={onClose}>
      <div className="flex min-h-full items-center justify-center p-4">
        <div className="w-full max-w-lg rounded-xl bg-white p-5 text-left shadow-xl" onClick={(e) => e.stopPropagation()}>
          <div className="flex items-start justify-between gap-2">
            <div>
              <h3 className="flex items-center gap-1.5 text-base font-bold text-slate-900">
                <CountryFlag country={entry.country} className="rounded-sm" />
                {entry.country} <span className="font-normal text-slate-400">· {entry.authority}</span>
              </h3>
              <div className="mt-1 flex flex-wrap items-center gap-1.5">
                <Badge applicationType={entry.applicationType} />
                <span className="text-sm font-semibold text-slate-700">{entry.productClass}</span>
                {entry.custom && (
                  <span className="rounded-full bg-violet-100 px-2 py-0.5 text-xs font-medium text-violet-700">팀 추가</span>
                )}
                {entry.edited && (
                  <span className="rounded-full bg-sky-100 px-2 py-0.5 text-xs font-medium text-sky-700">수정됨</span>
                )}
              </div>
            </div>
            <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
              <IconX size={20} />
            </button>
          </div>

          <dl className="mt-4 grid grid-cols-1 gap-x-4 gap-y-2 text-sm sm:grid-cols-2">
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
            <div className="flex gap-1">
              <dt className="shrink-0 text-slate-400">지역</dt>
              <dd className="text-slate-700">{entry.region}</dd>
            </div>
          </dl>

          {entry.notes && (
            <div className="mt-3 rounded-lg bg-slate-50 p-2.5 text-sm">
              <p className="mb-1 text-xs font-semibold text-slate-400">비고</p>
              <p className="text-slate-700">{entry.notes}</p>
            </div>
          )}

          <div className="mt-3 flex flex-wrap items-center gap-1.5 text-xs text-slate-400">
            {entry.sourceUrl ? (
              <span>
                출처:{' '}
                <a
                  href={entry.sourceUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-0.5 text-sky-600 underline decoration-dotted hover:text-sky-800"
                >
                  {entry.source} <IconExternalLink size={12} />
                </a>
              </span>
            ) : (
              <span>출처: {entry.source}</span>
            )}
            {freshness && (
              <span className={`rounded-full px-1.5 py-0.5 text-[10px] font-medium ${freshness.className}`}>{freshness.label}</span>
            )}
          </div>

          <div className="mt-4 flex justify-end border-t border-slate-100 pt-3">
            <button
              onClick={handleCopyLink}
              className="inline-flex items-center gap-1 rounded-lg border border-slate-300 px-3 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-50"
            >
              {copied ? (
                <>
                  <IconCheck size={14} /> 링크 복사됨
                </>
              ) : (
                <>
                  <IconLink size={14} /> 이 항목 링크 복사
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body,
  )
}
