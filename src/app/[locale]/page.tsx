import { useTranslations } from 'next-intl';
import ToolCard from '@/components/layout/ToolCard';
import AdBanner from '@/components/ads/AdBanner';

const pdfTools = [
  { key: 'compressPdf', href: '/tools/compress-pdf', icon: '📦', color: '#4B83FF' },
  { key: 'mergePdf', href: '/tools/merge-pdf', icon: '🔗', color: '#4B83FF' },
  { key: 'splitPdf', href: '/tools/split-pdf', icon: '✂️', color: '#4B83FF' },
  { key: 'rotatePdf', href: '/tools/rotate-pdf', icon: '🔄', color: '#4B83FF' },
  { key: 'removePages', href: '/tools/remove-pages', icon: '🗑️', color: '#4B83FF' },
  { key: 'pdfToImage', href: '/tools/pdf-to-image', icon: '🖼️', color: '#4B83FF' },
  { key: 'imageToPdf', href: '/tools/image-to-pdf', icon: '📄', color: '#4B83FF' },
  { key: 'addWatermark', href: '/tools/add-watermark', icon: '💧', color: '#4B83FF' },
  { key: 'addPageNumbers', href: '/tools/add-page-numbers', icon: '🔢', color: '#4B83FF' },
  { key: 'encryptPdf', href: '/tools/encrypt-pdf', icon: '🔒', color: '#4B83FF' },
  { key: 'decryptPdf', href: '/tools/decrypt-pdf', icon: '🔓', color: '#4B83FF' },
  { key: 'htmlToPdf', href: '/tools/html-to-pdf', icon: '🌐', color: '#4B83FF' },
];

const imageTools = [
  { key: 'compressImage', href: '/tools/compress-image', icon: '🗜️', color: '#4B83FF' },
  { key: 'convertImage', href: '/tools/convert-image', icon: '🔄', color: '#4B83FF' },
  { key: 'imageToIco', href: '/tools/image-to-ico', icon: '🎨', color: '#4B83FF' },
];

export default function HomePage() {
  const t = useTranslations();

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      {/* Hero */}
      <div className="text-center mb-16">
        <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
          {t('home.hero.title')}
        </h1>
        <p className="text-lg text-gray-600 max-w-2xl mx-auto">
          {t('home.hero.subtitle')}
        </p>
      </div>

      {/* PDF Tools */}
      <section id="pdf-tools" className="mb-16">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">
          {t('home.categories.pdf')}
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {pdfTools.map((tool) => (
            <ToolCard
              key={tool.key}
              title={t(`tools.${tool.key}.title`)}
              description={t(`tools.${tool.key}.description`)}
              href={tool.href}
              icon={tool.icon}
              color={tool.color}
            />
          ))}
        </div>
      </section>

      {/* Ad Space */}
      <div className="mb-16 flex justify-center">
        <AdBanner format="horizontal" />
      </div>

      {/* Image Tools */}
      <section id="image-tools">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">
          {t('home.categories.image')}
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {imageTools.map((tool) => (
            <ToolCard
              key={tool.key}
              title={t(`tools.${tool.key}.title`)}
              description={t(`tools.${tool.key}.description`)}
              href={tool.href}
              icon={tool.icon}
              color={tool.color}
            />
          ))}
        </div>
      </section>
    </div>
  );
}
