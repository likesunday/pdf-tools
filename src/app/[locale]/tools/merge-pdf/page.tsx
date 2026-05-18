'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useTranslations } from 'next-intl';
import FileUploader from '@/components/shared/FileUploader';
import ProgressBar from '@/components/shared/ProgressBar';
import { mergePdfs } from '@/lib/pdf/merge';
import { readFileAsArrayBuffer, formatFileSize } from '@/lib/utils/fileHelpers';
import { downloadBlob } from '@/lib/utils/download';
import { getPdfjs } from '@/lib/pdf/pdfjs-init';

interface FileWithThumb {
  file: File;
  thumbnail?: string;
}

export default function MergePdfPage() {
  const t = useTranslations();
  const tm = useTranslations('merge');
  const tc = useTranslations('common');
  const [files, setFiles] = useState<FileWithThumb[]>([]);
  const [processing, setProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [result, setResult] = useState<Blob | null>(null);
  const [dragIndex, setDragIndex] = useState<number | null>(null);

  const generateThumbnail = useCallback(async (file: File): Promise<string> => {
    try {
      const buffer = await readFileAsArrayBuffer(file);
      const pdfjsLib = await getPdfjs();
      const pdf = await pdfjsLib.getDocument({ data: buffer }).promise;
      const page = await pdf.getPage(1);
      const viewport = page.getViewport({ scale: 0.3 });
      const canvas = document.createElement('canvas');
      canvas.width = viewport.width;
      canvas.height = viewport.height;
      const ctx = canvas.getContext('2d')!;
      await page.render({ canvasContext: ctx, viewport }).promise;
      return canvas.toDataURL();
    } catch {
      return '';
    }
  }, []);

  const handleFiles = async (newFiles: File[]) => {
    setResult(null);
    const newEntries: FileWithThumb[] = newFiles.map(f => ({ file: f }));
    setFiles(prev => [...prev, ...newEntries]);

    for (let i = 0; i < newFiles.length; i++) {
      const thumb = await generateThumbnail(newFiles[i]);
      setFiles(prev => {
        const updated = [...prev];
        const idx = updated.findIndex(item => item.file === newFiles[i]);
        if (idx >= 0) updated[idx] = { ...updated[idx], thumbnail: thumb };
        return updated;
      });
    }
  };

  const removeFile = (index: number) => {
    setFiles(prev => prev.filter((_, i) => i !== index));
  };

  const handleDragStart = (index: number) => {
    setDragIndex(index);
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    if (dragIndex === null || dragIndex === index) return;
    setFiles(prev => {
      const updated = [...prev];
      const [moved] = updated.splice(dragIndex, 1);
      updated.splice(index, 0, moved);
      return updated;
    });
    setDragIndex(index);
  };

  const handleDragEnd = () => {
    setDragIndex(null);
  };

  const handleMerge = async () => {
    if (files.length < 2) return;
    setProcessing(true);
    setProgress(20);

    try {
      const buffers = await Promise.all(files.map(f => readFileAsArrayBuffer(f.file)));
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

  if (result) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-12">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-100 rounded-2xl mb-4">
            <span className="text-3xl">🔗</span>
          </div>
          <h1 className="text-3xl font-bold text-gray-900">{t('tools.mergePdf.title')}</h1>
        </div>
        <div className="bg-white rounded-xl p-8 shadow-sm border border-gray-100 text-center">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <p className="text-gray-600 mb-6">{files.length} files merged successfully</p>
          <div className="flex gap-3 justify-center">
            <button
              onClick={() => downloadBlob(result, 'merged.pdf')}
              className="bg-[#4B83FF] hover:bg-[#3A6FE0] text-white font-medium px-6 py-3 rounded-lg transition-colors"
            >
              {tc('download')}
            </button>
            <button
              onClick={() => { setFiles([]); setResult(null); setProgress(0); }}
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
          <span className="text-3xl">🔗</span>
        </div>
        <h1 className="text-3xl font-bold text-gray-900">{t('tools.mergePdf.title')}</h1>
        <p className="text-gray-600 mt-2">{t('tools.mergePdf.description')}</p>
      </div>

      {files.length === 0 ? (
        <FileUploader
          accept={{ 'application/pdf': ['.pdf'] }}
          multiple
          files={[]}
          onFilesSelected={handleFiles}
        />
      ) : (
        <div className="space-y-4">
          <div className="text-sm text-gray-500 text-center mb-2">
            {tm('dragToReorder')} • {tm('filesCount', { count: files.length })}
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
            {files.map((item, index) => (
              <div
                key={`${item.file.name}-${index}`}
                draggable
                onDragStart={() => handleDragStart(index)}
                onDragOver={(e) => handleDragOver(e, index)}
                onDragEnd={handleDragEnd}
                className={`relative bg-white rounded-xl border-2 p-3 cursor-move transition-all ${
                  dragIndex === index ? 'border-[#4B83FF] shadow-lg scale-105' : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <button
                  onClick={() => removeFile(index)}
                  className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center text-xs hover:bg-red-600 z-10"
                >
                  ×
                </button>
                <div className="aspect-[3/4] bg-gray-50 rounded-lg mb-2 flex items-center justify-center overflow-hidden">
                  {item.thumbnail ? (
                    <img src={item.thumbnail} alt="" className="w-full h-full object-contain" />
                  ) : (
                    <span className="text-3xl">📄</span>
                  )}
                </div>
                <p className="text-xs text-gray-700 truncate font-medium">{item.file.name}</p>
                <p className="text-xs text-gray-400">{formatFileSize(item.file.size)}</p>
                <div className="absolute top-2 left-2 w-5 h-5 bg-[#4B83FF] text-white rounded-full flex items-center justify-center text-[10px] font-bold">
                  {index + 1}
                </div>
              </div>
            ))}

            {/* Add more button */}
            <label className="aspect-[3/4] border-2 border-dashed border-gray-300 rounded-xl flex flex-col items-center justify-center cursor-pointer hover:border-[#4B83FF] hover:bg-blue-50/30 transition-colors">
              <input
                type="file"
                accept=".pdf"
                multiple
                className="hidden"
                onChange={(e) => {
                  if (e.target.files) handleFiles(Array.from(e.target.files));
                  e.target.value = '';
                }}
              />
              <svg className="w-8 h-8 text-gray-400 mb-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              <span className="text-xs text-gray-500">{tm('addMore')}</span>
            </label>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
            {processing && <ProgressBar progress={progress} label={tc('processing')} />}
            <button
              onClick={handleMerge}
              disabled={processing || files.length < 2}
              className="w-full bg-[#4B83FF] hover:bg-[#3A6FE0] disabled:bg-gray-300 text-white font-medium py-3 rounded-lg transition-colors"
            >
              {processing ? tc('processing') : t('tools.mergePdf.title')}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
