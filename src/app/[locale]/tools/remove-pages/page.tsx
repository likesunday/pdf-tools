'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import FileUploader from '@/components/shared/FileUploader';
import ProgressBar from '@/components/shared/ProgressBar';
import { removePages } from '@/lib/pdf/removePages';
import { readFileAsArrayBuffer, formatFileSize } from '@/lib/utils/fileHelpers';
import { downloadBlob } from '@/lib/utils/download';
import ErrorMessage from '@/components/shared/ErrorMessage';

export default function RemovePagesPage() {
  const t = useTranslations();
  const [file, setFile] = useState<File | null>(null);
  const [pageInput, setPageInput] = useState('');
  const [error, setError] = useState('');
  const [processing, setProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [result, setResult] = useState<Blob | null>(null);

  const handleFiles = (files: File[]) => {
    setFile(files[0]);
    setResult(null);
  };

  const handleRemove = async () => {
    if (!file || !pageInput.trim()) return;
    setProcessing(true);
    setProgress(30);

    try {
      const pages = pageInput.split(',').map((s) => parseInt(s.trim()) - 1).filter((n) => !isNaN(n));
      const buffer = await readFileAsArrayBuffer(file);
      setProgress(60);
      const modified = await removePages(buffer, pages);
      setProgress(100);
      setResult(new Blob([(modified as any)], { type: 'application/pdf' }));
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
          <span className="text-3xl">🗑️</span>
        </div>
        <h1 className="text-3xl font-bold text-gray-900">{t('tools.removePages.title')}</h1>
        <p className="text-gray-600 mt-2">{t('tools.removePages.description')}</p>
      </div>

      {!file ? (
        <FileUploader accept={{ 'application/pdf': ['.pdf'] }} multiple={false} files={file ? [file] : []} onFilesSelected={handleFiles} onRemoveFile={() => setFile(null)} />
      ) : !result ? (
        <div className="bg-white rounded-xl p-8 shadow-sm border border-gray-100">
          <div className="flex items-center gap-4 mb-6">
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
              <span className="text-xl">📄</span>
            </div>
            <div>
              <p className="font-medium text-gray-900">{file.name}</p>
              <p className="text-sm text-gray-500">{formatFileSize(file.size)}</p>
            </div>
          </div>

          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {t('common.pages')} (e.g., 1, 3, 5)
            </label>
            <input
              type="text"
              value={pageInput}
              onChange={(e) => setPageInput(e.target.value)}
              placeholder="1, 3, 5"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#4B83FF] focus:border-transparent"
            />
          </div>

          {processing && <ProgressBar progress={progress} label={t('common.processing')} />}

          <button
            onClick={handleRemove}
            disabled={processing || !pageInput.trim()}
            className="w-full bg-[#4B83FF] hover:bg-[#3A6FE0] disabled:bg-gray-300 text-white font-medium py-3 rounded-lg transition-colors mt-4"
          >
            {processing ? t('common.processing') : t('tools.removePages.title')}
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
              onClick={() => downloadBlob(result, `modified_${file.name}`)}
              className="bg-[#4B83FF] hover:bg-[#3A6FE0] text-white font-medium px-6 py-3 rounded-lg transition-colors"
            >
              {t('common.download')}
            </button>
            <button
              onClick={() => { setFile(null); setResult(null); setPageInput(''); }}
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
