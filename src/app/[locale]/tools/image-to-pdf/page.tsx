'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import FileUploader from '@/components/shared/FileUploader';
import ProgressBar from '@/components/shared/ProgressBar';
import { imagesToPdf, PageOrientation, PageSize, MarginSize } from '@/lib/pdf/fromImage';
import { downloadBlob } from '@/lib/utils/download';

interface FileWithPreview {
  file: File;
  preview: string;
}

export default function ImageToPdfPage() {
  const t = useTranslations();
  const ti = useTranslations('imageToPdf');
  const tc = useTranslations('common');
  const [files, setFiles] = useState<FileWithPreview[]>([]);
  const [orientation, setOrientation] = useState<PageOrientation>('portrait');
  const [pageSize, setPageSize] = useState<PageSize>('fit');
  const [margin, setMargin] = useState<MarginSize>('none');
  const [processing, setProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [result, setResult] = useState<Blob | null>(null);
  const [dragIndex, setDragIndex] = useState<number | null>(null);

  const handleFiles = (newFiles: File[]) => {
    setResult(null);
    const entries: FileWithPreview[] = newFiles.map(f => ({
      file: f,
      preview: URL.createObjectURL(f),
    }));
    setFiles(prev => [...prev, ...entries]);
  };

  const removeFile = (index: number) => {
    setFiles(prev => {
      URL.revokeObjectURL(prev[index].preview);
      return prev.filter((_, i) => i !== index);
    });
  };

  const handleDragStart = (index: number) => setDragIndex(index);
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
  const handleDragEnd = () => setDragIndex(null);

  const handleConvert = async () => {
    if (files.length === 0) return;
    setProcessing(true);
    setProgress(30);

    try {
      const pdfBytes = await imagesToPdf(
        files.map(f => f.file),
        { orientation, pageSize, margin }
      );
      setProgress(100);
      setResult(new Blob([(pdfBytes as any)], { type: 'application/pdf' }));
    } catch (error) {
      console.error('Conversion failed:', error);
    } finally {
      setProcessing(false);
    }
  };

  if (result) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-12">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-100 rounded-2xl mb-4">
            <span className="text-3xl">📄</span>
          </div>
          <h1 className="text-3xl font-bold text-gray-900">{t('tools.imageToPdf.title')}</h1>
        </div>
        <div className="bg-white rounded-xl p-8 shadow-sm border border-gray-100 text-center">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <p className="text-gray-600 mb-6">{files.length} images converted to PDF</p>
          <div className="flex gap-3 justify-center">
            <button
              onClick={() => downloadBlob(result, 'images.pdf')}
              className="bg-[#4B83FF] hover:bg-[#3A6FE0] text-white font-medium px-6 py-3 rounded-lg transition-colors"
            >
              {tc('download')}
            </button>
            <button
              onClick={() => { setFiles([]); setResult(null); }}
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
          <span className="text-3xl">📄</span>
        </div>
        <h1 className="text-3xl font-bold text-gray-900">{t('tools.imageToPdf.title')}</h1>
        <p className="text-gray-600 mt-2">{t('tools.imageToPdf.description')}</p>
      </div>

      {files.length === 0 ? (
        <FileUploader
          accept={{ 'image/*': ['.png', '.jpg', '.jpeg', '.webp'] }}
          multiple
          files={[]}
          onFilesSelected={handleFiles}
        />
      ) : (
        <div className="flex flex-col lg:flex-row gap-6">
          {/* Left: Image grid */}
          <div className="flex-1">
            <p className="text-sm text-gray-500 mb-3">{ti('dragToReorder')}</p>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
              {files.map((item, index) => (
                <div
                  key={`${item.file.name}-${index}`}
                  draggable
                  onDragStart={() => handleDragStart(index)}
                  onDragOver={(e) => handleDragOver(e, index)}
                  onDragEnd={handleDragEnd}
                  className={`relative bg-white rounded-lg border-2 p-2 cursor-move transition-all ${
                    dragIndex === index ? 'border-[#4B83FF] shadow-lg scale-105' : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <button
                    onClick={() => removeFile(index)}
                    className="absolute -top-2 -right-2 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center text-[10px] hover:bg-red-600 z-10"
                  >
                    ×
                  </button>
                  <div className="aspect-square bg-gray-50 rounded flex items-center justify-center overflow-hidden">
                    <img src={item.preview} alt="" className="max-w-full max-h-full object-contain" />
                  </div>
                  <p className="text-[10px] text-gray-500 truncate mt-1">{item.file.name}</p>
                  <div className="absolute top-1.5 left-1.5 w-4 h-4 bg-[#4B83FF] text-white rounded-full flex items-center justify-center text-[9px] font-bold">
                    {index + 1}
                  </div>
                </div>
              ))}

              {/* Add more */}
              <label className="aspect-square border-2 border-dashed border-gray-300 rounded-lg flex flex-col items-center justify-center cursor-pointer hover:border-[#4B83FF] hover:bg-blue-50/30 transition-colors">
                <input
                  type="file"
                  accept="image/png,image/jpeg,image/webp"
                  multiple
                  className="hidden"
                  onChange={(e) => {
                    if (e.target.files) handleFiles(Array.from(e.target.files));
                    e.target.value = '';
                  }}
                />
                <svg className="w-6 h-6 text-gray-400 mb-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                <span className="text-[10px] text-gray-500">{ti('addMore')}</span>
              </label>
            </div>
          </div>

          {/* Right: Settings */}
          <div className="lg:w-72 shrink-0">
            <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100 space-y-5 sticky top-4">
              {/* Orientation */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">{ti('orientation')}</label>
                <div className="flex gap-2">
                  <button
                    onClick={() => setOrientation('portrait')}
                    className={`flex-1 py-2 rounded-lg border-2 text-sm font-medium transition-colors ${
                      orientation === 'portrait' ? 'border-[#4B83FF] bg-blue-50 text-[#4B83FF]' : 'border-gray-200 text-gray-600'
                    }`}
                  >
                    {ti('portrait')}
                  </button>
                  <button
                    onClick={() => setOrientation('landscape')}
                    className={`flex-1 py-2 rounded-lg border-2 text-sm font-medium transition-colors ${
                      orientation === 'landscape' ? 'border-[#4B83FF] bg-blue-50 text-[#4B83FF]' : 'border-gray-200 text-gray-600'
                    }`}
                  >
                    {ti('landscape')}
                  </button>
                </div>
              </div>

              {/* Page size */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">{ti('pageSize')}</label>
                <div className="space-y-1.5">
                  {([
                    { value: 'fit' as PageSize, label: ti('fitImage') },
                    { value: 'a4' as PageSize, label: ti('a4') },
                    { value: 'letter' as PageSize, label: ti('letter') },
                  ]).map(opt => (
                    <button
                      key={opt.value}
                      onClick={() => setPageSize(opt.value)}
                      className={`w-full text-left px-3 py-2 rounded-lg border text-sm transition-colors ${
                        pageSize === opt.value ? 'border-[#4B83FF] bg-blue-50 text-[#4B83FF]' : 'border-gray-200 text-gray-600 hover:border-gray-300'
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Margin */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">{ti('margin')}</label>
                <div className="flex gap-2">
                  {([
                    { value: 'none' as MarginSize, label: ti('noMargin') },
                    { value: 'small' as MarginSize, label: ti('smallMargin') },
                    { value: 'big' as MarginSize, label: ti('bigMargin') },
                  ]).map(opt => (
                    <button
                      key={opt.value}
                      onClick={() => setMargin(opt.value)}
                      className={`flex-1 py-1.5 rounded-md border text-xs font-medium transition-colors ${
                        margin === opt.value ? 'border-[#4B83FF] bg-blue-50 text-[#4B83FF]' : 'border-gray-200 text-gray-600'
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>

              {processing && <ProgressBar progress={progress} label={tc('processing')} />}

              <button
                onClick={handleConvert}
                disabled={processing || files.length === 0}
                className="w-full bg-[#4B83FF] hover:bg-[#3A6FE0] disabled:bg-gray-300 text-white font-medium py-3 rounded-lg transition-colors"
              >
                {processing ? tc('processing') : t('tools.imageToPdf.title')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
