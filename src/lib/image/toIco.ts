export type IcoSize = 16 | 32 | 48 | 64 | 128 | 256;

export async function imageToIco(
  file: File,
  sizes: IcoSize[] = [16, 32, 48]
): Promise<Blob> {
  const img = await loadImage(file);
  const images: { width: number; height: number; data: Uint8Array }[] = [];

  for (const size of sizes) {
    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d')!;
    ctx.drawImage(img, 0, 0, size, size);
    const imageData = ctx.getImageData(0, 0, size, size);
    // Convert RGBA to BGRA for ICO format
    const bgra = new Uint8Array(imageData.data.length);
    for (let i = 0; i < imageData.data.length; i += 4) {
      bgra[i] = imageData.data[i + 2];     // B
      bgra[i + 1] = imageData.data[i + 1]; // G
      bgra[i + 2] = imageData.data[i];     // R
      bgra[i + 3] = imageData.data[i + 3]; // A
    }
    images.push({ width: size, height: size, data: bgra });
  }

  return createIcoBlob(images);
}

function loadImage(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => { URL.revokeObjectURL(url); resolve(img); };
    img.onerror = () => { URL.revokeObjectURL(url); reject(new Error('Failed to load image')); };
    img.src = url;
  });
}

function createIcoBlob(
  images: { width: number; height: number; data: Uint8Array }[]
): Blob {
  const headerSize = 6;
  const dirEntrySize = 16;
  const numImages = images.length;

  // Calculate offsets
  let offset = headerSize + dirEntrySize * numImages;
  const entries: { width: number; height: number; dataOffset: number; dataSize: number }[] = [];

  for (const img of images) {
    const bmpHeaderSize = 40;
    const dataSize = bmpHeaderSize + img.data.length;
    entries.push({ width: img.width, height: img.height, dataOffset: offset, dataSize });
    offset += dataSize;
  }

  // Build ICO file
  const totalSize = offset;
  const buffer = new ArrayBuffer(totalSize);
  const view = new DataView(buffer);
  let pos = 0;

  // ICO Header
  view.setUint16(pos, 0, true); pos += 2; // Reserved
  view.setUint16(pos, 1, true); pos += 2; // Type: 1 = ICO
  view.setUint16(pos, numImages, true); pos += 2; // Number of images

  // Directory entries
  for (let i = 0; i < numImages; i++) {
    const entry = entries[i];
    const img = images[i];
    view.setUint8(pos, img.width >= 256 ? 0 : img.width); pos += 1;
    view.setUint8(pos, img.height >= 256 ? 0 : img.height); pos += 1;
    view.setUint8(pos, 0); pos += 1; // Color palette
    view.setUint8(pos, 0); pos += 1; // Reserved
    view.setUint16(pos, 1, true); pos += 2; // Color planes
    view.setUint16(pos, 32, true); pos += 2; // Bits per pixel
    view.setUint32(pos, entry.dataSize, true); pos += 4; // Size of image data
    view.setUint32(pos, entry.dataOffset, true); pos += 4; // Offset
  }

  // Image data (BMP format without file header)
  for (let i = 0; i < numImages; i++) {
    const img = images[i];
    // BITMAPINFOHEADER
    view.setUint32(pos, 40, true); pos += 4; // Header size
    view.setInt32(pos, img.width, true); pos += 4; // Width
    view.setInt32(pos, img.height * 2, true); pos += 4; // Height (doubled for ICO)
    view.setUint16(pos, 1, true); pos += 2; // Planes
    view.setUint16(pos, 32, true); pos += 2; // Bits per pixel
    view.setUint32(pos, 0, true); pos += 4; // Compression
    view.setUint32(pos, img.data.length, true); pos += 4; // Image size
    view.setInt32(pos, 0, true); pos += 4; // X pixels per meter
    view.setInt32(pos, 0, true); pos += 4; // Y pixels per meter
    view.setUint32(pos, 0, true); pos += 4; // Colors used
    view.setUint32(pos, 0, true); pos += 4; // Important colors

    // Pixel data (bottom-up)
    const rowSize = img.width * 4;
    for (let y = img.height - 1; y >= 0; y--) {
      const rowOffset = y * rowSize;
      const uint8View = new Uint8Array(buffer, pos, rowSize);
      uint8View.set(img.data.slice(rowOffset, rowOffset + rowSize));
      pos += rowSize;
    }
  }

  return new Blob([buffer], { type: 'image/x-icon' });
}
