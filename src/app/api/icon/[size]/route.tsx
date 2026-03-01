import { ImageResponse } from 'next/og'
import { NextRequest } from 'next/server'

export async function GET(_: NextRequest, { params }: { params: Promise<{ size: string }> }) {
  const { size: sizeParam } = await params
  const s = parseInt(sizeParam) || 192
  return new ImageResponse(
    <div
      style={{
        background: '#FAFAF9',
        width: '100%',
        height: '100%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: s * 0.15,
        border: `${Math.round(s * 0.02)}px solid #1E293B`,
      }}
    >
      <span style={{ color: '#1E293B', fontSize: s * 0.55, fontWeight: 900 }}>P</span>
    </div>,
    { width: s, height: s }
  )
}
