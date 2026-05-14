import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';

export type Position = 'bottom-center' | 'bottom-left' | 'bottom-right' | 'top-center' | 'top-left' | 'top-right';

export interface PageNumberOptions {
  position: Position;
  fontSize: number;
  startNumber: number;
}

export async function addPageNumbers(
  fileBuffer: ArrayBuffer,
  options: PageNumberOptions = { position: 'bottom-center', fontSize: 12, startNumber: 1 }
): Promise<Uint8Array> {
  const pdfDoc = await PDFDocument.load(fileBuffer);
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const pages = pdfDoc.getPages();

  pages.forEach((page, index) => {
    const { width, height } = page.getSize();
    const text = String(index + options.startNumber);
    const textWidth = font.widthOfTextAtSize(text, options.fontSize);

    let x: number;
    let y: number;

    switch (options.position) {
      case 'bottom-left':
        x = 40; y = 30; break;
      case 'bottom-right':
        x = width - 40 - textWidth; y = 30; break;
      case 'top-center':
        x = (width - textWidth) / 2; y = height - 40; break;
      case 'top-left':
        x = 40; y = height - 40; break;
      case 'top-right':
        x = width - 40 - textWidth; y = height - 40; break;
      default:
        x = (width - textWidth) / 2; y = 30; break;
    }

    page.drawText(text, {
      x,
      y,
      size: options.fontSize,
      font,
      color: rgb(0, 0, 0),
    });
  });

  return pdfDoc.save();
}
