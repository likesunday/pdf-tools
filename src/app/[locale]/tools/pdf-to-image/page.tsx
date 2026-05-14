'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import FileUploader from '@/components/shared/FileUploader';
import ProgressBar from '@/components/shared/ProgressBar';
import { pdfToImages, ImageFormat } from '@/lib/pdf/toImage';
import { readFileAsArrayBuffer } from '@/lib/utils/fileHelpers';
import { downloadBlob } from '@/lib/utils/download';
import ErrorMessage from '@/components/shared/ErrorMessage';

export default function PdfToImagePage() {
  const t = useTranslations();
  const [file, setFile] = useState<File | null>(null);
  const [format, setFormat] = useState<ImageFormat>('png');
  const [error, setError] = useState('');
  const [processing, setProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [results, setResults] = useState<Blob[]>([]);

  const handleFiles = (files: File[]) => {
    setFile(files[0]);
    setResults([]);
  };

  const handleConvert = async () => {
    if (!file) return;
    setProcessing(true);
    setProgress(20);

    try {
      const buffer = await readFileAsArrayBuffer(file);
      setProgress(40);
      const images = await pdfToImages(buffer, { format, scale: 2, quality: 0.92 });
      setProgress(100);
      setResults(images);
    } catch (error) {
      setError('Processing failed. Please try a different file.');
    } finally {
      setProcessing(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-12">
      <div className="text-center mb-8">
        <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-100 rounded-2xl mb-4">
          <span className="text-3xl">🖼️</span>
        </div>
        <h1 className="text-3xl font-bold text-gray-900">{t('tools.pdfToImage.title')}</h1>
        <p className="text-gray-600 mt-2">{t('tools.pdfToImage.description')}</p>
      </div>

      {!file ? (
        <FileUploader accept={{ 'application/pdf': ['.pdf'] }} multiple={false} files={file ? [file] : []} onFilesSelected={handleFiles} onRemoveFile={() => setFile(null)} />
      ) : results.length === 0 ? (
        <div className="bg-white rounded-xl p-8 shadow-sm border border-gray-100">
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-3">{t('common.format')}</label>
            <div className="flex gap-3">
              {(['png', 'jpeg'] as ImageFormat[]).map((f) => (
                <button
                  key={f}
                  onClick={() => setFormat(f)}
                  className={`flex-1 py-3 rounded-lg border-2 font-medium uppercase transition-colors ${
                    format === f ? 'border-[#4B83FF] bg-blue-50 text-[#4B83FF]' : 'border-gray-200 text-gray-600 hover:border-gray-300'
                  }`}
                >
                  {f}
                </button>
              ))}
            </div>
          </div>

          {processing && <ProgressBar progress={progress} label={t('common.processing')} />}

          <button
            onClick={handleConvert}
            disabled={processing}
            className="w-full bg-[#4B83FF] hover:bg-[#3A6FE0] disabled:bg-gray-300 text-white font-medium py-3 rounded-lg transition-colors mt-4"
          >
            {processing ? t('common.processing') : t('tools.pdfToImage.title')}
          </button>
        </div>
      ) : (
        <div className="bg-white rounded-xl p-8 shadow-sm border border-gray-100">
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mb-6">
            {results.map((blob, index) => (
              <div key={index} className="border border-gray-200 rounded-lg overflow-hidden">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={URL.createObjectURL(blob)}
                  alt={`Page ${index + 1}`}
                  loading="lazy"
                  className="w-full h-40 object-cover"
                />
                <button
                  onClick={() => downloadBlob(blob, `page_${index + 1}.${format}`)}
                  className="w-full py-2 text-sm text-[#4B83FF] hover:bg-blue-50 transition-colors"
                >
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
              {t('common.downloadAll')}
            </button>
            <button
              onClick={() => { setFile(null); setResults([]); }}
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
