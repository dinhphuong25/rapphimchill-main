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
          border: '2px solid rgba(34, 197, 94, 0.4)',
        }}
      >
        <svg
          width="60"
          height="60"
          viewBox="0 0 100 100"
          fill="none"
        >
          {/* Left Column of H */}
          <rect x="18" y="15" width="16" height="70" rx="7" fill="#22c55e" />
          {/* Right Column of H */}
          <rect x="66" y="15" width="16" height="70" rx="7" fill="#22c55e" />
          {/* Center Play Arrow Bar */}
          <path d="M 32 38 L 64 50 L 32 62 Z" fill="#4ade80" />
          <polygon points="40,43 56,50 40,57" fill="#ffffff" />
        </svg>
      </div>
    ),
    { ...size }
  )
}
