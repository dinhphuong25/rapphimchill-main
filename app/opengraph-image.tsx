import { ImageResponse } from 'next/og'

export const runtime = 'edge'
export const alt = 'Rạp Phim Chill'
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
          background: '#0a0a0a', // Dark background for OG image
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: '#dc2626',
            borderRadius: '24px',
            width: '160px',
            height: '160px',
            boxShadow: '0 10px 40px rgba(220,38,38,0.5)',
            marginBottom: '40px',
          }}
        >
          <svg
            width="80"
            height="80"
            viewBox="0 0 24 24"
            fill="white"
            style={{ marginLeft: '10px' }}
          >
            <path d="M8 5v14l11-7z" />
          </svg>
        </div>
        <h1
          style={{
            fontSize: '64px',
            fontWeight: 'bold',
            color: 'white',
            letterSpacing: '-0.02em',
            margin: 0,
          }}
        >
          Rạp Phim Chill
        </h1>
        <p
          style={{
            fontSize: '32px',
            color: '#a3a3a3',
            marginTop: '20px',
            maxWidth: '800px',
            textAlign: 'center',
            lineHeight: 1.4,
          }}
        >
          Kho phim HD chất lượng cao miễn phí
        </p>
      </div>
    ),
    { ...size }
  )
}
