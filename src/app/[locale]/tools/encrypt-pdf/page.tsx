'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import FileUploader from '@/components/shared/FileUploader';
import ProgressBar from '@/components/shared/ProgressBar';
import { encryptPdf } from '@/lib/pdf/encrypt';
import { readFileAsArrayBuffer } from '@/lib/utils/fileHelpers';
import { downloadBlob } from '@/lib/utils/download';

export default function EncryptPdfPage() {
  const t = useTranslations();
  const [file, setFile] = useState<File | null>(null);
  const [password, setPassword] = useState('');
  const [processing, setProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [result, setResult] = useState<Blob | null>(null);

  const handleFiles = (files: File[]) => {
    setFile(files[0]);
    setResult(null);
  };

  const handleEncrypt = async () => {
    if (!file || !password) return;
    setProcessing(true);
    setProgress(30);

    try {
      const buffer = await readFileAsArrayBuffer(file);
      setProgress(60);
      const encrypted = await encryptPdf(buffer, password);
      setProgress(100);
      setResult(new Blob([(encrypted as any)], { type: 'application/pdf' }));
    } catch (error) {
      console.error('Encrypt failed:', error);
    } finally {
      setProcessing(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-12">
      <div className="text-center mb-8">
        <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-100 rounded-2xl mb-4">
          <span className="text-3xl">🔒</span>
        </div>
        <h1 className="text-3xl font-bold text-gray-900">{t('tools.encryptPdf.title')}</h1>
        <p className="text-gray-600 mt-2">{t('tools.encryptPdf.description')}</p>
      </div>

      {!file ? (
        <FileUploader accept={{ 'application/pdf': ['.pdf'] }} multiple={false} files={file ? [file] : []} onFilesSelected={handleFiles} onRemoveFile={() => setFile(null)} />
      ) : !result ? (
        <div className="bg-white rounded-xl p-8 shadow-sm border border-gray-100">
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">{t('common.password')}</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter password"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#4B83FF] focus:border-transparent"
            />
          </div>

          {processing && <ProgressBar progress={progress} label={t('common.processing')} />}

          <button
            onClick={handleEncrypt}
            disabled={processing || !password}
            className="w-full bg-[#4B83FF] hover:bg-[#3A6FE0] disabled:bg-gray-300 text-white font-medium py-3 rounded-lg transition-colors mt-4"
          >
            {processing ? t('common.processing') : t('tools.encryptPdf.title')}
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
              onClick={() => downloadBlob(result, `encrypted_${file.name}`)}
              className="bg-[#4B83FF] hover:bg-[#3A6FE0] text-white font-medium px-6 py-3 rounded-lg transition-colors"
            >
              {t('common.download')}
            </button>
            <button
              onClick={() => { setFile(null); setResult(null); setPassword(''); }}
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
