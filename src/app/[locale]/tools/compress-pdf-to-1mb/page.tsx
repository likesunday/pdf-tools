'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import FileUploader from '@/components/shared/FileUploader';
import ProgressBar from '@/components/shared/ProgressBar';
import { compressPdf } from '@/lib/pdf/compress';
import { readFileAsArrayBuffer, formatFileSize } from '@/lib/utils/fileHelpers';
import { downloadBlob } from '@/lib/utils/download';

export default function CompressPdfTo1mbPage() {
  const t = useTranslations();
  const [file, setFile] = useState<File | null>(null);
  const [processing, setProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [result, setResult] = useState<{ blob: Blob; size: number } | null>(null);

  const handleFiles = (files: File[]) => { setFile(files[0]); setResult(null); };

  const handleCompress = async () => {
    if (!file) return;
    setProcessing(true); setProgress(20);
    try {
      const buffer = await readFileAsArrayBuffer(file);
      const targetSize = 1024 * 1024;
      let quality = 0.6;
      let blob: Blob = new Blob();
      for (let i = 0; i < 5; i++) {
        setProgress(20 + i * 15);
        const compressed = await compressPdf(buffer, { quality });
        blob = new Blob([(compressed as any)], { type: 'application/pdf' });
        if (blob.size <= targetSize || quality <= 0.1) break;
        quality -= 0.1;
      }
      setResult({ blob, size: blob.size });
      setProgress(100);
    } catch { /* ignore */ }
    finally { setProcessing(false); }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-12">
      <div className="text-center mb-8">
        <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-100 rounded-2xl mb-4">
          <span className="text-3xl">📦</span>
        </div>
        <h1 className="text-3xl font-bold text-gray-900">{t('tools.compressPdfTo1mb.title')}</h1>
        <p className="text-gray-600 mt-2">{t('tools.compressPdfTo1mb.description')}</p>
      </div>
      {!file ? (
        <FileUploader accept={{ 'application/pdf': ['.pdf'] }} multiple={false} files={[]} onFilesSelected={handleFiles} onRemoveFile={() => setFile(null)} />
      ) : !result ? (
        <div className="bg-white rounded-xl p-8 shadow-sm border border-gray-100">
          <FileUploader accept={{ 'application/pdf': ['.pdf'] }} multiple={false} files={[file]} onFilesSelected={handleFiles} onRemoveFile={() => setFile(null)} />
          {processing && <ProgressBar progress={progress} label={t('common.processing')} />}
          <button onClick={handleCompress} disabled={processing} className="w-full bg-[#4B83FF] hover:bg-[#3A6FE0] disabled:bg-gray-300 text-white font-medium py-3 rounded-lg transition-colors mt-4">
            {processing ? t('common.processing') : t('tools.compressPdfTo1mb.title')}
          </button>
        </div>
      ) : (
        <div className="bg-white rounded-xl p-8 shadow-sm border border-gray-100 text-center">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
          </div>
          <p className="text-gray-600 mb-2">{formatFileSize(file.size)} → {formatFileSize(result.size)}</p>
          <p className="text-green-600 font-medium mb-6">{Math.round((1 - result.size / file.size) * 100)}% smaller</p>
          <div className="flex gap-3 justify-center">
            <button onClick={() => downloadBlob(result.blob, `compressed_1mb_${file.name}`)} className="bg-[#4B83FF] hover:bg-[#3A6FE0] text-white font-medium px-6 py-3 rounded-lg transition-colors">{t('common.download')}</button>
            <button onClick={() => { setFile(null); setResult(null); }} className="px-6 py-3 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors">{t('common.reset')}</button>
          </div>
        </div>
      )}
    </div>
  );
}
