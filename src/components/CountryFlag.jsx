import { getCountryFlagCode } from '../lib/certUtils'
import { FLAG_URLS } from '../lib/flagAssets'

export default function CountryFlag({ country, className = '' }) {
  const code = getCountryFlagCode(country)
  const url = code ? FLAG_URLS[code] : null
  if (!url) return null
  return (
    <span
      className={`inline-block h-[16px] w-[21px] shrink-0 bg-cover bg-center ${className}`}
      style={{ backgroundImage: `url(${url})` }}
      title={country}
    />
  )
}
