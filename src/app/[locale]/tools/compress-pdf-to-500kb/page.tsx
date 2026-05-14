'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import FileUploader from '@/components/shared/FileUploader';
import ProgressBar from '@/components/shared/ProgressBar';
import { compressPdf } from '@/lib/pdf/compress';
import { readFileAsArrayBuffer, formatFileSize } from '@/lib/utils/fileHelpers';
import { downloadBlob } from '@/lib/utils/download';

export default function CompressPdfTo500kbPage() {
  const t = useTranslations();
  const [file, setFile] = useState<File | null>(null);
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
    setProgress(20);
    setError('');

    try {
      const buffer = await readFileAsArrayBuffer(file);
      const targetSize = 500 * 1024; // 500KB
      let quality = 0.5;
      let compressed: Uint8Array;
      let blob: Blob;

      // Iteratively compress until under 500KB
      for (let attempt = 0; attempt < 5; attempt++) {
        setProgress(20 + attempt * 15);
        compressed = await compressPdf(buffer, { quality });
        blob = new Blob([(compressed as any)], { type: 'application/pdf' });
        if (blob.size <= targetSize || quality <= 0.1) break;
        quality -= 0.1;
      }

      setResult({ blob: blob!, size: blob!.size });
      setProgress(100);

      if (blob!.size > targetSize) {
        setError('Could not compress below 500KB. Try a file with fewer pages.');
      }
    } catch (err) {
      setError('Compression failed. Please try again.');
    } finally {
      setProcessing(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-12">
      <div className="text-center mb-8">
        <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-100 rounded-2xl mb-4">
          <span className="text-3xl">📦</span>
        </div>
        <h1 className="text-3xl font-bold text-gray-900">
          {t('tools.compressPdfTo500kb.title')}
        </h1>
        <p className="text-gray-600 mt-2">{t('tools.compressPdfTo500kb.description')}</p>
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

          {error && <div className="mt-4 p-3 bg-red-50 text-red-600 rounded-lg text-sm">{error}</div>}
          {processing && <ProgressBar progress={progress} label={t('common.processing')} />}

          <button
            onClick={handleCompress}
            disabled={processing}
            className="w-full bg-[#4B83FF] hover:bg-[#3A6FE0] disabled:bg-gray-300 text-white font-medium py-3 rounded-lg transition-colors mt-4"
          >
            {processing ? t('common.processing') : t('tools.compressPdfTo500kb.title')}
          </button>
        </div>
      ) : (
        <div className="bg-white rounded-xl p-8 shadow-sm border border-gray-100 text-center">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <div className="mb-6">
            <p className="text-gray-600">{formatFileSize(file.size)} → {formatFileSize(result.size)}</p>
            <p className="text-green-600 font-medium">{Math.round((1 - result.size / file.size) * 100)}% smaller</p>
          </div>
          {error && <div className="mb-4 p-3 bg-yellow-50 text-yellow-700 rounded-lg text-sm">{error}</div>}
          <div className="flex gap-3 justify-center">
            <button
              onClick={() => downloadBlob(result.blob, `compressed_500kb_${file.name}`)}
              className="bg-[#4B83FF] hover:bg-[#3A6FE0] text-white font-medium px-6 py-3 rounded-lg transition-colors"
            >
              {t('common.download')}
            </button>
            <button
              onClick={() => { setFile(null); setResult(null); setError(''); }}
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
