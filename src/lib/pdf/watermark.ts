import { PDFDocument, rgb, StandardFonts, degrees, PDFPage, PDFFont, PDFImage } from 'pdf-lib';

export type WatermarkPosition =
  | 'top-left' | 'top-center' | 'top-right'
  | 'center-left' | 'center' | 'center-right'
  | 'bottom-left' | 'bottom-center' | 'bottom-right';

export type WatermarkLayer = 'over' | 'under';

export interface WatermarkOptions {
  type: 'text' | 'image';
  text?: string;
  fontSize?: number;
  fontFamily?: string;
  color?: { r: number; g: number; b: number };
  imageData?: ArrayBuffer;
  imageScale?: number;
  opacity: number;
  rotation: number;
  position: WatermarkPosition;
  mosaic: boolean;
  layer: WatermarkLayer;
  pageRange?: { from: number; to: number };
}

function calculatePosition(
  pageWidth: number,
  pageHeight: number,
  wmWidth: number,
  wmHeight: number,
  position: WatermarkPosition,
  margin: number = 40
): { x: number; y: number } {
  let x: number, y: number;

  switch (position) {
    case 'top-left':
      x = margin; y = pageHeight - wmHeight - margin; break;
    case 'top-center':
      x = (pageWidth - wmWidth) / 2; y = pageHeight - wmHeight - margin; break;
    case 'top-right':
      x = pageWidth - wmWidth - margin; y = pageHeight - wmHeight - margin; break;
    case 'center-left':
      x = margin; y = (pageHeight - wmHeight) / 2; break;
    case 'center':
      x = (pageWidth - wmWidth) / 2; y = (pageHeight - wmHeight) / 2; break;
    case 'center-right':
      x = pageWidth - wmWidth - margin; y = (pageHeight - wmHeight) / 2; break;
    case 'bottom-left':
      x = margin; y = margin; break;
    case 'bottom-center':
      x = (pageWidth - wmWidth) / 2; y = margin; break;
    case 'bottom-right':
      x = pageWidth - wmWidth - margin; y = margin; break;
  }

  return { x, y };
}

function drawTextWatermark(
  page: PDFPage,
  font: PDFFont,
  options: WatermarkOptions,
  x: number,
  y: number
) {
  const text = options.text || 'WATERMARK';
  const fontSize = options.fontSize || 48;
  const color = options.color || { r: 0.5, g: 0.5, b: 0.5 };

  page.drawText(text, {
    x,
    y,
    size: fontSize,
    font,
    color: rgb(color.r, color.g, color.b),
    opacity: options.opacity,
    rotate: degrees(options.rotation),
  });
}

function drawImageWatermark(
  page: PDFPage,
  image: PDFImage,
  options: WatermarkOptions,
  x: number,
  y: number,
  width: number,
  height: number
) {
  page.drawImage(image, {
    x,
    y,
    width,
    height,
    opacity: options.opacity,
    rotate: degrees(options.rotation),
  });
}

function applyMosaicText(
  page: PDFPage,
  font: PDFFont,
  options: WatermarkOptions
) {
  const { width: pageWidth, height: pageHeight } = page.getSize();
  const text = options.text || 'WATERMARK';
  const fontSize = options.fontSize || 48;
  const color = options.color || { r: 0.5, g: 0.5, b: 0.5 };
  const textWidth = font.widthOfTextAtSize(text, fontSize);
  const gapX = textWidth * 0.8;
  const gapY = fontSize * 3;

  for (let y = -pageHeight * 0.5; y < pageHeight * 1.5; y += gapY) {
    for (let x = -pageWidth * 0.3; x < pageWidth * 1.3; x += textWidth + gapX) {
      page.drawText(text, {
        x,
        y,
        size: fontSize,
        font,
        color: rgb(color.r, color.g, color.b),
        opacity: options.opacity,
        rotate: degrees(options.rotation),
      });
    }
  }
}

function applyMosaicImage(
  page: PDFPage,
  image: PDFImage,
  options: WatermarkOptions,
  imgWidth: number,
  imgHeight: number
) {
  const { width: pageWidth, height: pageHeight } = page.getSize();
  const gapX = imgWidth * 0.5;
  const gapY = imgHeight * 0.5;

  for (let y = -imgHeight; y < pageHeight + imgHeight; y += imgHeight + gapY) {
    for (let x = -imgWidth; x < pageWidth + imgWidth; x += imgWidth + gapX) {
      page.drawImage(image, {
        x,
        y,
        width: imgWidth,
        height: imgHeight,
        opacity: options.opacity,
        rotate: degrees(options.rotation),
      });
    }
  }
}

export async function addWatermark(
  fileBuffer: ArrayBuffer,
  options: WatermarkOptions
): Promise<Uint8Array> {
  const pdfDoc = await PDFDocument.load(fileBuffer);
  const pages = pdfDoc.getPages();

  const startPage = options.pageRange ? Math.max(0, options.pageRange.from - 1) : 0;
  const endPage = options.pageRange ? Math.min(pages.length, options.pageRange.to) : pages.length;

  let font: PDFFont | undefined;
  let image: PDFImage | undefined;
  let imgWidth = 0;
  let imgHeight = 0;

  if (options.type === 'text') {
    font = await pdfDoc.embedFont(StandardFonts.Helvetica);
  } else if (options.type === 'image' && options.imageData) {
    const imageBytes = new Uint8Array(options.imageData);
    const isPng = imageBytes[0] === 0x89 && imageBytes[1] === 0x50;
    image = isPng
      ? await pdfDoc.embedPng(options.imageData)
      : await pdfDoc.embedJpg(options.imageData);
    const scale = options.imageScale || 0.5;
    imgWidth = image.width * scale;
    imgHeight = image.height * scale;
  }

  for (let i = startPage; i < endPage; i++) {
    const page = pages[i];
    const { width: pageWidth, height: pageHeight } = page.getSize();

    if (options.type === 'text' && font) {
      const text = options.text || 'WATERMARK';
      const fontSize = options.fontSize || 48;
      const textWidth = font.widthOfTextAtSize(text, fontSize);

      if (options.mosaic) {
        applyMosaicText(page, font, options);
      } else {
        const pos = calculatePosition(pageWidth, pageHeight, textWidth, fontSize, options.position);
        drawTextWatermark(page, font, options, pos.x, pos.y);
      }
    } else if (options.type === 'image' && image) {
      if (options.mosaic) {
        applyMosaicImage(page, image, options, imgWidth, imgHeight);
      } else {
        const pos = calculatePosition(pageWidth, pageHeight, imgWidth, imgHeight, options.position);
        drawImageWatermark(page, image, options, pos.x, pos.y, imgWidth, imgHeight);
      }
    }
  }

  return pdfDoc.save();
}
