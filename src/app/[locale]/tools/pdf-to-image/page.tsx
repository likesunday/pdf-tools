'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import FileUploader from '@/components/shared/FileUploader';
import ProgressBar from '@/components/shared/ProgressBar';
import { pdfToImages, ImageFormat } from '@/lib/pdf/toImage';
import { readFileAsArrayBuffer, formatFileSize } from '@/lib/utils/fileHelpers';
import { downloadBlob } from '@/lib/utils/download';
import ErrorMessage from '@/components/shared/ErrorMessage';

type Quality = 'normal' | 'high';

export default function PdfToImagePage() {
  const t = useTranslations();
  const tp = useTranslations('pdfToImage');
  const tc = useTranslations('common');
  const [file, setFile] = useState<File | null>(null);
  const [format, setFormat] = useState<ImageFormat>('png');
  const [quality, setQuality] = useState<Quality>('normal');
  const [error, setError] = useState('');
  const [processing, setProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [results, setResults] = useState<Blob[]>([]);

  const handleFiles = (files: File[]) => {
    setFile(files[0]);
    setResults([]);
    setError('');
  };

  const handleConvert = async () => {
    if (!file) return;
    setProcessing(true);
    setProgress(20);

    try {
      const buffer = await readFileAsArrayBuffer(file);
      setProgress(40);
      const scale = quality === 'high' ? 3 : 2;
      const q = quality === 'high' ? 0.95 : 0.85;
      const images = await pdfToImages(buffer, { format, scale, quality: q });
      setProgress(100);
      setResults(images);
    } catch {
      setError('Processing failed. Please try a different file.');
    } finally {
      setProcessing(false);
    }
  };

  if (results.length > 0) {
    return (
      <div className="max-w-5xl mx-auto px-4 py-12">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-100 rounded-2xl mb-4">
            <span className="text-3xl">🖼️</span>
          </div>
          <h1 className="text-3xl font-bold text-gray-900">{t('tools.pdfToImage.title')}</h1>
        </div>
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 mb-6">
            {results.map((blob, index) => (
              <div key={index} className="border border-gray-200 rounded-lg overflow-hidden group">
                <div className="aspect-[3/4] bg-gray-50 flex items-center justify-center">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={URL.createObjectURL(blob)}
                    alt={`Page ${index + 1}`}
                    loading="lazy"
                    className="w-full h-full object-contain"
                  />
                </div>
                <button
                  onClick={() => downloadBlob(blob, `page_${index + 1}.${format}`)}
                  className="w-full py-2 text-sm text-[#4B83FF] hover:bg-blue-50 transition-colors flex items-center justify-center gap-1"
                >
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                  </svg>
                  Page {index + 1}
                </button>
              </div>
            ))}
          </div>
          <div className="flex gap-3 justify-center">
            <button
              onClick={() => results.forEach((b, i) => setTimeout(() => downloadBlob(b, `page_${i + 1}.${format}`), i * 200))}
              className="bg-[#4B83FF] hover:bg-[#3A6FE0] text-white font-medium px-6 py-3 rounded-lg transition-colors"
            >
              {tc('downloadAll')}
            </button>
            <button
              onClick={() => { setFile(null); setResults([]); }}
              className="px-6 py-3 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
            >
              {tc('reset')}
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-12">
      <div className="text-center mb-8">
        <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-100 rounded-2xl mb-4">
          <span className="text-3xl">🖼️</span>
        </div>
        <h1 className="text-3xl font-bold text-gray-900">{t('tools.pdfToImage.title')}</h1>
        <p className="text-gray-600 mt-2">{t('tools.pdfToImage.description')}</p>
      </div>

      {error && <ErrorMessage message={error} />}

      {!file ? (
        <FileUploader accept={{ 'application/pdf': ['.pdf'] }} multiple={false} files={[]} onFilesSelected={handleFiles} />
      ) : (
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 space-y-6">
          <div className="flex items-center gap-4 pb-4 border-b border-gray-100">
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
              <span className="text-lg">📄</span>
            </div>
            <div>
              <p className="font-medium text-gray-900">{file.name}</p>
              <p className="text-sm text-gray-500">{formatFileSize(file.size)}</p>
            </div>
          </div>

          {/* Conversion mode */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">{tc('format')}</label>
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => setFormat('png')}
                className={`p-4 rounded-lg border-2 text-left transition-colors ${
                  format === 'png' ? 'border-[#4B83FF] bg-blue-50' : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <p className="font-medium text-gray-900">PNG</p>
                <p className="text-xs text-gray-500 mt-0.5">{tp('pageToImageDesc')}</p>
              </button>
              <button
                onClick={() => setFormat('jpeg')}
                className={`p-4 rounded-lg border-2 text-left transition-colors ${
                  format === 'jpeg' ? 'border-[#4B83FF] bg-blue-50' : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <p className="font-medium text-gray-900">JPG</p>
                <p className="text-xs text-gray-500 mt-0.5">{tp('pageToImageDesc')}</p>
              </button>
            </div>
          </div>

          {/* Quality */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">{tc('quality')}</label>
            <div className="flex gap-3">
              <button
                onClick={() => setQuality('normal')}
                className={`flex-1 py-3 rounded-lg border-2 font-medium transition-colors ${
                  quality === 'normal' ? 'border-[#4B83FF] bg-blue-50 text-[#4B83FF]' : 'border-gray-200 text-gray-600 hover:border-gray-300'
                }`}
              >
                {tp('qualityNormal')}
                <span className="block text-xs font-normal text-gray-400 mt-0.5">{tp('recommended')}</span>
              </button>
              <button
                onClick={() => setQuality('high')}
                className={`flex-1 py-3 rounded-lg border-2 font-medium transition-colors ${
                  quality === 'high' ? 'border-[#4B83FF] bg-blue-50 text-[#4B83FF]' : 'border-gray-200 text-gray-600 hover:border-gray-300'
                }`}
              >
                {tp('qualityHigh')}
              </button>
            </div>
          </div>

          {processing && <ProgressBar progress={progress} label={tc('processing')} />}

          <button
            onClick={handleConvert}
            disabled={processing}
            className="w-full bg-[#4B83FF] hover:bg-[#3A6FE0] disabled:bg-gray-300 text-white font-medium py-3 rounded-lg transition-colors"
          >
            {processing ? tc('processing') : t('tools.pdfToImage.title')}
          </button>
        </div>
      )}
    </div>
  );
}
