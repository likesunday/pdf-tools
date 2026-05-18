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

export async function splitPdfByInterval(
  fileBuffer: ArrayBuffer,
  interval: number
): Promise<Uint8Array[]> {
  const pdfDoc = await PDFDocument.load(fileBuffer);
  const pageCount = pdfDoc.getPageCount();
  const results: Uint8Array[] = [];

  for (let start = 0; start < pageCount; start += interval) {
    const end = Math.min(start + interval, pageCount);
    const newPdf = await PDFDocument.create();
    const indices = Array.from({ length: end - start }, (_, i) => start + i);
    const pages = await newPdf.copyPages(pdfDoc, indices);
    pages.forEach((page) => newPdf.addPage(page));
    results.push(await newPdf.save());
  }

  return results;
}

export async function splitPdfByRanges(
  fileBuffer: ArrayBuffer,
  ranges: { from: number; to: number }[],
  mergeAll: boolean = false
): Promise<Uint8Array[]> {
  const pdfDoc = await PDFDocument.load(fileBuffer);

  if (mergeAll) {
    const newPdf = await PDFDocument.create();
    for (const range of ranges) {
      const indices = Array.from(
        { length: range.to - range.from + 1 },
        (_, i) => range.from - 1 + i
      );
      const pages = await newPdf.copyPages(pdfDoc, indices);
      pages.forEach((page) => newPdf.addPage(page));
    }
    return [await newPdf.save()];
  }

  const results: Uint8Array[] = [];
  for (const range of ranges) {
    const newPdf = await PDFDocument.create();
    const indices = Array.from(
      { length: range.to - range.from + 1 },
      (_, i) => range.from - 1 + i
    );
    const pages = await newPdf.copyPages(pdfDoc, indices);
    pages.forEach((page) => newPdf.addPage(page));
    results.push(await newPdf.save());
  }

  return results;
}

export async function getPageCount(fileBuffer: ArrayBuffer): Promise<number> {
  const pdfDoc = await PDFDocument.load(fileBuffer);
  return pdfDoc.getPageCount();
}
