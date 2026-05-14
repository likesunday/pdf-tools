'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import FileUploader from '@/components/shared/FileUploader';
import ProgressBar from '@/components/shared/ProgressBar';
import { mergePdfs } from '@/lib/pdf/merge';
import { readFileAsArrayBuffer } from '@/lib/utils/fileHelpers';
import { downloadBlob } from '@/lib/utils/download';

export default function MergePdfPage() {
  const t = useTranslations();
  const [files, setFiles] = useState<File[]>([]);
  const [processing, setProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [result, setResult] = useState<Blob | null>(null);

  const handleFiles = (newFiles: File[]) => {
    setFiles((prev) => [...prev, ...newFiles]);
    setResult(null);
  };

  const removeFile = (index: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const handleMerge = async () => {
    if (files.length < 2) return;
    setProcessing(true);
    setProgress(20);

    try {
      const buffers = await Promise.all(files.map(readFileAsArrayBuffer));
      setProgress(60);
      const merged = await mergePdfs(buffers);
      setProgress(90);
      const blob = new Blob([(merged as any)], { type: 'application/pdf' });
      setResult(blob);
      setProgress(100);
    } catch (error) {
      console.error('Merge failed:', error);
    } finally {
      setProcessing(false);
    }
  };

  const handleDownload = () => {
    if (result) {
      downloadBlob(result, 'merged.pdf');
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-12">
      <div className="text-center mb-8">
        <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-100 rounded-2xl mb-4">
          <span className="text-3xl">🔗</span>
        </div>
        <h1 className="text-3xl font-bold text-gray-900">{t('tools.mergePdf.title')}</h1>
        <p className="text-gray-600 mt-2">{t('tools.mergePdf.description')}</p>
      </div>

      {!result ? (
        <div className="space-y-6">
          <FileUploader
            accept={{ 'application/pdf': ['.pdf'] }}
            multiple
            files={files}
            onFilesSelected={handleFiles}
            onRemoveFile={removeFile}
          />

          {files.length > 0 && (
            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
              {processing && <ProgressBar progress={progress} label={t('common.processing')} />}

              <button
                onClick={handleMerge}
                disabled={processing || files.length < 2}
                className="w-full bg-[#4B83FF] hover:bg-[#3A6FE0] disabled:bg-gray-300 text-white font-medium py-3 rounded-lg transition-colors mt-4"
              >
                {processing ? t('common.processing') : t('tools.mergePdf.title')}
              </button>
            </div>
          )}
        </div>
      ) : (
        <div className="bg-white rounded-xl p-8 shadow-sm border border-gray-100 text-center">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <p className="text-gray-600 mb-6">{files.length} files merged successfully</p>
          <div className="flex gap-3 justify-center">
            <button
              onClick={handleDownload}
              className="bg-[#4B83FF] hover:bg-[#3A6FE0] text-white font-medium px-6 py-3 rounded-lg transition-colors"
            >
              {t('common.download')}
            </button>
            <button
              onClick={() => { setFiles([]); setResult(null); setProgress(0); }}
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
