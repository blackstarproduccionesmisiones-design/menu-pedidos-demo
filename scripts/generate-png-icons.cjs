const fs = require('fs');
const path = require('path');
const zlib = require('zlib');

function crc32(buf) {
  let crc = 0xffffffff;
  for (let i = 0; i < buf.length; i++) {
    crc ^= buf[i];
    for (let j = 0; j < 8; j++) {
      crc = (crc >>> 1) ^ (crc & 1 ? 0xedb88320 : 0);
    }
  }
  return (crc ^ 0xffffffff) >>> 0;
}

function makeChunk(type, data) {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length, 0);
  const typeBuf = Buffer.from(type, 'ascii');
  const body = Buffer.concat([typeBuf, data]);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(body), 0);
  return Buffer.concat([len, body, crc]);
}

function createPng(width, height, isMaskable = false) {
  const rowBytes = width * 4;
  const rawData = Buffer.alloc(height * (rowBytes + 1));

  const cx = width / 2;
  const cy = height / 2;
  const radius = isMaskable ? width * 0.45 : width * 0.44;

  let offset = 0;
  for (let y = 0; y < height; y++) {
    rawData[offset++] = 0; // Filter type: None
    const ny = (y - cy) / cy;

    for (let x = 0; x < width; x++) {
      const nx = (x - cx) / cx;
      const dist = Math.sqrt(nx * nx + ny * ny);

      // Base Red / Dark Red gradient background
      let r = 220 - Math.floor(y / height * 60); // 220 -> 160
      let g = 38 - Math.floor(y / height * 15);   // 38 -> 23
      let b = 38 - Math.floor(y / height * 15);   // 38 -> 23
      let a = 255;

      // Gold outer circular ring
      if (Math.abs(dist - 0.78) < 0.035) {
        r = 250;
        g = 204;
        b = 21;
      }
      // Inner Flame center
      else if (dist < 0.55 && (ny > -0.6 && ny < 0.35)) {
        // Flame shape
        const flameWidth = 0.45 * (1 - (ny + 0.6) / 1.1);
        if (Math.abs(nx) < flameWidth) {
          if (dist < 0.25) {
            // Heart of flame (Gold)
            r = 254;
            g = 240;
            b = 138;
          } else {
            // Warm Orange
            r = 249;
            g = 115;
            b = 22;
          }
        }
      }
      // White banner across lower section (only if not too close to edges for maskable)
      else if (ny > 0.45 && ny < 0.72 && Math.abs(nx) < 0.72) {
        r = 255;
        g = 255;
        b = 255;
      }

      rawData[offset++] = Math.min(255, Math.max(0, r));
      rawData[offset++] = Math.min(255, Math.max(0, g));
      rawData[offset++] = Math.min(255, Math.max(0, b));
      rawData[offset++] = a;
    }
  }

  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8; // bit depth
  ihdr[9] = 6; // color type: RGBA
  ihdr[10] = 0; // compression
  ihdr[11] = 0; // filter
  ihdr[12] = 0; // interlace

  const compressed = zlib.deflateSync(rawData);

  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    makeChunk('IHDR', ihdr),
    makeChunk('IDAT', compressed),
    makeChunk('IEND', Buffer.alloc(0))
  ]);
}

const publicDir = path.resolve(__dirname, '../public');

// 1. 192x192
fs.writeFileSync(path.join(publicDir, 'pwa-192x192.png'), createPng(192, 192, false));
console.log('Created pwa-192x192.png');

// 2. 512x512
fs.writeFileSync(path.join(publicDir, 'pwa-512x512.png'), createPng(512, 512, false));
console.log('Created pwa-512x512.png');

// 3. 512x512 maskable (with safe zone margins)
fs.writeFileSync(path.join(publicDir, 'pwa-maskable-512x512.png'), createPng(512, 512, true));
console.log('Created pwa-maskable-512x512.png');

// 4. Apple Touch Icon 180x180
fs.writeFileSync(path.join(publicDir, 'apple-touch-icon.png'), createPng(180, 180, false));
console.log('Created apple-touch-icon.png');

// 5. Favicon copy
fs.writeFileSync(path.join(publicDir, 'favicon.ico'), createPng(64, 64, false));
console.log('Created favicon.ico');
