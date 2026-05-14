'use client';

import { useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { useTranslations } from 'next-intl';
import { formatFileSize } from '@/lib/utils/fileHelpers';

interface FileUploaderProps {
  accept?: Record<string, string[]>;
  multiple?: boolean;
  maxSize?: number;
  files?: File[];
  onFilesSelected: (files: File[]) => void;
  onRemoveFile?: (index: number) => void;
}

export default function FileUploader({
  accept,
  multiple = true,
  maxSize = 500 * 1024 * 1024,
  files = [],
  onFilesSelected,
  onRemoveFile,
}: FileUploaderProps) {
  const t = useTranslations('common');

  const onDrop = useCallback(
    (acceptedFiles: File[]) => {
      if (acceptedFiles.length > 0) {
        onFilesSelected(acceptedFiles);
      }
    },
    [onFilesSelected]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept,
    multiple,
    maxSize,
  });

  return (
    <div className="space-y-4">
      <div
        {...getRootProps()}
        className={`border-2 border-dashed rounded-xl p-12 text-center cursor-pointer transition-all duration-200 ${
          isDragActive
            ? 'border-[#4B83FF] bg-blue-50'
            : 'border-gray-300 hover:border-[#4B83FF] hover:bg-blue-50/30'
        }`}
      >
        <input {...getInputProps()} />
        <div className="flex flex-col items-center gap-3">
          <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center">
            <svg className="w-8 h-8 text-[#4B83FF]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
            </svg>
          </div>
          <p className="text-lg font-medium text-gray-700">
            {t('upload')}
          </p>
          <p className="text-sm text-gray-500">
            {t('maxFileSize', { size: Math.round(maxSize / 1024 / 1024) })}
          </p>
        </div>
      </div>

      {files.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-200 divide-y divide-gray-100">
          {files.map((file, index) => (
            <div key={`${file.name}-${index}`} className="flex items-center justify-between px-4 py-3">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-8 h-8 bg-gray-100 rounded flex items-center justify-center flex-shrink-0">
                  <span className="text-xs">📄</span>
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">{file.name}</p>
                  <p className="text-xs text-gray-500">{formatFileSize(file.size)}</p>
                </div>
              </div>
              {onRemoveFile && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onRemoveFile(index);
                  }}
                  className="ml-3 p-1 text-gray-400 hover:text-[#4B83FF] hover:bg-blue-50 rounded transition-colors"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
