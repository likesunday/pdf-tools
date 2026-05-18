'use client';

import { useState, useCallback } from 'react';
import { useTranslations } from 'next-intl';
import FileUploader from '@/components/shared/FileUploader';
import ProgressBar from '@/components/shared/ProgressBar';
import { removePages } from '@/lib/pdf/removePages';
import { readFileAsArrayBuffer } from '@/lib/utils/fileHelpers';
import { downloadBlob } from '@/lib/utils/download';
import { getPdfjs } from '@/lib/pdf/pdfjs-init';
import ErrorMessage from '@/components/shared/ErrorMessage';

interface PageThumb {
  dataUrl: string;
  selected: boolean;
}

export default function RemovePagesPage() {
  const t = useTranslations();
  const tr = useTranslations('removePages');
  const tc = useTranslations('common');
  const [file, setFile] = useState<File | null>(null);
  const [pages, setPages] = useState<PageThumb[]>([]);
  const [error, setError] = useState('');
  const [processing, setProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [result, setResult] = useState<Blob | null>(null);
  const [loading, setLoading] = useState(false);
  const [lastClickedIndex, setLastClickedIndex] = useState<number | null>(null);

  const loadPages = useCallback(async (file: File) => {
    setLoading(true);
    try {
      const buffer = await readFileAsArrayBuffer(file);
      const pdfjsLib = await getPdfjs();
      const pdf = await pdfjsLib.getDocument({ data: buffer }).promise;
      const thumbs: PageThumb[] = [];

      for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i);
        const viewport = page.getViewport({ scale: 0.25 });
        const canvas = document.createElement('canvas');
        canvas.width = viewport.width;
        canvas.height = viewport.height;
        const ctx = canvas.getContext('2d')!;
        await page.render({ canvasContext: ctx, viewport }).promise;
        thumbs.push({ dataUrl: canvas.toDataURL(), selected: false });
      }
      setPages(thumbs);
    } catch {
      setError('Failed to load PDF pages');
    } finally {
      setLoading(false);
    }
  }, []);

  const handleFiles = (files: File[]) => {
    const f = files[0];
    setFile(f);
    setResult(null);
    setError('');
    loadPages(f);
  };

  const togglePage = (index: number, shiftKey: boolean) => {
    if (shiftKey && lastClickedIndex !== null) {
      const start = Math.min(lastClickedIndex, index);
      const end = Math.max(lastClickedIndex, index);
      setPages(prev => prev.map((p, i) => {
        if (i >= start && i <= end) return { ...p, selected: true };
        return p;
      }));
    } else {
      setPages(prev => {
        const updated = [...prev];
        updated[index] = { ...updated[index], selected: !updated[index].selected };
        return updated;
      });
    }
    setLastClickedIndex(index);
  };

  const selectedCount = pages.filter(p => p.selected).length;

  const handleRemove = async () => {
    if (!file || selectedCount === 0) return;
    setProcessing(true);
    setProgress(30);

    try {
      const buffer = await readFileAsArrayBuffer(file);
      setProgress(60);
      const pagesToRemove = pages
        .map((p, i) => p.selected ? i : -1)
        .filter(i => i >= 0);
      const modified = await removePages(buffer, pagesToRemove);
      setProgress(100);
      setResult(new Blob([(modified as any)], { type: 'application/pdf' }));
    } catch {
      setError('Processing failed. Please try a different file.');
    } finally {
      setProcessing(false);
    }
  };

  if (result) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-12">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-100 rounded-2xl mb-4">
            <span className="text-3xl">🗑️</span>
          </div>
          <h1 className="text-3xl font-bold text-gray-900">{t('tools.removePages.title')}</h1>
        </div>
        <div className="bg-white rounded-xl p-8 shadow-sm border border-gray-100 text-center">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <p className="text-gray-600 mb-4">{selectedCount} pages removed</p>
          <div className="flex gap-3 justify-center">
            <button
              onClick={() => downloadBlob(result, `modified_${file!.name}`)}
              className="bg-[#4B83FF] hover:bg-[#3A6FE0] text-white font-medium px-6 py-3 rounded-lg transition-colors"
            >
              {tc('download')}
            </button>
            <button
              onClick={() => { setFile(null); setResult(null); setPages([]); }}
              className="px-6 py-3 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
            >
              {tc('reset')}
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-4 py-12">
      <div className="text-center mb-8">
        <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-100 rounded-2xl mb-4">
          <span className="text-3xl">🗑️</span>
        </div>
        <h1 className="text-3xl font-bold text-gray-900">{t('tools.removePages.title')}</h1>
        <p className="text-gray-600 mt-2">{t('tools.removePages.description')}</p>
      </div>

      {error && <ErrorMessage message={error} />}

      {!file ? (
        <FileUploader accept={{ 'application/pdf': ['.pdf'] }} multiple={false} files={[]} onFilesSelected={handleFiles} />
      ) : loading ? (
        <div className="text-center py-12">
          <div className="animate-spin w-8 h-8 border-2 border-[#4B83FF] border-t-transparent rounded-full mx-auto mb-4" />
          <p className="text-gray-500">{tc('processing')}</p>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="text-center">
            <p className="text-sm text-gray-500">{tr('clickToSelect')}</p>
            <p className="text-xs text-gray-400">{tr('shiftSelect')}</p>
          </div>

          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-3">
            {pages.map((page, index) => (
              <div
                key={index}
                onClick={(e) => togglePage(index, e.shiftKey)}
                className={`relative cursor-pointer rounded-lg border-2 p-2 transition-all ${
                  page.selected
                    ? 'border-red-400 bg-red-50 shadow-sm'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <div className="aspect-[3/4] flex items-center justify-center overflow-hidden rounded">
                  <img src={page.dataUrl} alt={`Page ${index + 1}`} className="max-w-full max-h-full object-contain" />
                </div>
                <p className="text-[10px] text-center text-gray-500 mt-1">{index + 1}</p>
                {page.selected && (
                  <div className="absolute inset-0 bg-red-500/10 rounded-lg flex items-center justify-center">
                    <div className="w-8 h-8 bg-red-500 rounded-full flex items-center justify-center">
                      <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Bottom bar */}
          <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 flex items-center justify-between">
            <div className="flex gap-6 text-sm">
              <span className="text-gray-500">{tr('totalPages')}: <strong>{pages.length}</strong></span>
              <span className={selectedCount > 0 ? 'text-red-600' : 'text-gray-500'}>
                {tr('pagesToRemove')}: <strong>{selectedCount}</strong>
              </span>
            </div>

            {processing && <ProgressBar progress={progress} label={tc('processing')} />}

            <button
              onClick={handleRemove}
              disabled={processing || selectedCount === 0 || selectedCount >= pages.length}
              className="bg-[#4B83FF] hover:bg-[#3A6FE0] disabled:bg-gray-300 text-white font-medium px-6 py-2.5 rounded-lg transition-colors"
            >
              {processing ? tc('processing') : t('tools.removePages.title')}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
