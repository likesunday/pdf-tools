'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import FileUploader from '@/components/shared/FileUploader';
import ProgressBar from '@/components/shared/ProgressBar';
import { rotatePdf, RotationAngle } from '@/lib/pdf/rotate';
import { readFileAsArrayBuffer, formatFileSize } from '@/lib/utils/fileHelpers';
import { downloadBlob } from '@/lib/utils/download';
import ErrorMessage from '@/components/shared/ErrorMessage';

export default function RotatePdfPage() {
  const t = useTranslations();
  const [file, setFile] = useState<File | null>(null);
  const [angle, setAngle] = useState<RotationAngle>(90);
  const [error, setError] = useState('');
  const [processing, setProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [result, setResult] = useState<Blob | null>(null);

  const handleFiles = (files: File[]) => {
    setFile(files[0]);
    setResult(null);
  };

  const handleRotate = async () => {
    if (!file) return;
    setProcessing(true);
    setProgress(30);

    try {
      const buffer = await readFileAsArrayBuffer(file);
      setProgress(60);
      const rotated = await rotatePdf(buffer, angle);
      setProgress(100);
      setResult(new Blob([(rotated as any)], { type: 'application/pdf' }));
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
          <span className="text-3xl">🔄</span>
        </div>
        <h1 className="text-3xl font-bold text-gray-900">{t('tools.rotatePdf.title')}</h1>
        <p className="text-gray-600 mt-2">{t('tools.rotatePdf.description')}</p>
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
            <label className="block text-sm font-medium text-gray-700 mb-3">{t('common.rotation')}</label>
            <div className="flex gap-3">
              {([90, 180, 270] as RotationAngle[]).map((a) => (
                <button
                  key={a}
                  onClick={() => setAngle(a)}
                  className={`flex-1 py-3 rounded-lg border-2 font-medium transition-colors ${
                    angle === a ? 'border-[#4B83FF] bg-blue-50 text-[#4B83FF]' : 'border-gray-200 text-gray-600 hover:border-gray-300'
                  }`}
                >
                  {a}°
                </button>
              ))}
            </div>
          </div>

          {processing && <ProgressBar progress={progress} label={t('common.processing')} />}

          <button
            onClick={handleRotate}
            disabled={processing}
            className="w-full bg-[#4B83FF] hover:bg-[#3A6FE0] disabled:bg-gray-300 text-white font-medium py-3 rounded-lg transition-colors mt-4"
          >
            {processing ? t('common.processing') : t('tools.rotatePdf.title')}
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
              onClick={() => downloadBlob(result, `rotated_${file.name}`)}
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
