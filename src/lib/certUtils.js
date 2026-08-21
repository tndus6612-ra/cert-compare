// 지역이 화면에 나타나는 순서
export const REGION_ORDER = ['아시아', '유럽', '중동', '오세아니아', '북미', '중남미']

// 지역별 배경/테두리/글자 색 (은은하게 구분)
export const REGION_STYLES = {
  아시아: { bg: 'bg-sky-50', border: 'border-sky-200', title: 'text-sky-900', chip: 'bg-sky-100 text-sky-700' },
  유럽: { bg: 'bg-indigo-50', border: 'border-indigo-200', title: 'text-indigo-900', chip: 'bg-indigo-100 text-indigo-700' },
  중동: { bg: 'bg-amber-50', border: 'border-amber-200', title: 'text-amber-900', chip: 'bg-amber-100 text-amber-700' },
  오세아니아: { bg: 'bg-emerald-50', border: 'border-emerald-200', title: 'text-emerald-900', chip: 'bg-emerald-100 text-emerald-700' },
  북미: { bg: 'bg-rose-50', border: 'border-rose-200', title: 'text-rose-900', chip: 'bg-rose-100 text-rose-700' },
  중남미: { bg: 'bg-fuchsia-50', border: 'border-fuchsia-200', title: 'text-fuchsia-900', chip: 'bg-fuchsia-100 text-fuchsia-700' },
}

// 신청유형 문자열 -> 배지 종류 (신규/변경/갱신)로 분류
// "변경(경미)", "변경(30-Day Notice)" 처럼 세부 유형이 붙어 있어도
// "변경"이라는 글자가 들어있으면 모두 같은 주황 배지로 묶는다.
export function categorize(applicationType) {
  if (applicationType.includes('갱신')) return 'renewal'
  if (applicationType.includes('변경')) return 'change'
  if (applicationType.includes('신규')) return 'new'
  return 'other'
}

export const BADGE_STYLES = {
  new: 'bg-blue-100 text-blue-700 ring-1 ring-inset ring-blue-300',
  change: 'bg-orange-100 text-orange-700 ring-1 ring-inset ring-orange-300',
  renewal: 'bg-emerald-100 text-emerald-700 ring-1 ring-inset ring-emerald-300',
  other: 'bg-slate-100 text-slate-600 ring-1 ring-inset ring-slate-300',
}

export const TYPE_FILTERS = [
  { key: '전체', label: '전체' },
  { key: 'new', label: '신규' },
  { key: 'change', label: '변경' },
  { key: 'renewal', label: '갱신' },
]

// 국가명 -> 국기 이모지. cert_data.json의 country 표기와 정확히 일치해야 함.
const COUNTRY_FLAGS = {
  '대한민국': '🇰🇷',
  '일본': '🇯🇵',
  '중국': '🇨🇳',
  '인도': '🇮🇳',
  '싱가포르': '🇸🇬',
  '베트남': '🇻🇳',
  'EU (역내)': '🇪🇺',
  '영국': '🇬🇧',
  '사우디아라비아': '🇸🇦',
  '호주': '🇦🇺',
  '미국': '🇺🇸',
  '캐나다': '🇨🇦',
  '멕시코': '🇲🇽',
  '브라질': '🇧🇷',
  '콜롬비아': '🇨🇴',
  '아르헨티나': '🇦🇷',
  '칠레': '🇨🇱',
  '페루': '🇵🇪',
}

// 매핑에 없는 국가(팀이 직접 추가한 카드 등)는 빈 문자열을 반환해 조용히 생략됨.
export function getCountryFlag(country) {
  return COUNTRY_FLAGS[country] ?? ''
}
