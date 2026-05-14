import { getPdfjs } from './pdfjs-init';

export type ImageFormat = 'png' | 'jpeg';

export interface PdfToImageOptions {
  format: ImageFormat;
  scale: number;
  quality: number;
}

export async function pdfToImages(
  fileBuffer: ArrayBuffer,
  options: PdfToImageOptions = { format: 'png', scale: 2, quality: 0.92 }
): Promise<Blob[]> {
  const pdfjsLib = await getPdfjs();

  const loadingTask = pdfjsLib.getDocument({ data: new Uint8Array(fileBuffer) });
  const pdf = await loadingTask.promise;
  const blobs: Blob[] = [];

  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const viewport = page.getViewport({ scale: options.scale });
    const canvas = document.createElement('canvas');
    canvas.width = viewport.width;
    canvas.height = viewport.height;
    const ctx = canvas.getContext('2d')!;

    await page.render({ canvasContext: ctx, viewport } as any).promise;

    const blob = await new Promise<Blob>((resolve) => {
      canvas.toBlob(
        (b) => resolve(b!),
        `image/${options.format}`,
        options.quality
      );
    });
    blobs.push(blob);
  }

  return blobs;
}
