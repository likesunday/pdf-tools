import { PDFDocument } from 'pdf-lib';

export async function splitPdf(
  fileBuffer: ArrayBuffer,
  ranges: number[][]
): Promise<Uint8Array[]> {
  const pdfDoc = await PDFDocument.load(fileBuffer);
  const results: Uint8Array[] = [];

  for (const range of ranges) {
    const newPdf = await PDFDocument.create();
    const pages = await newPdf.copyPages(pdfDoc, range.map((i) => i - 1));
    pages.forEach((page) => newPdf.addPage(page));
    results.push(await newPdf.save());
  }

  return results;
}

export async function splitPdfByPage(fileBuffer: ArrayBuffer): Promise<Uint8Array[]> {
  const pdfDoc = await PDFDocument.load(fileBuffer);
  const pageCount = pdfDoc.getPageCount();
  const results: Uint8Array[] = [];

  for (let i = 0; i < pageCount; i++) {
    const newPdf = await PDFDocument.create();
    const [page] = await newPdf.copyPages(pdfDoc, [i]);
    newPdf.addPage(page);
    results.push(await newPdf.save());
  }

  return results;
}
