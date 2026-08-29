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
          background: 'linear-gradient(135deg, #20D66B 0%, #10B981 100%)',
          borderRadius: '24px',
        }}
      >
        <svg
          width="54"
          height="54"
          viewBox="0 0 24 24"
          fill="none"
          stroke="#050807"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M20.2 6 3 11l-.9-2.4c-.3-1.1.3-2.2 1.3-2.5l13.5-4c1.1-.3 2.2.3 2.5 1.3Z" fill="#050807"/>
          <path d="m6.2 5.3 3.1 3.9" />
          <path d="m12.4 3.4 3.1 4" />
          <path d="M3 11h18v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" fill="#050807"/>
        </svg>
      </div>
    ),
    { ...size }
  )
}
