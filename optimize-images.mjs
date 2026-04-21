import sharp from 'sharp';
import fs from 'fs';
import path from 'path';

const ROOT = path.resolve('..');
const SRC_PHOTOS = path.join(ROOT, 'assets', 'Manu Photos');
const SRC_MISC = path.join(ROOT, 'assets');
const OUT_DIR = path.resolve('public', 'images');
const OUT_PHOTOS = path.join(OUT_DIR, 'photos');
const OUT_THUMBS = path.join(OUT_DIR, 'thumbs');
const OUT_BRAND = path.join(OUT_DIR, 'brand');

for (const d of [OUT_DIR, OUT_PHOTOS, OUT_THUMBS, OUT_BRAND]) {
  fs.mkdirSync(d, { recursive: true });
}

async function processPhoto(srcFile, baseName) {
  const src = path.join(SRC_PHOTOS, srcFile);
  const jpgOut = path.join(OUT_PHOTOS, `${baseName}.jpg`);
  const webpOut = path.join(OUT_PHOTOS, `${baseName}.webp`);
  const thumbWebp = path.join(OUT_THUMBS, `${baseName}.webp`);
  const thumbJpg = path.join(OUT_THUMBS, `${baseName}.jpg`);

  const img = sharp(src).rotate();
  const meta = await img.metadata();
  const isPortrait = meta.height > meta.width;

  await sharp(src).rotate()
    .resize({ width: 2000, height: 2000, fit: 'inside', withoutEnlargement: true })
    .jpeg({ quality: 82, mozjpeg: true })
    .toFile(jpgOut);

  await sharp(src).rotate()
    .resize({ width: 2000, height: 2000, fit: 'inside', withoutEnlargement: true })
    .webp({ quality: 80 })
    .toFile(webpOut);

  await sharp(src).rotate()
    .resize({ width: 700, height: 700, fit: 'inside', withoutEnlargement: true })
    .webp({ quality: 75 })
    .toFile(thumbWebp);

  await sharp(src).rotate()
    .resize({ width: 700, height: 700, fit: 'inside', withoutEnlargement: true })
    .jpeg({ quality: 78, mozjpeg: true })
    .toFile(thumbJpg);

  return { baseName, isPortrait, width: meta.width, height: meta.height };
}

async function processMisc(srcName, outName, opts = {}) {
  const src = path.join(SRC_MISC, srcName);
  const { maxW = 2000 } = opts;
  const jpgOut = path.join(OUT_BRAND, `${outName}.jpg`);
  const webpOut = path.join(OUT_BRAND, `${outName}.webp`);
  await sharp(src).rotate()
    .resize({ width: maxW, fit: 'inside', withoutEnlargement: true })
    .jpeg({ quality: 85, mozjpeg: true })
    .toFile(jpgOut);
  await sharp(src).rotate()
    .resize({ width: maxW, fit: 'inside', withoutEnlargement: true })
    .webp({ quality: 82 })
    .toFile(webpOut);
}

async function main() {
  const photos = fs.readdirSync(SRC_PHOTOS)
    .filter(f => /\.(jpe?g|png)$/i.test(f))
    .sort();

  console.log(`Found ${photos.length} photos. Processing…`);

  const manifest = [];
  let i = 0;
  for (const f of photos) {
    i++;
    const base = path.parse(f).name;
    const info = await processPhoto(f, base);
    manifest.push(info);
    if (i % 5 === 0 || i === photos.length) console.log(`  ${i}/${photos.length}`);
  }

  // Bonfire images
  await processMisc('bonefire.png', 'bonfire');
  await processMisc('bonefire2.png', 'bonfire2');
  console.log('Bonfire done.');

  // Logo icon — keep transparent, convert orange bg to transparent? It's a solid orange bg.
  // We'll copy raw to brand dir and handle styling in CSS.
  fs.copyFileSync(path.join(SRC_MISC, 'logo-icon.png'), path.join(OUT_BRAND, 'logo-icon.png'));
  fs.copyFileSync(path.join(SRC_MISC, 'logo.png'), path.join(OUT_BRAND, 'logo.png'));

  fs.writeFileSync(
    path.resolve('public', 'images', 'manifest.json'),
    JSON.stringify(manifest, null, 2)
  );
  console.log(`Manifest written with ${manifest.length} entries.`);
}

main().catch(e => { console.error(e); process.exit(1); });
