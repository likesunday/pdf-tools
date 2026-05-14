import { PDFDocument } from 'pdf-lib';
import { getPdfjs } from './pdfjs-init';

export interface CompressOptions {
  quality: number; // 0-1
}

export async function compressPdf(
  fileBuffer: ArrayBuffer,
  options: CompressOptions = { quality: 0.7 }
): Promise<Uint8Array> {
  const pdfjsLib = await getPdfjs();

  const loadingTask = pdfjsLib.getDocument({ data: new Uint8Array(fileBuffer) });
  const pdf = await loadingTask.promise;
  const newPdf = await PDFDocument.create();

  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const viewport = page.getViewport({ scale: 1.5 });

    const canvas = document.createElement('canvas');
    canvas.width = viewport.width;
    canvas.height = viewport.height;
    const ctx = canvas.getContext('2d')!;

    await page.render({ canvasContext: ctx, viewport } as any).promise;

    const jpegDataUrl = canvas.toDataURL('image/jpeg', options.quality);
    const base64 = jpegDataUrl.split(',')[1];
    const binaryString = atob(base64);
    const jpegBytes = new Uint8Array(binaryString.length);
    for (let j = 0; j < binaryString.length; j++) {
      jpegBytes[j] = binaryString.charCodeAt(j);
    }

    const image = await newPdf.embedJpg(jpegBytes as any);
    const newPage = newPdf.addPage([viewport.width, viewport.height]);
    newPage.drawImage(image, {
      x: 0,
      y: 0,
      width: viewport.width,
      height: viewport.height,
    });
  }

  return newPdf.save({ useObjectStreams: true });
}
