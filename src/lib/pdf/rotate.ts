import { PDFDocument, degrees } from 'pdf-lib';

export type RotationAngle = 0 | 90 | 180 | 270;

export async function rotatePdf(
  fileBuffer: ArrayBuffer,
  angle: RotationAngle,
  pageIndices?: number[]
): Promise<Uint8Array> {
  const pdfDoc = await PDFDocument.load(fileBuffer);
  const pages = pdfDoc.getPages();

  const targetPages = pageIndices
    ? pageIndices.map((i) => pages[i])
    : pages;

  for (const page of targetPages) {
    const currentRotation = page.getRotation().angle;
    page.setRotation(degrees(currentRotation + angle));
  }

  return pdfDoc.save();
}
