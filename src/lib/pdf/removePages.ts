import { PDFDocument } from 'pdf-lib';

export async function removePages(
  fileBuffer: ArrayBuffer,
  pagesToRemove: number[]
): Promise<Uint8Array> {
  const pdfDoc = await PDFDocument.load(fileBuffer);
  const sortedPages = [...pagesToRemove].sort((a, b) => b - a);

  for (const pageIndex of sortedPages) {
    pdfDoc.removePage(pageIndex);
  }

  return pdfDoc.save();
}
