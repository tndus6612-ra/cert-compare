import { categorize, BADGE_STYLES } from '../lib/certUtils'

export default function Badge({ applicationType }) {
  const category = categorize(applicationType)
  return (
    <span className={`inline-block whitespace-nowrap rounded-full px-2.5 py-0.5 text-xs font-medium ${BADGE_STYLES[category]}`}>
      {applicationType}
    </span>
  )
}
