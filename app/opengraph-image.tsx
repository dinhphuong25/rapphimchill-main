import { ImageResponse } from 'next/og'

export const runtime = 'edge'
export const alt = 'Hi Phim - Xem Phim Online HD Miễn Phí'
export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'

export default function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          background: '#04070d',
          border: '8px solid rgba(34, 197, 94, 0.3)',
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: '#0b131f',
            borderRadius: '40px',
            width: '180px',
            height: '180px',
            border: '3px solid #22c55e',
            boxShadow: '0 0 60px rgba(34, 197, 94, 0.4)',
            marginBottom: '36px',
          }}
        >
          <svg
            width="120"
            height="120"
            viewBox="0 0 100 100"
            fill="none"
          >
            <rect x="18" y="15" width="16" height="70" rx="7" fill="#22c55e" />
            <rect x="66" y="15" width="16" height="70" rx="7" fill="#22c55e" />
            <path d="M 32 38 L 64 50 L 32 62 Z" fill="#4ade80" />
            <polygon points="40,43 56,50 40,57" fill="#ffffff" />
          </svg>
        </div>
        <h1
          style={{
            fontSize: '72px',
            fontWeight: 900,
            color: 'white',
            letterSpacing: '-0.02em',
            margin: 0,
            display: 'flex',
            alignItems: 'center',
            gap: '16px',
          }}
        >
          <span>HI</span>
          <span style={{ color: '#22c55e' }}>PHIM</span>
        </h1>
        <p
          style={{
            fontSize: '28px',
            fontWeight: 600,
            color: '#94a3b8',
            marginTop: '16px',
            maxWidth: '800px',
            textAlign: 'center',
            lineHeight: 1.4,
          }}
        >
          Xem Phim Online HD Miễn Phí Tốc Độ Cao
        </p>
      </div>
    ),
    { ...size }
  )
}
