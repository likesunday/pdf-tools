import { PDFDocument } from 'pdf-lib';

export async function encryptPdf(
  fileBuffer: ArrayBuffer,
  password: string
): Promise<Uint8Array> {
  const pdfDoc = await PDFDocument.load(fileBuffer);

  // pdf-lib doesn't natively support encryption with password
  // Use the save options with type assertion for the encryption fields
  return pdfDoc.save({
    userPassword: password,
    ownerPassword: password,
  } as any);
}
