'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import FileUploader from '@/components/shared/FileUploader';
import ProgressBar from '@/components/shared/ProgressBar';
import { imageToIco, IcoSize } from '@/lib/image/toIco';
import { downloadBlob } from '@/lib/utils/download';
import { changeFileExtension } from '@/lib/utils/fileHelpers';

const sizeOptions: { value: IcoSize; label: string }[] = [
  { value: 16, label: '16x16' },
  { value: 32, label: '32x32' },
  { value: 48, label: '48x48' },
  { value: 64, label: '64x64' },
  { value: 128, label: '128x128' },
  { value: 256, label: '256x256' },
];

export default function ImageToIcoPage() {
  const t = useTranslations();
  const [file, setFile] = useState<File | null>(null);
  const [selectedSizes, setSelectedSizes] = useState<IcoSize[]>([16, 32, 48]);
  const [processing, setProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [result, setResult] = useState<Blob | null>(null);
  const [error, setError] = useState('');

  const handleFiles = (files: File[]) => {
    setFile(files[0]);
    setResult(null);
    setError('');
  };

  const toggleSize = (size: IcoSize) => {
    setSelectedSizes((prev) =>
      prev.includes(size) ? prev.filter((s) => s !== size) : [...prev, size].sort((a, b) => a - b)
    );
  };

  const handleConvert = async () => {
    if (!file || selectedSizes.length === 0) return;
    setProcessing(true);
    setProgress(30);
    setError('');

    try {
      const ico = await imageToIco(file, selectedSizes);
      setProgress(100);
      setResult(ico);
    } catch (err) {
      setError(t('common.processing') + ' failed');
    } finally {
      setProcessing(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-12">
      <div className="text-center mb-8">
        <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-100 rounded-2xl mb-4">
          <span className="text-3xl">🎨</span>
        </div>
        <h1 className="text-3xl font-bold text-gray-900">{t('tools.imageToIco.title')}</h1>
        <p className="text-gray-600 mt-2">{t('tools.imageToIco.description')}</p>
      </div>

      {!file ? (
        <FileUploader
          accept={{ 'image/*': ['.png', '.jpg', '.jpeg', '.webp', '.bmp'] }}
          multiple={false}
          files={[]}
          onFilesSelected={handleFiles}
          onRemoveFile={() => setFile(null)}
        />
      ) : !result ? (
        <div className="bg-white rounded-xl p-8 shadow-sm border border-gray-100">
          <FileUploader
            accept={{ 'image/*': ['.png', '.jpg', '.jpeg', '.webp', '.bmp'] }}
            multiple={false}
            files={[file]}
            onFilesSelected={handleFiles}
            onRemoveFile={() => setFile(null)}
          />

          <div className="mt-6 mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-3">
              ICO Sizes
            </label>
            <div className="flex flex-wrap gap-2">
              {sizeOptions.map(({ value, label }) => (
                <button
                  key={value}
                  onClick={() => toggleSize(value)}
                  className={`px-4 py-2 rounded-lg border-2 text-sm font-medium transition-colors ${
                    selectedSizes.includes(value)
                      ? 'border-[#4B83FF] bg-blue-50 text-[#4B83FF]'
                      : 'border-gray-200 text-gray-600 hover:border-gray-300'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          {error && (
            <div className="mb-4 p-3 bg-blue-50 text-[#4B83FF] rounded-lg text-sm">{error}</div>
          )}

          {processing && <ProgressBar progress={progress} label={t('common.processing')} />}

          <button
            onClick={handleConvert}
            disabled={processing || selectedSizes.length === 0}
            className="w-full bg-[#4B83FF] hover:bg-[#3A6FE0] disabled:bg-gray-300 text-white font-medium py-3 rounded-lg transition-colors mt-4"
          >
            {processing ? t('common.processing') : t('tools.imageToIco.title')}
          </button>
        </div>
      ) : (
        <div className="bg-white rounded-xl p-8 shadow-sm border border-gray-100 text-center">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <p className="text-gray-600 mb-2">Sizes: {selectedSizes.map(s => `${s}x${s}`).join(', ')}</p>
          <div className="flex gap-3 justify-center mt-4">
            <button
              onClick={() => downloadBlob(result, changeFileExtension(file.name, 'ico'))}
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
