'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import FileUploader from '@/components/shared/FileUploader';
import ProgressBar from '@/components/shared/ProgressBar';
import { addPageNumbers, Position } from '@/lib/pdf/pageNumbers';
import { readFileAsArrayBuffer } from '@/lib/utils/fileHelpers';
import { downloadBlob } from '@/lib/utils/download';
import ErrorMessage from '@/components/shared/ErrorMessage';

export default function AddPageNumbersPage() {
  const t = useTranslations();
  const [file, setFile] = useState<File | null>(null);
  const [position, setPosition] = useState<Position>('bottom-center');
  const [error, setError] = useState('');
  const [processing, setProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [result, setResult] = useState<Blob | null>(null);

  const handleFiles = (files: File[]) => {
    setFile(files[0]);
    setResult(null);
  };

  const handleApply = async () => {
    if (!file) return;
    setProcessing(true);
    setProgress(30);

    try {
      const buffer = await readFileAsArrayBuffer(file);
      setProgress(60);
      const modified = await addPageNumbers(buffer, { position, fontSize: 12, startNumber: 1 });
      setProgress(100);
      setResult(new Blob([(modified as any)], { type: 'application/pdf' }));
    } catch (error) {
      setError('Processing failed. Please try a different file.');
    } finally {
      setProcessing(false);
    }
  };

  const positions: { value: Position; label: string }[] = [
    { value: 'bottom-center', label: 'Bottom Center' },
    { value: 'bottom-left', label: 'Bottom Left' },
    { value: 'bottom-right', label: 'Bottom Right' },
    { value: 'top-center', label: 'Top Center' },
    { value: 'top-left', label: 'Top Left' },
    { value: 'top-right', label: 'Top Right' },
  ];

  return (
    <div className="max-w-4xl mx-auto px-4 py-12">
      <div className="text-center mb-8">
        <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-100 rounded-2xl mb-4">
          <span className="text-3xl">🔢</span>
        </div>
        <h1 className="text-3xl font-bold text-gray-900">{t('tools.addPageNumbers.title')}</h1>
        <p className="text-gray-600 mt-2">{t('tools.addPageNumbers.description')}</p>
      </div>

      {!file ? (
        <FileUploader accept={{ 'application/pdf': ['.pdf'] }} multiple={false} files={file ? [file] : []} onFilesSelected={handleFiles} onRemoveFile={() => setFile(null)} />
      ) : !result ? (
        <div className="bg-white rounded-xl p-8 shadow-sm border border-gray-100">
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-3">{t('common.position')}</label>
            <div className="grid grid-cols-3 gap-2">
              {positions.map(({ value, label }) => (
                <button
                  key={value}
                  onClick={() => setPosition(value)}
                  className={`py-2 px-3 rounded-lg border-2 text-sm font-medium transition-colors ${
                    position === value ? 'border-[#4B83FF] bg-blue-50 text-[#4B83FF]' : 'border-gray-200 text-gray-600 hover:border-gray-300'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          {processing && <ProgressBar progress={progress} label={t('common.processing')} />}

          <button
            onClick={handleApply}
            disabled={processing}
            className="w-full bg-[#4B83FF] hover:bg-[#3A6FE0] disabled:bg-gray-300 text-white font-medium py-3 rounded-lg transition-colors mt-4"
          >
            {processing ? t('common.processing') : t('tools.addPageNumbers.title')}
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
              onClick={() => downloadBlob(result, `numbered_${file.name}`)}
              className="bg-[#4B83FF] hover:bg-[#3A6FE0] text-white font-medium px-6 py-3 rounded-lg transition-colors"
            >
              {t('common.download')}
            </button>
            <button
              onClick={() => { setFile(null); setResult(null); }}
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
