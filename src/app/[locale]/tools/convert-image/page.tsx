'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import FileUploader from '@/components/shared/FileUploader';
import ProgressBar from '@/components/shared/ProgressBar';
import { convertImage, OutputFormat } from '@/lib/image/convert';
import { downloadBlob } from '@/lib/utils/download';
import { changeFileExtension } from '@/lib/utils/fileHelpers';

const formats: { value: OutputFormat; label: string; ext: string }[] = [
  { value: 'image/png', label: 'PNG', ext: 'png' },
  { value: 'image/jpeg', label: 'JPG', ext: 'jpg' },
  { value: 'image/webp', label: 'WebP', ext: 'webp' },
];

export default function ConvertImagePage() {
  const t = useTranslations();
  const [file, setFile] = useState<File | null>(null);
  const [format, setFormat] = useState<OutputFormat>('image/png');
  const [processing, setProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [result, setResult] = useState<Blob | null>(null);

  const handleFiles = (files: File[]) => {
    setFile(files[0]);
    setResult(null);
  };

  const handleConvert = async () => {
    if (!file) return;
    setProcessing(true);
    setProgress(50);

    try {
      const converted = await convertImage(file, format);
      setProgress(100);
      setResult(converted);
    } catch (error) {
      console.error('Conversion failed:', error);
    } finally {
      setProcessing(false);
    }
  };

  const selectedFormat = formats.find((f) => f.value === format)!;

  return (
    <div className="max-w-4xl mx-auto px-4 py-12">
      <div className="text-center mb-8">
        <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-100 rounded-2xl mb-4">
          <span className="text-3xl">🔄</span>
        </div>
        <h1 className="text-3xl font-bold text-gray-900">{t('tools.convertImage.title')}</h1>
        <p className="text-gray-600 mt-2">{t('tools.convertImage.description')}</p>
      </div>

      {!file ? (
        <FileUploader
          accept={{ 'image/*': ['.png', '.jpg', '.jpeg', '.webp', '.bmp', '.gif'] }}
          multiple={false} files={file ? [file] : []} onFilesSelected={handleFiles} onRemoveFile={() => setFile(null)}
        />
      ) : !result ? (
        <div className="bg-white rounded-xl p-8 shadow-sm border border-gray-100">
          <div className="flex items-center gap-4 mb-6">
            <img
              src={URL.createObjectURL(file)}
              alt="Preview"
              className="w-20 h-20 object-cover rounded-lg border border-gray-200"
            />
            <div>
              <p className="font-medium text-gray-900">{file.name}</p>
              <p className="text-sm text-gray-500">{file.type}</p>
            </div>
          </div>

          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-3">{t('common.format')}</label>
            <div className="flex gap-3">
              {formats.map((f) => (
                <button
                  key={f.value}
                  onClick={() => setFormat(f.value)}
                  className={`flex-1 py-3 rounded-lg border-2 font-medium transition-colors ${
                    format === f.value ? 'border-[#4B83FF] bg-blue-50 text-[#4B83FF]' : 'border-gray-200 text-gray-600 hover:border-gray-300'
                  }`}
                >
                  {f.label}
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
            {processing ? t('common.processing') : t('tools.convertImage.title')}
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
              onClick={() => downloadBlob(result, changeFileExtension(file.name, selectedFormat.ext))}
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
