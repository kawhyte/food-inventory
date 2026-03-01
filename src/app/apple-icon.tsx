import { ImageResponse } from 'next/og'

export const size = { width: 180, height: 180 }
export const contentType = 'image/png'

export default function AppleIcon() {
  return new ImageResponse(
    <div
      style={{
        background: '#FAFAF9',
        width: '100%',
        height: '100%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: 27,
        border: '4px solid #1E293B',
      }}
    >
      <span style={{ color: '#1E293B', fontSize: 100, fontWeight: 900 }}>P</span>
    </div>,
    { ...size }
  )
}
