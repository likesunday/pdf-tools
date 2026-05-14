import imageCompression from 'browser-image-compression';

export interface CompressImageOptions {
  maxSizeMB: number;
  maxWidthOrHeight?: number;
  quality: number;
}

export async function compressImage(
  file: File,
  options: CompressImageOptions = { maxSizeMB: 1, quality: 0.8 }
): Promise<File> {
  return imageCompression(file, {
    maxSizeMB: options.maxSizeMB,
    maxWidthOrHeight: options.maxWidthOrHeight || 4096,
    initialQuality: options.quality,
    useWebWorker: true,
  });
}
