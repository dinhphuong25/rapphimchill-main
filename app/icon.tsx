import { ImageResponse } from 'next/og'

export const runtime = 'edge'
export const size = { width: 96, height: 96 }
export const contentType = 'image/png'

export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: '#04070d',
          borderRadius: '24px',
          border: '2px solid rgba(74, 222, 128, 0.5)',
        }}
      >
        <svg
          width="62"
          height="62"
          viewBox="0 0 100 100"
          fill="none"
        >
          {/* Left Column of H */}
          <rect x="16" y="14" width="18" height="72" rx="9" fill="#22c55e" />
          {/* Right Column of H */}
          <rect x="66" y="14" width="18" height="72" rx="9" fill="#22c55e" />
          {/* Dynamic Play Crossbar */}
          <rect x="24" y="42" width="52" height="16" rx="8" fill="#22c55e" />
          <polygon points="44,38 60,50 44,62" fill="#ffffff" />
        </svg>
      </div>
    ),
    { ...size }
  )
}
