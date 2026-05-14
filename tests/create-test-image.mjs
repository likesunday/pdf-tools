import { writeFileSync } from 'fs';

// Create a simple 100x100 PNG (minimal valid PNG)
const width = 100, height = 100;
const canvas_data = Buffer.alloc(width * height * 4 + height); // RGBA + filter bytes

// Fill with blue color
for (let y = 0; y < height; y++) {
  canvas_data[y * (width * 4 + 1)] = 0; // filter byte
  for (let x = 0; x < width; x++) {
    const offset = y * (width * 4 + 1) + 1 + x * 4;
    canvas_data[offset] = 66;     // R
    canvas_data[offset + 1] = 133; // G
    canvas_data[offset + 2] = 244; // B
    canvas_data[offset + 3] = 255; // A
  }
}

// Use a simpler approach - create a JPEG with sharp or just use a data buffer
// Actually, let's create a minimal valid JPEG
// Simplest: create a BMP and just use that for testing
// Even simpler: Use node to create a tiny valid PNG using zlib

import { deflateSync } from 'zlib';

function createPNG(w, h) {
  // PNG signature
  const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
  
  // IHDR chunk
  const ihdr_data = Buffer.alloc(13);
  ihdr_data.writeUInt32BE(w, 0);
  ihdr_data.writeUInt32BE(h, 4);
  ihdr_data[8] = 8; // bit depth
  ihdr_data[9] = 2; // color type (RGB)
  const ihdr = makeChunk('IHDR', ihdr_data);
  
  // IDAT chunk (image data)
  const raw = Buffer.alloc(h * (w * 3 + 1));
  for (let y = 0; y < h; y++) {
    raw[y * (w * 3 + 1)] = 0; // filter: none
    for (let x = 0; x < w; x++) {
      const offset = y * (w * 3 + 1) + 1 + x * 3;
      raw[offset] = 66;
      raw[offset + 1] = 133;
      raw[offset + 2] = 244;
    }
  }
  const compressed = deflateSync(raw);
  const idat = makeChunk('IDAT', compressed);
  
  // IEND chunk
  const iend = makeChunk('IEND', Buffer.alloc(0));
  
  return Buffer.concat([signature, ihdr, idat, iend]);
}

function makeChunk(type, data) {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length, 0);
  const typeBuffer = Buffer.from(type);
  const crcData = Buffer.concat([typeBuffer, data]);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(crcData), 0);
  return Buffer.concat([len, typeBuffer, data, crc]);
}

function crc32(buf) {
  let crc = 0xFFFFFFFF;
  for (let i = 0; i < buf.length; i++) {
    crc ^= buf[i];
    for (let j = 0; j < 8; j++) {
      crc = (crc >>> 1) ^ (crc & 1 ? 0xEDB88320 : 0);
    }
  }
  return (crc ^ 0xFFFFFFFF) >>> 0;
}

const png = createPNG(200, 200);
writeFileSync('tests/test.png', png);
console.log('Created tests/test.png');
