'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { useTranslations } from 'next-intl';
import FileUploader from '@/components/shared/FileUploader';
import ProgressBar from '@/components/shared/ProgressBar';
import { addWatermark, WatermarkPosition, WatermarkLayer } from '@/lib/pdf/watermark';
import { readFileAsArrayBuffer } from '@/lib/utils/fileHelpers';
import { downloadBlob } from '@/lib/utils/download';
import { getPdfjs } from '@/lib/pdf/pdfjs-init';
import ErrorMessage from '@/components/shared/ErrorMessage';

type WatermarkType = 'text' | 'image';

const ROTATION_OPTIONS = [
  { value: 0, key: 'none' },
  { value: 45, key: 'deg45' },
  { value: 90, key: 'deg90' },
  { value: 135, key: 'deg135' },
  { value: 180, key: 'deg180' },
  { value: -45, key: 'degN45' },
  { value: -90, key: 'degN90' },
];

const POSITION_GRID: { value: WatermarkPosition; key: string }[] = [
  { value: 'top-left', key: 'topLeft' },
  { value: 'top-center', key: 'topCenter' },
  { value: 'top-right', key: 'topRight' },
  { value: 'center-left', key: 'centerLeft' },
  { value: 'center', key: 'center' },
  { value: 'center-right', key: 'centerRight' },
  { value: 'bottom-left', key: 'bottomLeft' },
  { value: 'bottom-center', key: 'bottomCenter' },
  { value: 'bottom-right', key: 'bottomRight' },
];

const FONT_OPTIONS = [
  'Helvetica',
  'Times New Roman',
  'Courier',
  'Arial',
  'Verdana',
];

