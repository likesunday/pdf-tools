'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { useTranslations } from 'next-intl';
import FileUploader from '@/components/shared/FileUploader';
import ProgressBar from '@/components/shared/ProgressBar';
import { addPageNumbers, Position, NumberFormat } from '@/lib/pdf/pageNumbers';
import { readFileAsArrayBuffer } from '@/lib/utils/fileHelpers';
import { downloadBlob } from '@/lib/utils/download';
import { getPdfjs } from '@/lib/pdf/pdfjs-init';
import ErrorMessage from '@/components/shared/ErrorMessage';

const POSITIONS: { value: Position; row: number; col: number }[] = [
  { value: 'top-left', row: 0, col: 0 },
  { value: 'top-center', row: 0, col: 1 },
  { value: 'top-right', row: 0, col: 2 },
  { value: 'bottom-left', row: 1, col: 0 },
  { value: 'bottom-center', row: 1, col: 1 },
  { value: 'bottom-right', row: 1, col: 2 },
];

export default function AddPageNumbersPage() {
  const t = useTranslations();
  const tp = useTranslations('pageNumbers');
  const tc = useTranslations('common');
  const [file, setFile] = useState<File | null>(null);
  const [position, setPosition] = useState<Position>('bottom-center');
  const [fontSize, setFontSize] = useState(12);
  const [startNumber, setStartNumber] = useState(1);
  const [format, setFormat] = useState<NumberFormat>('number');
  const [error, setError] = useState('');
  const [processing, setProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [result, setResult] = useState<Blob | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const renderPreview = useCallback(async () => {
    if (!file || !canvasRef.current) return;
    try {
      const buffer = await readFileAsArrayBuffer(file);
      const pdfjsLib = await getPdfjs();
      const pdf = await pdfjsLib.getDocument({ data: buffer }).promise;
      const page = await pdf.getPage(1);
      const containerWidth = canvasRef.current.parentElement?.clientWidth || 300;
      const viewport = page.getViewport({ scale: 1 });
      const scale = containerWidth / viewport.width;
      const scaledViewport = page.getViewport({ scale });
      canvasRef.current.width = scaledViewport.width;
      canvasRef.current.height = scaledViewport.height;
      const ctx = canvasRef.current.getContext('2d')!;
      await page.render({ canvasContext: ctx, viewport: scaledViewport }).promise;
    } catch {}
  }, [file]);

  useEffect(() => {
    if (file) renderPreview();
  }, [file, renderPreview]);

  const handleFiles = (files: File[]) => {
    setFile(files[0]);
    setResult(null);
    setError('');
  };

  const handleApply = async () => {
    if (!file) return;
    setProcessing(true);
    setProgress(30);

    try {
      const buffer = await readFileAsArrayBuffer(file);
      setProgress(60);
      const modified = await addPageNumbers(buffer, { position, fontSize, startNumber, format });
      setProgress(100);
      setResult(new Blob([(modified as any)], { type: 'application/pdf' }));
    } catch {
      setError('Processing failed. Please try a different file.');
    } finally {
      setProcessing(false);
    }
  };

  const getPreviewPosition = (): React.CSSProperties => {
    const posMap: Record<Position, React.CSSProperties> = {
      'top-left': { top: '8%', left: '10%' },
      'top-center': { top: '8%', left: '50%', transform: 'translateX(-50%)' },
      'top-right': { top: '8%', right: '10%' },
      'bottom-left': { bottom: '8%', left: '10%' },
      'bottom-center': { bottom: '8%', left: '50%', transform: 'translateX(-50%)' },
      'bottom-right': { bottom: '8%', right: '10%' },
    };
    return posMap[position];
  };

  const getPreviewText = () => {
    if (format === 'pageOf') return `Page ${startNumber} of 5`;
    return String(startNumber);
  };

  if (result) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-12">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-100 rounded-2xl mb-4">
            <span className="text-3xl">🔢</span>
          </div>
          <h1 className="text-3xl font-bold text-gray-900">{t('tools.addPageNumbers.title')}</h1>
        </div>
        <div className="bg-white rounded-xl p-8 shadow-sm border border-gray-100 text-center">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <div className="flex gap-3 justify-center">
            <button
              onClick={() => downloadBlob(result, `numbered_${file!.name}`)}
              className="bg-[#4B83FF] hover:bg-[#3A6FE0] text-white font-medium px-6 py-3 rounded-lg transition-colors"
            >
              {tc('download')}
            </button>
            <button
              onClick={() => { setFile(null); setResult(null); }}
              className="px-6 py-3 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
            >
              {tc('reset')}
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!file) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-12">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-100 rounded-2xl mb-4">
            <span className="text-3xl">🔢</span>
          </div>
          <h1 className="text-3xl font-bold text-gray-900">{t('tools.addPageNumbers.title')}</h1>
          <p className="text-gray-600 mt-2">{t('tools.addPageNumbers.description')}</p>
        </div>
        <FileUploader accept={{ 'application/pdf': ['.pdf'] }} multiple={false} files={[]} onFilesSelected={handleFiles} />
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <div className="text-center mb-6">
        <h1 className="text-2xl font-bold text-gray-900">{t('tools.addPageNumbers.title')}</h1>
        <p className="text-gray-600 mt-1 text-sm">{t('tools.addPageNumbers.description')}</p>
      </div>

      {error && <ErrorMessage message={error} />}

      <div className="flex flex-col lg:flex-row gap-6">
        {/* Left: Preview */}
        <div className="lg:w-1/2">
          <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 sticky top-4">
            <div className="text-sm font-medium text-gray-500 mb-2">{tp('preview')}</div>
            <div className="relative bg-gray-50 rounded-lg overflow-hidden flex items-center justify-center min-h-[350px]">
              <canvas ref={canvasRef} className="max-w-full h-auto" />
              <span
                style={{
                  ...getPreviewPosition(),
                  position: 'absolute',
                  fontSize: `${Math.max(10, fontSize * 0.8)}px`,
                  color: 'rgba(0,0,0,0.8)',
                  fontFamily: 'Helvetica, sans-serif',
                  pointerEvents: 'none',
                }}
              >
                {getPreviewText()}
              </span>
            </div>
          </div>
        </div>

        {/* Right: Settings */}
        <div className="lg:w-1/2">
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 space-y-5">
            {/* Position grid */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">{tc('position')}</label>
              <div className="grid grid-cols-3 gap-1.5 w-fit">
                {POSITIONS.map(({ value }) => (
                  <button
                    key={value}
                    onClick={() => setPosition(value)}
                    className={`w-12 h-10 rounded-md border-2 flex items-center justify-center transition-all ${
                      position === value ? 'border-[#4B83FF] bg-blue-50' : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div className={`w-2 h-2 rounded-full ${position === value ? 'bg-[#4B83FF]' : 'bg-gray-400'}`} />
                  </button>
                ))}
              </div>
            </div>

            {/* Format */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">{tp('format')}</label>
              <div className="flex gap-2">
                <button
                  onClick={() => setFormat('number')}
                  className={`flex-1 py-2 px-3 rounded-lg border-2 text-sm font-medium transition-colors ${
                    format === 'number' ? 'border-[#4B83FF] bg-blue-50 text-[#4B83FF]' : 'border-gray-200 text-gray-600'
                  }`}
                >
                  {tp('formatNumber')}
                </button>
                <button
                  onClick={() => setFormat('pageOf')}
                  className={`flex-1 py-2 px-3 rounded-lg border-2 text-sm font-medium transition-colors ${
                    format === 'pageOf' ? 'border-[#4B83FF] bg-blue-50 text-[#4B83FF]' : 'border-gray-200 text-gray-600'
                  }`}
                >
                  {tp('formatPageOf')}
                </button>
              </div>
            </div>

            {/* Font size */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {tc('fontSize')}: {fontSize}px
              </label>
              <input
                type="range"
                min="8"
                max="24"
                value={fontSize}
                onChange={(e) => setFontSize(parseInt(e.target.value))}
                className="w-full"
              />
            </div>

            {/* Start number */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">{tp('startNumber')}</label>
              <input
                type="number"
                min={1}
                value={startNumber}
                onChange={(e) => setStartNumber(Math.max(1, parseInt(e.target.value) || 1))}
                className="w-20 px-3 py-2 border border-gray-300 rounded-lg text-sm"
              />
            </div>

            {processing && <ProgressBar progress={progress} label={tc('processing')} />}

            <button
              onClick={handleApply}
              disabled={processing}
              className="w-full bg-[#4B83FF] hover:bg-[#3A6FE0] disabled:bg-gray-300 text-white font-medium py-3 rounded-lg transition-colors"
            >
              {processing ? tc('processing') : t('tools.addPageNumbers.title')}
            </button>

            <button
              onClick={() => setFile(null)}
              className="w-full text-sm text-gray-500 hover:text-gray-700 py-2"
            >
              {tc('reset')}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
