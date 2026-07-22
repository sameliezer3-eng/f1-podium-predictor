// Original wordmark — not a reproduction of the official F1 logo. Same
// general motorsport visual language (bold italic type, a red accent, a
// speed-stripe motif) but its own mark: "Fam" in bold italic, then an
// upright bold "1" in red trailing three speed stripes, standing in for
// both the F1 pun and "family" at once.
//
// `variant="wordmark"` — full lockup, used in the header/nav.
// `variant="mark"` — just the badge, used for the favicon and anywhere
// space is tight (compact nav, splash/loading states).
const ONE_PATH = 'M8,0 L16,0 L16,32 L10,32 L10,7 L2,10 L2,3 Z'

function SpeedStripes({ opacityScale = 1 }) {
  return (
    <g stroke="#e10600" strokeWidth="2.6" strokeLinecap="round">
      <line x1="-16" y1="27" x2="-9" y2="19" opacity={0.35 * opacityScale} />
      <line x1="-11" y1="27" x2="-4" y2="19" opacity={0.6 * opacityScale} />
      <line x1="-6" y1="27" x2="1" y2="19" opacity={0.9 * opacityScale} />
    </g>
  )
}

export default function Fam1Logo({ variant = 'wordmark', className = '' }) {
  if (variant === 'mark') {
    return (
      <svg viewBox="0 0 48 48" className={className} role="img" aria-label="Fam1">
        <rect x="1.5" y="1.5" width="45" height="45" rx="11" fill="#0a0a0f" stroke="#e10600" strokeWidth="2" />
        <g transform="translate(26,8)">
          <SpeedStripes />
          <path d={ONE_PATH} fill="#fff" />
        </g>
      </svg>
    )
  }

  return (
    <svg viewBox="0 0 148 44" className={className} role="img" aria-label="Fam1">
      <text
        x="0"
        y="33"
        fontFamily="'Titillium Web', 'Arial Narrow', system-ui, sans-serif"
        fontWeight="900"
        fontStyle="italic"
        fontSize="31"
        fill="currentColor"
        letterSpacing="-0.5"
      >
        Fam
      </text>
      <g transform="translate(106,6)">
        <SpeedStripes />
        <path d={ONE_PATH} fill="#e10600" />
      </g>
    </svg>
  )
}