export default function AddWatermarkPage() {
  const t = useTranslations();
  const tw = useTranslations('watermark');
  const tc = useTranslations('common');

  const [file, setFile] = useState<File | null>(null);
  const [watermarkType, setWatermarkType] = useState<WatermarkType>('text');
  const [text, setText] = useState('WATERMARK');
  const [fontSize, setFontSize] = useState(48);
  const [fontFamily, setFontFamily] = useState('Helvetica');
  const [color, setColor] = useState('#808080');
  const [opacity, setOpacity] = useState(0.3);
  const [rotation, setRotation] = useState(-45);
  const [position, setPosition] = useState<WatermarkPosition>('center');
  const [mosaic, setMosaic] = useState(false);
  const [layer, setLayer] = useState<WatermarkLayer>('over');
  const [pageFrom, setPageFrom] = useState(1);
  const [pageTo, setPageTo] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [useAllPages, setUseAllPages] = useState(true);

  const [watermarkImage, setWatermarkImage] = useState<File | null>(null);
  const [watermarkImagePreview, setWatermarkImagePreview] = useState<string>('');
  const [imageScale, setImageScale] = useState(0.3);

  const [error, setError] = useState('');
  const [processing, setProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [result, setResult] = useState<Blob | null>(null);

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileBufferRef = useRef<ArrayBuffer | null>(null);

  const hexToRgb = (hex: string) => {
    const r = parseInt(hex.slice(1, 3), 16) / 255;
    const g = parseInt(hex.slice(3, 5), 16) / 255;
    const b = parseInt(hex.slice(5, 7), 16) / 255;
    return { r, g, b };
  };

  const renderPreview = useCallback(async () => {
    if (!file || !canvasRef.current) return;

    try {
      if (!fileBufferRef.current) {
        fileBufferRef.current = await readFileAsArrayBuffer(file);
      }

      const pdfjsLib = await getPdfjs();
      const pdf = await pdfjsLib.getDocument({ data: fileBufferRef.current.slice(0) }).promise;
      setTotalPages(pdf.numPages);
      const page = await pdf.getPage(1);

      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      const viewport = page.getViewport({ scale: 1 });
      const containerWidth = canvas.parentElement?.clientWidth || 400;
      const scale = containerWidth / viewport.width;
      const scaledViewport = page.getViewport({ scale });

      canvas.width = scaledViewport.width;
      canvas.height = scaledViewport.height;

      await page.render({ canvasContext: ctx, viewport: scaledViewport }).promise;
    } catch {
      // Preview failed silently
    }
  }, [file]);

  useEffect(() => {
    if (file) {
      renderPreview();
    }
  }, [file, renderPreview]);

  const handleFiles = (files: File[]) => {
    setFile(files[0]);
    fileBufferRef.current = null;
    setResult(null);
    setError('');
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (f) {
      setWatermarkImage(f);
      const url = URL.createObjectURL(f);
      setWatermarkImagePreview(url);
    }
  };

  const handleApply = async () => {
    if (!file) return;
    if (watermarkType === 'text' && !text.trim()) return;
    if (watermarkType === 'image' && !watermarkImage) return;

    setProcessing(true);
    setProgress(20);
    setError('');

    try {
      const buffer = fileBufferRef.current || await readFileAsArrayBuffer(file);
      setProgress(40);

      let imageData: ArrayBuffer | undefined;
      if (watermarkType === 'image' && watermarkImage) {
        imageData = await readFileAsArrayBuffer(watermarkImage);
      }

      setProgress(60);

      const modified = await addWatermark(buffer, {
        type: watermarkType,
        text: watermarkType === 'text' ? text : undefined,
        fontSize,
        fontFamily,
        color: hexToRgb(color),
        imageData,
        imageScale,
        opacity,
        rotation,
        position,
        mosaic,
        layer,
        pageRange: useAllPages ? undefined : { from: pageFrom, to: pageTo },
      });

      setProgress(100);
      setResult(new Blob([(modified as any)], { type: 'application/pdf' }));
    } catch {
      setError('Processing failed. Please try a different file.');
    } finally {
      setProcessing(false);
    }
  };

  const getWatermarkPreviewStyle = (): React.CSSProperties => {
    const rgbColor = hexToRgb(color);
    const colorStr = `rgba(${Math.round(rgbColor.r * 255)}, ${Math.round(rgbColor.g * 255)}, ${Math.round(rgbColor.b * 255)}, ${opacity})`;

    const baseStyle: React.CSSProperties = {
      position: 'absolute',
      color: colorStr,
      fontSize: `${Math.max(12, fontSize * 0.4)}px`,
      fontFamily,
      transform: `rotate(${rotation}deg)`,
      whiteSpace: 'nowrap',
      pointerEvents: 'none',
      userSelect: 'none',
    };

    if (mosaic) {
      return { ...baseStyle, inset: 0 };
    }

    const posMap: Record<WatermarkPosition, React.CSSProperties> = {
      'top-left': { top: '10%', left: '10%' },
      'top-center': { top: '10%', left: '50%', transform: `translateX(-50%) rotate(${rotation}deg)` },
      'top-right': { top: '10%', right: '10%' },
      'center-left': { top: '50%', left: '10%', transform: `translateY(-50%) rotate(${rotation}deg)` },
      'center': { top: '50%', left: '50%', transform: `translate(-50%, -50%) rotate(${rotation}deg)` },
      'center-right': { top: '50%', right: '10%', transform: `translateY(-50%) rotate(${rotation}deg)` },
      'bottom-left': { bottom: '10%', left: '10%' },
      'bottom-center': { bottom: '10%', left: '50%', transform: `translateX(-50%) rotate(${rotation}deg)` },
      'bottom-right': { bottom: '10%', right: '10%' },
    };

    return { ...baseStyle, ...posMap[position] };
  };

  const renderMosaicPreview = () => {
    if (!mosaic) return null;
    const rgbColor = hexToRgb(color);
    const colorStr = `rgba(${Math.round(rgbColor.r * 255)}, ${Math.round(rgbColor.g * 255)}, ${Math.round(rgbColor.b * 255)}, ${opacity})`;
    const items = [];
    for (let row = 0; row < 5; row++) {
      for (let col = 0; col < 3; col++) {
        items.push(
          <span
            key={`${row}-${col}`}
            style={{
              position: 'absolute',
              top: `${15 + row * 20}%`,
              left: `${10 + col * 35}%`,
              color: colorStr,
              fontSize: `${Math.max(10, fontSize * 0.25)}px`,
              fontFamily,
              transform: `rotate(${rotation}deg)`,
              whiteSpace: 'nowrap',
            }}
          >
            {watermarkType === 'text' ? text : '🖼'}
          </span>
        );
      }
    }
    return items;
  };

  if (!file) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-12">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-100 rounded-2xl mb-4">
            <span className="text-3xl">💧</span>
          </div>
          <h1 className="text-3xl font-bold text-gray-900">{t('tools.addWatermark.title')}</h1>
          <p className="text-gray-600 mt-2">{t('tools.addWatermark.description')}</p>
        </div>
        <FileUploader
          accept={{ 'application/pdf': ['.pdf'] }}
          multiple={false}
          files={[]}
          onFilesSelected={handleFiles}
          onRemoveFile={() => setFile(null)}
        />
      </div>
    );
  }

  if (result) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-12">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-100 rounded-2xl mb-4">
            <span className="text-3xl">💧</span>
          </div>
          <h1 className="text-3xl font-bold text-gray-900">{t('tools.addWatermark.title')}</h1>
        </div>
        <div className="bg-white rounded-xl p-8 shadow-sm border border-gray-100 text-center">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <div className="flex gap-3 justify-center">
            <button
              onClick={() => downloadBlob(result, `watermarked_${file.name}`)}
              className="bg-[#4B83FF] hover:bg-[#3A6FE0] text-white font-medium px-6 py-3 rounded-lg transition-colors"
            >
              {tc('download')}
            </button>
            <button
              onClick={() => { setFile(null); setResult(null); fileBufferRef.current = null; }}
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
    <div className="max-w-6xl mx-auto px-4 py-8">
      <div className="text-center mb-6">
        <h1 className="text-2xl font-bold text-gray-900">{t('tools.addWatermark.title')}</h1>
        <p className="text-gray-600 mt-1 text-sm">{t('tools.addWatermark.description')}</p>
      </div>

      {error && <ErrorMessage message={error} />}

      <div className="flex flex-col lg:flex-row gap-6">
        {/* Left: Preview */}
        <div className="lg:w-1/2">
          <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 sticky top-4">
            <div className="text-sm font-medium text-gray-500 mb-2">{tw('preview')}</div>
            <div className="relative bg-gray-50 rounded-lg overflow-hidden flex items-center justify-center min-h-[400px]">
              <canvas ref={canvasRef} className="max-w-full h-auto" />
              {/* Watermark overlay */}
              {watermarkType === 'text' && !mosaic && (
                <span style={getWatermarkPreviewStyle()}>{text}</span>
              )}
              {watermarkType === 'text' && mosaic && renderMosaicPreview()}
              {watermarkType === 'image' && watermarkImagePreview && !mosaic && (
                <img
                  src={watermarkImagePreview}
                  alt="watermark"
                  style={{
                    ...getWatermarkPreviewStyle(),
                    width: `${imageScale * 100}%`,
                    maxWidth: '60%',
                    height: 'auto',
                  }}
                />
              )}
            </div>
            <div className="mt-2 text-xs text-gray-400 text-center">
              {file.name} • {totalPages} {tc('pages').toLowerCase()}
            </div>
          </div>
        </div>

        {/* Right: Settings */}
        <div className="lg:w-1/2">
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 space-y-5">
            {/* Type tabs */}
            <div className="flex rounded-lg bg-gray-100 p-1">
              <button
                onClick={() => setWatermarkType('text')}
                className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
                  watermarkType === 'text' ? 'bg-white shadow-sm text-[#4B83FF]' : 'text-gray-600 hover:text-gray-800'
                }`}
              >
                {tw('textTab')}
              </button>
              <button
                onClick={() => setWatermarkType('image')}
                className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
                  watermarkType === 'image' ? 'bg-white shadow-sm text-[#4B83FF]' : 'text-gray-600 hover:text-gray-800'
                }`}
              >
                {tw('imageTab')}
              </button>
            </div>

            {/* Text options */}
            {watermarkType === 'text' && (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">{tc('text')}</label>
                  <input
                    type="text"
                    value={text}
                    onChange={(e) => setText(e.target.value)}
                    placeholder={tw('textPlaceholder')}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#4B83FF] focus:border-transparent text-sm"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">{tw('font')}</label>
                    <select
                      value={fontFamily}
                      onChange={(e) => setFontFamily(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#4B83FF] focus:border-transparent text-sm"
                    >
                      {FONT_OPTIONS.map(f => (
                        <option key={f} value={f}>{f}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      {tc('fontSize')}: {fontSize}px
                    </label>
                    <input
                      type="range"
                      min="12"
                      max="120"
                      value={fontSize}
                      onChange={(e) => setFontSize(parseInt(e.target.value))}
                      className="w-full mt-2"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">{tw('fontColor')}</label>
                  <div className="flex items-center gap-3">
                    <input
                      type="color"
                      value={color}
                      onChange={(e) => setColor(e.target.value)}
                      className="w-10 h-10 rounded border border-gray-300 cursor-pointer"
                    />
                    <input
                      type="text"
                      value={color}
                      onChange={(e) => setColor(e.target.value)}
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm font-mono"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Image options */}
            {watermarkType === 'image' && (
              <div className="space-y-4">
                <div>
                  <input
                    type="file"
                    accept="image/png,image/jpeg,image/jpg"
                    onChange={handleImageUpload}
                    className="hidden"
                    id="watermark-image-input"
                  />
                  <label
                    htmlFor="watermark-image-input"
                    className="flex items-center justify-center gap-2 w-full py-3 px-4 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-[#4B83FF] hover:bg-blue-50/30 transition-colors"
                  >
                    <svg className="w-5 h-5 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    <span className="text-sm text-gray-600">
                      {watermarkImage ? tw('changeImage') : tw('addImage')}
                    </span>
                  </label>
                  {watermarkImagePreview && (
                    <div className="mt-2 flex items-center gap-2">
                      <img src={watermarkImagePreview} alt="" className="h-12 rounded border" />
                      <span className="text-xs text-gray-500">{watermarkImage?.name}</span>
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {tw('imageScale')}: {Math.round(imageScale * 100)}%
                  </label>
                  <input
                    type="range"
                    min="0.1"
                    max="1"
                    step="0.05"
                    value={imageScale}
                    onChange={(e) => setImageScale(parseFloat(e.target.value))}
                    className="w-full"
                  />
                </div>
              </div>
            )}

            <hr className="border-gray-200" />

            {/* Position */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">{tc('position')}</label>
              <div className="grid grid-cols-3 gap-1.5 w-fit">
                {POSITION_GRID.map(({ value, key }) => (
                  <button
                    key={value}
                    onClick={() => setPosition(value)}
                    disabled={mosaic}
                    className={`w-10 h-10 rounded-md border-2 flex items-center justify-center transition-all ${
                      position === value && !mosaic
                        ? 'border-[#4B83FF] bg-blue-50'
                        : 'border-gray-200 hover:border-gray-300'
                    } ${mosaic ? 'opacity-40 cursor-not-allowed' : ''}`}
                    title={tw(`positionOptions.${key}`)}
                  >
                    <div className={`w-2 h-2 rounded-full ${position === value && !mosaic ? 'bg-[#4B83FF]' : 'bg-gray-400'}`} />
                  </button>
                ))}
              </div>

              <label className="flex items-center gap-2 mt-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={mosaic}
                  onChange={(e) => setMosaic(e.target.checked)}
                  className="w-4 h-4 rounded border-gray-300 text-[#4B83FF] focus:ring-[#4B83FF]"
                />
                <span className="text-sm text-gray-700">{tw('mosaic')}</span>
              </label>
            </div>

            {/* Opacity */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {tc('opacity')}: {Math.round(opacity * 100)}%
              </label>
              <input
                type="range"
                min="0.05"
                max="1"
                step="0.05"
                value={opacity}
                onChange={(e) => setOpacity(parseFloat(e.target.value))}
                className="w-full"
              />
            </div>

            {/* Rotation */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">{tc('rotation')}</label>
              <div className="flex flex-wrap gap-2">
                {ROTATION_OPTIONS.map(({ value, key }) => (
                  <button
                    key={value}
                    onClick={() => setRotation(value)}
                    className={`px-3 py-1.5 rounded-md text-xs font-medium border transition-colors ${
                      rotation === value
                        ? 'border-[#4B83FF] bg-blue-50 text-[#4B83FF]'
                        : 'border-gray-200 text-gray-600 hover:border-gray-300'
                    }`}
                  >
                    {tw(`rotationOptions.${key}`)}
                  </button>
                ))}
              </div>
            </div>

            {/* Page Range */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">{tw('pageRange')}</label>
              <label className="flex items-center gap-2 mb-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={useAllPages}
                  onChange={(e) => setUseAllPages(e.target.checked)}
                  className="w-4 h-4 rounded border-gray-300 text-[#4B83FF] focus:ring-[#4B83FF]"
                />
                <span className="text-sm text-gray-700">{tw('allPages')}</span>
              </label>
              {!useAllPages && (
                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-500">{tw('pageFrom')}</span>
                  <input
                    type="number"
                    min={1}
                    max={totalPages}
                    value={pageFrom}
                    onChange={(e) => setPageFrom(Math.max(1, parseInt(e.target.value) || 1))}
                    className="w-16 px-2 py-1 border border-gray-300 rounded text-sm text-center"
                  />
                  <span className="text-sm text-gray-500">{tw('pageTo')}</span>
                  <input
                    type="number"
                    min={1}
                    max={totalPages}
                    value={pageTo}
                    onChange={(e) => setPageTo(Math.min(totalPages, parseInt(e.target.value) || 1))}
                    className="w-16 px-2 py-1 border border-gray-300 rounded text-sm text-center"
                  />
                  <span className="text-xs text-gray-400">/ {totalPages}</span>
                </div>
              )}
            </div>

            {/* Layer */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">{tw('layer')}</label>
              <div className="flex gap-3">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="layer"
                    checked={layer === 'over'}
                    onChange={() => setLayer('over')}
                    className="w-4 h-4 text-[#4B83FF] focus:ring-[#4B83FF]"
                  />
                  <span className="text-sm text-gray-700">{tw('layerOver')}</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="layer"
                    checked={layer === 'under'}
                    onChange={() => setLayer('under')}
                    className="w-4 h-4 text-[#4B83FF] focus:ring-[#4B83FF]"
                  />
                  <span className="text-sm text-gray-700">{tw('layerUnder')}</span>
                </label>
              </div>
            </div>

            {/* Processing */}
            {processing && <ProgressBar progress={progress} label={tc('processing')} />}

            {/* Apply button */}
            <button
              onClick={handleApply}
              disabled={processing || (watermarkType === 'text' && !text.trim()) || (watermarkType === 'image' && !watermarkImage)}
              className="w-full bg-[#4B83FF] hover:bg-[#3A6FE0] disabled:bg-gray-300 disabled:cursor-not-allowed text-white font-medium py-3 rounded-lg transition-colors"
            >
              {processing ? tc('processing') : t('tools.addWatermark.title')}
            </button>

            {/* Change file */}
            <button
              onClick={() => { setFile(null); fileBufferRef.current = null; }}
              className="w-full text-sm text-gray-500 hover:text-gray-700 py-2 transition-colors"
            >
              {tc('reset')}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
