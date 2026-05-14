'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import ProgressBar from '@/components/shared/ProgressBar';
import { downloadBlob } from '@/lib/utils/download';

export default function HtmlToPdfPage() {
  const t = useTranslations();
  const [htmlContent, setHtmlContent] = useState('<h1>Hello World</h1>\n<p>This is a sample HTML content.</p>');
  const [processing, setProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [result, setResult] = useState<Blob | null>(null);

  const handleConvert = async () => {
    if (!htmlContent.trim()) return;
    setProcessing(true);
    setProgress(30);

    try {
      const html2pdf = (await import('html2pdf.js')).default;
      setProgress(50);

      const container = document.createElement('div');
      container.innerHTML = htmlContent;
      container.style.padding = '40px';

      const pdfBlob = await html2pdf()
        .set({
          margin: 10,
          filename: 'converted.pdf',
          html2canvas: { scale: 2 },
          jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' },
        })
        .from(container)
        .outputPdf('blob');

      setProgress(100);
      setResult(pdfBlob);
    } catch (error) {
      console.error('HTML to PDF failed:', error);
    } finally {
      setProcessing(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-12">
      <div className="text-center mb-8">
        <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-100 rounded-2xl mb-4">
          <span className="text-3xl">🌐</span>
        </div>
        <h1 className="text-3xl font-bold text-gray-900">{t('tools.htmlToPdf.title')}</h1>
        <p className="text-gray-600 mt-2">{t('tools.htmlToPdf.description')}</p>
      </div>

      {!result ? (
        <div className="bg-white rounded-xl p-8 shadow-sm border border-gray-100">
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">HTML</label>
            <textarea
              value={htmlContent}
              onChange={(e) => setHtmlContent(e.target.value)}
              rows={12}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg font-mono text-sm focus:ring-2 focus:ring-[#4B83FF] focus:border-transparent"
              placeholder="<h1>Your HTML here</h1>"
            />
          </div>

          {processing && <ProgressBar progress={progress} label={t('common.processing')} />}

          <button
            onClick={handleConvert}
            disabled={processing || !htmlContent.trim()}
            className="w-full bg-[#4B83FF] hover:bg-[#3A6FE0] disabled:bg-gray-300 text-white font-medium py-3 rounded-lg transition-colors"
          >
            {processing ? t('common.processing') : t('tools.htmlToPdf.title')}
          </button>
        </div>
      ) : (
        <div className="bg-white rounded-xl p-8 shadow-sm border border-gray-100 text-center">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <div className="flex gap-3 justify-center">
            <button
              onClick={() => downloadBlob(result, 'converted.pdf')}
              className="bg-[#4B83FF] hover:bg-[#3A6FE0] text-white font-medium px-6 py-3 rounded-lg transition-colors"
            >
              {t('common.download')}
            </button>
            <button
              onClick={() => setResult(null)}
              className="px-6 py-3 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
            >
              {t('common.reset')}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
