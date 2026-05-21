import { ImageResponse } from 'next/og';

export const runtime = 'edge';
export const alt = 'PDF Tools - Free Online PDF & Image Tools';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

export default async function Image({ params }: { params: { locale: string } }) {
  const { locale } = await params;
  const title = locale === 'zh' ? 'PDF 工具箱' : 'PDF Tools';
  const subtitle = locale === 'zh'
    ? '免费在线 PDF 和图片工具'
    : 'Free Online PDF & Image Tools';
  const tagline = locale === 'zh'
    ? '所有处理在浏览器中完成，文件不会离开您的设备'
    : 'All processing happens in your browser. Files never leave your device.';

  return new ImageResponse(
    (
      <div
        style={{
          height: '100%',
          width: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: '#F5F7FA',
          position: 'relative',
        }}
      >
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            height: '8px',
            backgroundColor: '#4B83FF',
          }}
        />
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '16px',
            marginBottom: '20px',
          }}
        >
          <div
            style={{
              width: '64px',
              height: '64px',
              backgroundColor: '#4B83FF',
              borderRadius: '16px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '32px',
              color: 'white',
            }}
          >
            PDF
          </div>
          <span style={{ fontSize: '52px', fontWeight: 'bold', color: '#1a1a1a' }}>
            {title}
          </span>
        </div>
        <span style={{ fontSize: '28px', color: '#555', marginBottom: '12px' }}>
          {subtitle}
        </span>
        <span style={{ fontSize: '18px', color: '#888' }}>
          {tagline}
        </span>
        <span
          style={{
            fontSize: '20px',
            color: '#4B83FF',
            marginTop: '40px',
            fontWeight: 'bold',
          }}
        >
          www.vavc.cn
        </span>
      </div>
    ),
    { ...size }
  );
}
