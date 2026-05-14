'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import FileUploader from '@/components/shared/FileUploader';
import ProgressBar from '@/components/shared/ProgressBar';
import { imagesToPdf } from '@/lib/pdf/fromImage';
import { downloadBlob } from '@/lib/utils/download';

export default function JpgToPdfPage() {
  const t = useTranslations();
  const [files, setFiles] = useState<File[]>([]);
  const [processing, setProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [result, setResult] = useState<Blob | null>(null);

  const handleFiles = (newFiles: File[]) => { setFiles(prev => [...prev, ...newFiles]); setResult(null); };
  const removeFile = (index: number) => { setFiles(prev => prev.filter((_, i) => i !== index)); };

  const handleConvert = async () => {
    if (files.length === 0) return;
    setProcessing(true); setProgress(30);
    try {
      const pdfBytes = await imagesToPdf(files);
      setProgress(100);
      setResult(new Blob([(pdfBytes as any)], { type: 'application/pdf' }));
    } catch { /* ignore */ }
    finally { setProcessing(false); }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-12">
      <div className="text-center mb-8">
        <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-100 rounded-2xl mb-4">
          <span className="text-3xl">📄</span>
        </div>
        <h1 className="text-3xl font-bold text-gray-900">{t('tools.jpgToPdf.title')}</h1>
        <p className="text-gray-600 mt-2">{t('tools.jpgToPdf.description')}</p>
      </div>
      {!result ? (
        <div className="space-y-6">
          <FileUploader accept={{ 'image/jpeg': ['.jpg', '.jpeg'] }} multiple files={files} onFilesSelected={handleFiles} onRemoveFile={removeFile} />
          {files.length > 0 && (
            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
              {processing && <ProgressBar progress={progress} label={t('common.processing')} />}
              <button onClick={handleConvert} disabled={processing} className="w-full bg-[#4B83FF] hover:bg-[#3A6FE0] disabled:bg-gray-300 text-white font-medium py-3 rounded-lg transition-colors mt-4">
                {processing ? t('common.processing') : t('tools.jpgToPdf.title')}
              </button>
            </div>
          )}
        </div>
      ) : (
        <div className="bg-white rounded-xl p-8 shadow-sm border border-gray-100 text-center">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
          </div>
          <div className="flex gap-3 justify-center">
            <button onClick={() => downloadBlob(result, 'images.pdf')} className="bg-[#4B83FF] hover:bg-[#3A6FE0] text-white font-medium px-6 py-3 rounded-lg transition-colors">{t('common.download')}</button>
            <button onClick={() => { setFiles([]); setResult(null); }} className="px-6 py-3 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors">{t('common.reset')}</button>
          </div>
        </div>
      )}
    </div>
  );
}
