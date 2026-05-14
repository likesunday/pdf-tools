'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import FileUploader from '@/components/shared/FileUploader';
import ProgressBar from '@/components/shared/ProgressBar';
import { compressPdf } from '@/lib/pdf/compress';
import { readFileAsArrayBuffer, formatFileSize } from '@/lib/utils/fileHelpers';
import { downloadBlob } from '@/lib/utils/download';
import ErrorMessage from '@/components/shared/ErrorMessage';
import AdBanner from '@/components/ads/AdBanner';

export default function CompressPdfPage() {
  const t = useTranslations();
  const [file, setFile] = useState<File | null>(null);
  const [quality, setQuality] = useState(0.7);
  const [processing, setProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [result, setResult] = useState<{ blob: Blob; size: number } | null>(null);
  const [error, setError] = useState('');

  const handleFiles = (files: File[]) => {
    setFile(files[0]);
    setResult(null);
    setError('');
  };

  const handleCompress = async () => {
    if (!file) return;
    setProcessing(true);
    setProgress(30);
    setError('');

    try {
      const buffer = await readFileAsArrayBuffer(file);
      setProgress(60);
      const compressed = await compressPdf(buffer, { quality });
      setProgress(90);
      const blob = new Blob([(compressed as any)], { type: 'application/pdf' });
      setResult({ blob, size: blob.size });
      setProgress(100);
    } catch (err) {
      setError('Failed to compress PDF. The file may be corrupted or unsupported.');
    } finally {
      setProcessing(false);
    }
  };

  const handleDownload = () => {
    if (result) {
      downloadBlob(result.blob, `compressed_${file!.name}`);
    }
  };

  const handleReset = () => {
    setFile(null);
    setResult(null);
    setProgress(0);
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-12">
      <div className="text-center mb-8">
        <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-100 rounded-2xl mb-4">
          <span className="text-3xl">📦</span>
        </div>
        <h1 className="text-3xl font-bold text-gray-900">{t('tools.compressPdf.title')}</h1>
        <p className="text-gray-600 mt-2">{t('tools.compressPdf.description')}</p>
      </div>

      {!file ? (
        <FileUploader
          accept={{ 'application/pdf': ['.pdf'] }}
          multiple={false}
          files={[]}
          onFilesSelected={handleFiles}
          onRemoveFile={() => setFile(null)}
        />
      ) : !result ? (
        <div className="bg-white rounded-xl p-8 shadow-sm border border-gray-100">
          <FileUploader
            accept={{ 'application/pdf': ['.pdf'] }}
            multiple={false}
            files={[file]}
            onFilesSelected={handleFiles}
            onRemoveFile={() => setFile(null)}
          />

          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {t('common.quality')}: {Math.round(quality * 100)}%
            </label>
            <input
              type="range"
              min="0.3"
              max="1"
              step="0.1"
              value={quality}
              onChange={(e) => setQuality(parseFloat(e.target.value))}
              className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
            />
            <div className="flex justify-between text-xs text-gray-400 mt-1">
              <span>Small file</span>
              <span>High quality</span>
            </div>
          </div>

          {error && <ErrorMessage message={error} onDismiss={() => setError('')} />}
          {processing && <ProgressBar progress={progress} label={t('common.processing')} />}

          <div className="flex gap-3 mt-6">
            <button
              onClick={handleCompress}
              disabled={processing}
              className="flex-1 bg-[#4B83FF] hover:bg-[#3A6FE0] disabled:bg-gray-300 text-white font-medium py-3 rounded-lg transition-colors"
            >
              {processing ? t('common.processing') : t('tools.compressPdf.title')}
            </button>
            <button
              onClick={handleReset}
              className="px-6 py-3 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
            >
              {t('common.reset')}
            </button>
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-xl p-8 shadow-sm border border-gray-100 text-center">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>

          <div className="mb-6">
            <p className="text-gray-600">
              {formatFileSize(file.size)} → {formatFileSize(result.size)}
            </p>
            <p className="text-green-600 font-medium">
              {Math.round((1 - result.size / file.size) * 100)}% smaller
            </p>
          </div>

          <div className="flex gap-3 justify-center">
            <button
              onClick={handleDownload}
              className="inline-flex items-center gap-2 bg-[#4B83FF] hover:bg-[#3A6FE0] text-white font-medium px-6 py-3 rounded-lg transition-colors"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
              {t('common.download')}
            </button>
            <button
              onClick={handleReset}
              className="px-6 py-3 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
            >
              {t('common.reset')}
            </button>
          </div>
        </div>
      )}

      {/* Ad Space */}
      <div className="mt-8 flex justify-center">
        <AdBanner format="horizontal" />
      </div>
    </div>
  );
}
