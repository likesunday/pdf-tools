import { PDFDocument, StandardFonts } from 'pdf-lib';
import { writeFileSync } from 'fs';

async function createTestPdf() {
  const pdf = await PDFDocument.create();
  const font = await pdf.embedFont(StandardFonts.Helvetica);
  
  for (let i = 1; i <= 3; i++) {
    const page = pdf.addPage([595, 842]);
    page.drawText(`Test Page ${i}`, {
      x: 50, y: 750, size: 24, font
    });
    page.drawText('Lorem ipsum dolor sit amet, consectetur adipiscing elit.', {
      x: 50, y: 700, size: 12, font
    });
  }
  
  const bytes = await pdf.save();
  writeFileSync('tests/test.pdf', bytes);
  console.log('Created tests/test.pdf');
}

createTestPdf();
