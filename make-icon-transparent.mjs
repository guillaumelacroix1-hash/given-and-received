import sharp from 'sharp';
import path from 'path';
import fs from 'fs';

// Convert logo-icon.png (white shape on orange bg) to a white-on-transparent PNG.
const src = path.resolve('..', 'assets', 'logo-icon.png');
const outDir = path.resolve('public', 'images', 'brand');
fs.mkdirSync(outDir, { recursive: true });

const { data, info } = await sharp(src)
  .ensureAlpha()
  .raw()
  .toBuffer({ resolveWithObject: true });

for (let i = 0; i < data.length; i += 4) {
  const r = data[i], g = data[i+1], b = data[i+2];
  const brightness = (r + g + b) / 3;
  if (brightness < 210) {
    data[i] = 255; data[i+1] = 255; data[i+2] = 255; data[i+3] = 0;
  } else {
    data[i] = 255; data[i+1] = 255; data[i+2] = 255; data[i+3] = 255;
  }
}

await sharp(data, { raw: { width: info.width, height: info.height, channels: 4 } })
  .png()
  .toFile(path.join(outDir, 'logo-icon-white.png'));

console.log('logo-icon-white.png written');
