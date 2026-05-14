'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import FileUploader from '@/components/shared/FileUploader';
import ProgressBar from '@/components/shared/ProgressBar';
import { compressImage } from '@/lib/image/compress';
import { formatFileSize } from '@/lib/utils/fileHelpers';
import { downloadBlob } from '@/lib/utils/download';

export default function CompressImagePage() {
  const t = useTranslations();
  const [files, setFiles] = useState<File[]>([]);
  const [quality, setQuality] = useState(0.8);
  const [processing, setProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [results, setResults] = useState<{ file: File; original: number }[]>([]);

  const handleFiles = (newFiles: File[]) => {
    setFiles((prev) => [...prev, ...newFiles]);
    setResults([]);
  };

  const removeFile = (index: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const handleCompress = async () => {
    if (files.length === 0) return;
    setProcessing(true);
    const compressed: { file: File; original: number }[] = [];

    for (let i = 0; i < files.length; i++) {
      setProgress(((i + 1) / files.length) * 100);
      const result = await compressImage(files[i], { maxSizeMB: 2, quality });
      compressed.push({ file: result, original: files[i].size });
    }

    setResults(compressed);
    setProcessing(false);
  };

  const handleDownload = (file: File) => {
    const blob = new Blob([file], { type: file.type });
    downloadBlob(blob, file.name);
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-12">
      <div className="text-center mb-8">
        <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-100 rounded-2xl mb-4">
          <span className="text-3xl">🗜️</span>
        </div>
        <h1 className="text-3xl font-bold text-gray-900">{t('tools.compressImage.title')}</h1>
        <p className="text-gray-600 mt-2">{t('tools.compressImage.description')}</p>
      </div>

      {results.length === 0 ? (
        <div className="space-y-6">
          <FileUploader
            accept={{ 'image/*': ['.png', '.jpg', '.jpeg', '.webp'] }}
            multiple
            files={files}
            onFilesSelected={handleFiles}
            onRemoveFile={removeFile}
          />

          {files.length > 0 && (
            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
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
                  className="w-full"
                />
              </div>

              {processing && <ProgressBar progress={progress} label={t('common.processing')} />}

              <button
                onClick={handleCompress}
                disabled={processing}
                className="w-full bg-[#4B83FF] hover:bg-[#3A6FE0] disabled:bg-gray-300 text-white font-medium py-3 rounded-lg transition-colors"
              >
                {processing ? t('common.processing') : t('tools.compressImage.title')}
              </button>
            </div>
          )}
        </div>
      ) : (
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <ul className="space-y-3 mb-6">
            {results.map(({ file, original }, index) => (
              <li key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div>
                  <p className="text-sm font-medium text-gray-900">{file.name}</p>
                  <p className="text-xs text-gray-500">
                    {formatFileSize(original)} → {formatFileSize(file.size)}
                    <span className="text-green-600 ml-2">
                      -{Math.round((1 - file.size / original) * 100)}%
                    </span>
                  </p>
                </div>
                <button
                  onClick={() => handleDownload(file)}
                  className="text-[#4B83FF] hover:text-[#3A6FE0] text-sm font-medium"
                >
                  {t('common.download')}
                </button>
              </li>
            ))}
          </ul>
          <button
            onClick={() => { setFiles([]); setResults([]); }}
            className="w-full px-6 py-3 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
          >
            {t('common.reset')}
          </button>
        </div>
      )}
    </div>
  );
}
