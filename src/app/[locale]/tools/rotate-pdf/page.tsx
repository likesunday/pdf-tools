'use client';

import { useState, useCallback } from 'react';
import { useTranslations } from 'next-intl';
import FileUploader from '@/components/shared/FileUploader';
import ProgressBar from '@/components/shared/ProgressBar';
import { rotatePdf, RotationAngle } from '@/lib/pdf/rotate';
import { readFileAsArrayBuffer } from '@/lib/utils/fileHelpers';
import { downloadBlob } from '@/lib/utils/download';
import { getPdfjs } from '@/lib/pdf/pdfjs-init';
import ErrorMessage from '@/components/shared/ErrorMessage';

interface PageThumb {
  dataUrl: string;
  rotation: RotationAngle;
  isPortrait: boolean;
}

export default function RotatePdfPage() {
  const t = useTranslations();
  const tr = useTranslations('rotate');
  const tc = useTranslations('common');
  const [file, setFile] = useState<File | null>(null);
  const [pages, setPages] = useState<PageThumb[]>([]);
  const [globalDirection, setGlobalDirection] = useState<'right' | 'left'>('right');
  const [error, setError] = useState('');
  const [processing, setProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [result, setResult] = useState<Blob | null>(null);
  const [loading, setLoading] = useState(false);

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
        thumbs.push({
          dataUrl: canvas.toDataURL(),
          rotation: 0,
          isPortrait: viewport.height > viewport.width,
        });
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

  const rotatePage = (index: number, direction: 'left' | 'right') => {
    setPages(prev => {
      const updated = [...prev];
      const delta = direction === 'right' ? 90 : 270;
      const current = updated[index].rotation;
      updated[index] = { ...updated[index], rotation: ((current + delta) % 360) as RotationAngle };
      return updated;
    });
  };

  const rotateSelected = (filter: 'all' | 'portrait' | 'landscape') => {
    const delta = globalDirection === 'right' ? 90 : 270;
    setPages(prev => prev.map(p => {
      if (filter === 'all' || (filter === 'portrait' && p.isPortrait) || (filter === 'landscape' && !p.isPortrait)) {
        return { ...p, rotation: ((p.rotation + delta) % 360) as RotationAngle };
      }
      return p;
    }));
  };

  const resetAll = () => {
    setPages(prev => prev.map(p => ({ ...p, rotation: 0 })));
  };

  const handleRotate = async () => {
    if (!file) return;
    setProcessing(true);
    setProgress(30);

    try {
      let buffer = await readFileAsArrayBuffer(file);
      setProgress(50);

      for (let i = 0; i < pages.length; i++) {
        if (pages[i].rotation !== 0) {
          buffer = (await rotatePdf(buffer, pages[i].rotation, [i])).buffer as ArrayBuffer;
        }
      }

      const finalResult = await rotatePdf(buffer, 0);
      setProgress(100);
      setResult(new Blob([(finalResult as any)], { type: 'application/pdf' }));
    } catch {
      setError('Processing failed.');
    } finally {
      setProcessing(false);
    }
  };

  const hasRotation = pages.some(p => p.rotation !== 0);

  if (result) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-12">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-100 rounded-2xl mb-4">
            <span className="text-3xl">🔄</span>
          </div>
          <h1 className="text-3xl font-bold text-gray-900">{t('tools.rotatePdf.title')}</h1>
        </div>
        <div className="bg-white rounded-xl p-8 shadow-sm border border-gray-100 text-center">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <div className="flex gap-3 justify-center">
            <button
              onClick={() => downloadBlob(result, `rotated_${file!.name}`)}
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
          <span className="text-3xl">🔄</span>
        </div>
        <h1 className="text-3xl font-bold text-gray-900">{t('tools.rotatePdf.title')}</h1>
        <p className="text-gray-600 mt-2">{t('tools.rotatePdf.description')}</p>
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
        <div className="flex flex-col lg:flex-row gap-6">
          {/* Page thumbnails */}
          <div className="flex-1">
            <p className="text-sm text-gray-500 mb-3">{tr('clickToRotate')}</p>
            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-3">
              {pages.map((page, index) => (
                <div key={index} className="relative bg-white border border-gray-200 rounded-lg p-2 group">
                  <div className="aspect-[3/4] flex items-center justify-center overflow-hidden rounded">
                    <img
                      src={page.dataUrl}
                      alt={`Page ${index + 1}`}
                      className="max-w-full max-h-full object-contain transition-transform"
                      style={{ transform: `rotate(${page.rotation}deg)` }}
                    />
                  </div>
                  <div className="absolute inset-0 flex items-center justify-between px-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={() => rotatePage(index, 'left')}
                      className="w-7 h-7 bg-white/90 rounded-full shadow flex items-center justify-center text-gray-700 hover:bg-[#4B83FF] hover:text-white"
                    >
                      ↺
                    </button>
                    <button
                      onClick={() => rotatePage(index, 'right')}
                      className="w-7 h-7 bg-white/90 rounded-full shadow flex items-center justify-center text-gray-700 hover:bg-[#4B83FF] hover:text-white"
                    >
                      ↻
                    </button>
                  </div>
                  <p className="text-[10px] text-center text-gray-500 mt-1">{index + 1}</p>
                  {page.rotation !== 0 && (
                    <div className="absolute top-1 right-1 w-5 h-5 bg-[#4B83FF] text-white rounded-full flex items-center justify-center text-[9px]">
                      {page.rotation}°
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Controls panel */}
          <div className="lg:w-64 shrink-0">
            <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100 space-y-5 sticky top-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">{tr('selectPages')}</label>
                <div className="flex gap-1.5">
                  <button onClick={() => rotateSelected('all')} className="flex-1 py-1.5 px-2 text-xs border border-gray-200 rounded-md hover:border-[#4B83FF] hover:text-[#4B83FF]">{tr('selectAll')}</button>
                  <button onClick={() => rotateSelected('portrait')} className="flex-1 py-1.5 px-2 text-xs border border-gray-200 rounded-md hover:border-[#4B83FF] hover:text-[#4B83FF]">{tr('selectPortrait')}</button>
                  <button onClick={() => rotateSelected('landscape')} className="flex-1 py-1.5 px-2 text-xs border border-gray-200 rounded-md hover:border-[#4B83FF] hover:text-[#4B83FF]">{tr('selectLandscape')}</button>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">{tr('direction')}</label>
                <div className="flex gap-2">
                  <button
                    onClick={() => setGlobalDirection('left')}
                    className={`flex-1 py-2 rounded-lg border-2 text-sm font-medium transition-colors ${
                      globalDirection === 'left' ? 'border-[#4B83FF] bg-blue-50 text-[#4B83FF]' : 'border-gray-200 text-gray-600'
                    }`}
                  >
                    ↺ {tr('rotateLeft')}
                  </button>
                  <button
                    onClick={() => setGlobalDirection('right')}
                    className={`flex-1 py-2 rounded-lg border-2 text-sm font-medium transition-colors ${
                      globalDirection === 'right' ? 'border-[#4B83FF] bg-blue-50 text-[#4B83FF]' : 'border-gray-200 text-gray-600'
                    }`}
                  >
                    ↻ {tr('rotateRight')}
                  </button>
                </div>
              </div>

              <button
                onClick={resetAll}
                className="w-full text-sm text-gray-500 hover:text-[#4B83FF] py-1"
              >
                {tr('resetAll')}
              </button>

              {processing && <ProgressBar progress={progress} label={tc('processing')} />}

              <button
                onClick={handleRotate}
                disabled={processing || !hasRotation}
                className="w-full bg-[#4B83FF] hover:bg-[#3A6FE0] disabled:bg-gray-300 text-white font-medium py-3 rounded-lg transition-colors"
              >
                {processing ? tc('processing') : t('tools.rotatePdf.title')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
