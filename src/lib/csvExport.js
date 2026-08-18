function escapeCsvValue(value) {
  const str = String(value ?? '')
  if (/[",\n]/.test(str)) {
    return `"${str.replace(/"/g, '""')}"`
  }
  return str
}

function statusLabel(entry) {
  if (entry.custom) return '팀 추가'
  if (entry.edited) return '수정됨'
  return '공개자료'
}

export function downloadEntriesAsCsv(entries) {
  const headers = ['지역', '국가', '인증기관', '신청유형', '제품등급', '심사기간', '약 개월수', '정부수수료', '유효기간', '비고', '출처', '구분']

  const rows = entries.map((e) => [
    e.region,
    e.country,
    e.authority,
    e.applicationType,
    e.productClass,
    e.periodDescription,
    e.monthsApprox ?? '',
    e.governmentFeeLocal,
    e.validity ?? '',
    e.notes ?? '',
    e.source,
    statusLabel(e),
  ])

  const csvBody = [headers, ...rows].map((row) => row.map(escapeCsvValue).join(',')).join('\r\n')
  // 맨 앞 BOM은 엑셀이 한글을 깨지지 않게 인식하도록 해줌
  const blob = new Blob(['﻿' + csvBody], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)

  const today = new Date()
  const dateStr = `${today.getFullYear()}${String(today.getMonth() + 1).padStart(2, '0')}${String(today.getDate()).padStart(2, '0')}`

  const link = document.createElement('a')
  link.href = url
  link.download = `국가별_의료기기_인증비교_${dateStr}.csv`
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}
