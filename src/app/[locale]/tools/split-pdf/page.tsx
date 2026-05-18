'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import FileUploader from '@/components/shared/FileUploader';
import ProgressBar from '@/components/shared/ProgressBar';
import { splitPdfByPage, splitPdfByInterval, splitPdfByRanges, getPageCount } from '@/lib/pdf/split';
import { readFileAsArrayBuffer, formatFileSize } from '@/lib/utils/fileHelpers';
import { downloadBlob } from '@/lib/utils/download';
import ErrorMessage from '@/components/shared/ErrorMessage';

type SplitMode = 'page' | 'range' | 'interval';

export default function SplitPdfPage() {
  const t = useTranslations();
  const ts = useTranslations('split');
  const tc = useTranslations('common');
  const [file, setFile] = useState<File | null>(null);
  const [mode, setMode] = useState<SplitMode>('page');
  const [interval, setInterval] = useState(2);
  const [ranges, setRanges] = useState<{ from: number; to: number }[]>([{ from: 1, to: 1 }]);
  const [mergeRanges, setMergeRanges] = useState(false);
  const [totalPages, setTotalPages] = useState(0);
  const [error, setError] = useState('');
  const [processing, setProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [results, setResults] = useState<Blob[]>([]);

  const handleFiles = async (files: File[]) => {
    const f = files[0];
    setFile(f);
    setResults([]);
    setError('');
    try {
      const buffer = await readFileAsArrayBuffer(f);
      const count = await getPageCount(buffer);
      setTotalPages(count);
      setRanges([{ from: 1, to: count }]);
    } catch {
      setTotalPages(0);
    }
  };

  const addRange = () => {
    setRanges(prev => [...prev, { from: 1, to: totalPages }]);
  };

  const updateRange = (index: number, field: 'from' | 'to', value: number) => {
    setRanges(prev => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };
      return updated;
    });
  };

  const removeRange = (index: number) => {
    setRanges(prev => prev.filter((_, i) => i !== index));
  };

  const getResultCount = () => {
    if (mode === 'page') return totalPages;
    if (mode === 'interval') return Math.ceil(totalPages / interval);
    if (mode === 'range') return mergeRanges ? 1 : ranges.length;
    return 0;
  };

  const handleSplit = async () => {
    if (!file) return;
    setProcessing(true);
    setProgress(30);
    setError('');

    try {
      const buffer = await readFileAsArrayBuffer(file);
      setProgress(50);

      let pages: Uint8Array[];
      if (mode === 'page') {
        pages = await splitPdfByPage(buffer);
      } else if (mode === 'interval') {
        pages = await splitPdfByInterval(buffer, interval);
      } else {
        pages = await splitPdfByRanges(buffer, ranges, mergeRanges);
      }

      setProgress(90);
      const blobs = pages.map(p => new Blob([(p as any)], { type: 'application/pdf' }));
      setResults(blobs);
      setProgress(100);
    } catch {
      setError('Processing failed. Please try a different file.');
    } finally {
      setProcessing(false);
    }
  };

  if (results.length > 0) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-12">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-100 rounded-2xl mb-4">
            <span className="text-3xl">✂️</span>
          </div>
          <h1 className="text-3xl font-bold text-gray-900">{t('tools.splitPdf.title')}</h1>
        </div>
        <div className="bg-white rounded-xl p-8 shadow-sm border border-gray-100">
          <div className="text-center mb-6">
            <p className="text-green-600 font-medium">Split into {results.length} files</p>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 mb-6">
            {results.map((_, index) => (
              <button
                key={index}
                onClick={() => downloadBlob(results[index], `part_${index + 1}.pdf`)}
                className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 text-center transition-colors"
              >
                <span className="text-2xl block mb-1">📄</span>
                <span className="text-xs text-gray-600">Part {index + 1}</span>
              </button>
            ))}
          </div>
          <div className="flex gap-3 justify-center">
            <button
              onClick={() => results.forEach((b, i) => setTimeout(() => downloadBlob(b, `part_${i + 1}.pdf`), i * 200))}
              className="bg-[#4B83FF] hover:bg-[#3A6FE0] text-white font-medium px-6 py-3 rounded-lg transition-colors"
            >
              {tc('downloadAll')}
            </button>
            <button
              onClick={() => { setFile(null); setResults([]); }}
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
    <div className="max-w-4xl mx-auto px-4 py-12">
      <div className="text-center mb-8">
        <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-100 rounded-2xl mb-4">
          <span className="text-3xl">✂️</span>
        </div>
        <h1 className="text-3xl font-bold text-gray-900">{t('tools.splitPdf.title')}</h1>
        <p className="text-gray-600 mt-2">{t('tools.splitPdf.description')}</p>
      </div>

      {error && <ErrorMessage message={error} />}

      {!file ? (
        <FileUploader accept={{ 'application/pdf': ['.pdf'] }} multiple={false} files={[]} onFilesSelected={handleFiles} onRemoveFile={() => setFile(null)} />
      ) : (
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <div className="flex items-center gap-4 mb-6 pb-4 border-b border-gray-100">
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
              <span className="text-lg">📄</span>
            </div>
            <div>
              <p className="font-medium text-gray-900">{file.name}</p>
              <p className="text-sm text-gray-500">{formatFileSize(file.size)} • {totalPages} {tc('pages').toLowerCase()}</p>
            </div>
          </div>

          {/* Mode tabs */}
          <div className="flex rounded-lg bg-gray-100 p-1 mb-6">
            {(['page', 'range', 'interval'] as SplitMode[]).map(m => (
              <button
                key={m}
                onClick={() => setMode(m)}
                className={`flex-1 py-2 px-3 rounded-md text-sm font-medium transition-colors ${
                  mode === m ? 'bg-white shadow-sm text-[#4B83FF]' : 'text-gray-600 hover:text-gray-800'
                }`}
              >
                {m === 'page' ? ts('splitByPage') : m === 'range' ? ts('splitByRange') : ts('splitByInterval')}
              </button>
            ))}
          </div>

          {/* Mode content */}
          {mode === 'page' && (
            <div className="mb-6 p-4 bg-gray-50 rounded-lg">
              <p className="text-sm text-gray-600">{ts('everyPage')}</p>
              <p className="text-xs text-gray-400 mt-1">{ts('willCreate', { count: totalPages })}</p>
            </div>
          )}

          {mode === 'interval' && (
            <div className="mb-6 space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">{ts('interval')}</label>
                <input
                  type="number"
                  min={1}
                  max={totalPages}
                  value={interval}
                  onChange={(e) => setInterval(Math.max(1, parseInt(e.target.value) || 1))}
                  className="w-24 px-3 py-2 border border-gray-300 rounded-lg text-sm"
                />
              </div>
              <p className="text-xs text-gray-400">{ts('willCreate', { count: Math.ceil(totalPages / interval) })}</p>
            </div>
          )}

          {mode === 'range' && (
            <div className="mb-6 space-y-3">
              <p className="text-sm text-gray-500">{ts('customRange')}</p>
              {ranges.map((range, index) => (
                <div key={index} className="flex items-center gap-2">
                  <span className="text-xs text-gray-400 w-16">Range {index + 1}</span>
                  <input
                    type="number"
                    min={1}
                    max={totalPages}
                    value={range.from}
                    onChange={(e) => updateRange(index, 'from', parseInt(e.target.value) || 1)}
                    className="w-16 px-2 py-1.5 border border-gray-300 rounded text-sm text-center"
                  />
                  <span className="text-gray-400">-</span>
                  <input
                    type="number"
                    min={1}
                    max={totalPages}
                    value={range.to}
                    onChange={(e) => updateRange(index, 'to', parseInt(e.target.value) || 1)}
                    className="w-16 px-2 py-1.5 border border-gray-300 rounded text-sm text-center"
                  />
                  {ranges.length > 1 && (
                    <button
                      onClick={() => removeRange(index)}
                      className="text-red-400 hover:text-red-600 p-1"
                    >
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  )}
                </div>
              ))}
              <button
                onClick={addRange}
                className="text-sm text-[#4B83FF] hover:text-[#3A6FE0] font-medium"
              >
                + {ts('addRange')}
              </button>
              <label className="flex items-center gap-2 mt-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={mergeRanges}
                  onChange={(e) => setMergeRanges(e.target.checked)}
                  className="w-4 h-4 rounded border-gray-300 text-[#4B83FF] focus:ring-[#4B83FF]"
                />
                <span className="text-sm text-gray-600">{ts('mergeRanges')}</span>
              </label>
              <p className="text-xs text-gray-400">{ts('rangeHint')}</p>
            </div>
          )}

          {processing && <ProgressBar progress={progress} label={tc('processing')} />}

          <button
            onClick={handleSplit}
            disabled={processing}
            className="w-full bg-[#4B83FF] hover:bg-[#3A6FE0] disabled:bg-gray-300 text-white font-medium py-3 rounded-lg transition-colors"
          >
            {processing ? tc('processing') : t('tools.splitPdf.title')}
          </button>
        </div>
      )}
    </div>
  );
}
