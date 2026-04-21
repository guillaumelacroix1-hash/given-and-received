import sharp from 'sharp';
import path from 'path';
import fs from 'fs';

const src = path.resolve('..', 'assets', 'logo-icon.png');
const outDir = path.resolve('public', 'images', 'brand');
fs.mkdirSync(outDir, { recursive: true });

const { data, info } = await sharp(src)
  .ensureAlpha()
  .raw()
  .toBuffer({ resolveWithObject: true });

// Terracotta color
const TR = { r: 0xC1, g: 0x87, b: 0x4D };
// Deep brown
const DB = { r: 0x3A, g: 0x2A, b: 0x1E };

function writeColored(color, name) {
  const out = Buffer.alloc(data.length);
  for (let i = 0; i < data.length; i += 4) {
    const r = data[i], g = data[i+1], b = data[i+2];
    const brightness = (r + g + b) / 3;
    if (brightness < 210) {
      out[i] = color.r; out[i+1] = color.g; out[i+2] = color.b; out[i+3] = 0;
    } else {
      out[i] = color.r; out[i+1] = color.g; out[i+2] = color.b; out[i+3] = 255;
    }
  }
  return sharp(out, { raw: { width: info.width, height: info.height, channels: 4 } })
    .png()
    .toFile(path.join(outDir, name));
}

await writeColored(TR, 'logo-icon-terracotta.png');
await writeColored(DB, 'logo-icon-brown.png');
console.log('colored icons written');
