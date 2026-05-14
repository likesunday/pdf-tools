'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import FileUploader from '@/components/shared/FileUploader';
import ProgressBar from '@/components/shared/ProgressBar';
import { splitPdfByPage } from '@/lib/pdf/split';
import { readFileAsArrayBuffer, formatFileSize } from '@/lib/utils/fileHelpers';
import { downloadBlob } from '@/lib/utils/download';
import ErrorMessage from '@/components/shared/ErrorMessage';

export default function SplitPdfPage() {
  const t = useTranslations();
  const [file, setFile] = useState<File | null>(null);
  const [error, setError] = useState('');
  const [processing, setProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [results, setResults] = useState<Blob[]>([]);

  const handleFiles = (files: File[]) => {
    setFile(files[0]);
    setResults([]);
  };

  const handleSplit = async () => {
    if (!file) return;
    setProcessing(true);
    setProgress(30);

    try {
      const buffer = await readFileAsArrayBuffer(file);
      setProgress(50);
      const pages = await splitPdfByPage(buffer);
      setProgress(90);
      const blobs = pages.map((p) => new Blob([(p as any)], { type: 'application/pdf' }));
      setResults(blobs);
      setProgress(100);
    } catch (error) {
      setError('Processing failed. Please try a different file.');
    } finally {
      setProcessing(false);
    }
  };

  const handleDownload = (index: number) => {
    downloadBlob(results[index], `page_${index + 1}.pdf`);
  };

  const handleDownloadAll = () => {
    results.forEach((blob, i) => {
      setTimeout(() => downloadBlob(blob, `page_${i + 1}.pdf`), i * 200);
    });
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-12">
      <div className="text-center mb-8">
        <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-100 rounded-2xl mb-4">
          <span className="text-3xl">✂️</span>
        </div>
        <h1 className="text-3xl font-bold text-gray-900">{t('tools.splitPdf.title')}</h1>
        <p className="text-gray-600 mt-2">{t('tools.splitPdf.description')}</p>
      </div>

      {!file ? (
        <FileUploader accept={{ 'application/pdf': ['.pdf'] }} multiple={false} files={file ? [file] : []} onFilesSelected={handleFiles} onRemoveFile={() => setFile(null)} />
      ) : results.length === 0 ? (
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

          {processing && <ProgressBar progress={progress} label={t('common.processing')} />}

          <button
            onClick={handleSplit}
            disabled={processing}
            className="w-full bg-[#4B83FF] hover:bg-[#3A6FE0] disabled:bg-gray-300 text-white font-medium py-3 rounded-lg transition-colors mt-4"
          >
            {processing ? t('common.processing') : t('tools.splitPdf.title')}
          </button>
        </div>
      ) : (
        <div className="bg-white rounded-xl p-8 shadow-sm border border-gray-100">
          <div className="text-center mb-6">
            <p className="text-green-600 font-medium">Split into {results.length} pages</p>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 mb-6">
            {results.map((_, index) => (
              <button
                key={index}
                onClick={() => handleDownload(index)}
                className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 text-center transition-colors"
              >
                <span className="text-2xl block mb-1">📄</span>
                <span className="text-xs text-gray-600">Page {index + 1}</span>
              </button>
            ))}
          </div>
          <div className="flex gap-3 justify-center">
            <button
              onClick={handleDownloadAll}
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
