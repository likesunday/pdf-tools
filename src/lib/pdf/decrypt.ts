import { PDFDocument } from 'pdf-lib';

export async function decryptPdf(
  fileBuffer: ArrayBuffer,
  password: string
): Promise<Uint8Array> {
  const pdfDoc = await PDFDocument.load(fileBuffer, {
    ignoreEncryption: true,
  } as any);

  return pdfDoc.save();
}
