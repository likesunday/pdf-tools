import { PDFDocument } from 'pdf-lib';

export type PageOrientation = 'portrait' | 'landscape';
export type PageSize = 'fit' | 'a4' | 'letter';
export type MarginSize = 'none' | 'small' | 'big';

export interface ImageToPdfOptions {
  orientation: PageOrientation;
  pageSize: PageSize;
  margin: MarginSize;
}

const PAGE_DIMENSIONS = {
  a4: { width: 595.28, height: 841.89 },
  letter: { width: 612, height: 792 },
};

const MARGINS = {
  none: 0,
  small: 20,
  big: 50,
};

export async function imagesToPdf(
  files: File[],
  options: ImageToPdfOptions = { orientation: 'portrait', pageSize: 'fit', margin: 'none' }
): Promise<Uint8Array> {
  const pdfDoc = await PDFDocument.create();
  const margin = MARGINS[options.margin];

  for (const file of files) {
    const buffer = await file.arrayBuffer();
    let image;

    if (file.type === 'image/png') {
      image = await pdfDoc.embedPng(buffer);
    } else {
      image = await pdfDoc.embedJpg(buffer);
    }

    let pageWidth: number;
    let pageHeight: number;

    if (options.pageSize === 'fit') {
      pageWidth = image.width + margin * 2;
      pageHeight = image.height + margin * 2;
    } else {
      const dims = PAGE_DIMENSIONS[options.pageSize];
      if (options.orientation === 'landscape') {
        pageWidth = dims.height;
        pageHeight = dims.width;
      } else {
        pageWidth = dims.width;
        pageHeight = dims.height;
      }
    }

    const page = pdfDoc.addPage([pageWidth, pageHeight]);

    const availableWidth = pageWidth - margin * 2;
    const availableHeight = pageHeight - margin * 2;

    let drawWidth = image.width;
    let drawHeight = image.height;

    if (options.pageSize !== 'fit') {
      const scaleX = availableWidth / image.width;
      const scaleY = availableHeight / image.height;
      const scale = Math.min(scaleX, scaleY);
      drawWidth = image.width * scale;
      drawHeight = image.height * scale;
    }

    const x = margin + (availableWidth - drawWidth) / 2;
    const y = margin + (availableHeight - drawHeight) / 2;

    page.drawImage(image, { x, y, width: drawWidth, height: drawHeight });
  }

  return pdfDoc.save();
}
