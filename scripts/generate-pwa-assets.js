require('dotenv').config();
const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

const ROOT = path.join(__dirname, '..');
const CLIENT_PUBLIC = path.join(ROOT, 'client', 'public');
const SOURCE_SVG = path.join(CLIENT_PUBLIC, 'logo.svg');

const ICONS_DIR = path.join(CLIENT_PUBLIC, 'icons');

const ensureDir = (dir) => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
    console.log(`Created: ${dir}`);
  }
};

const generateIcon = async (size, outputPath) => {
  await sharp(SOURCE_SVG)
    .resize(size, size, {
      fit: 'contain',
      background: { r: 37, g: 99, b: 235, alpha: 1 },
    })
    .png()
    .toFile(outputPath);
  console.log(`Generated: ${path.basename(outputPath)} (${size}x${size})`);
};

const generateMaskableIcon = async (size, outputPath) => {
  const innerSize = Math.round(size * 0.8);
  const padding = Math.round((size - innerSize) / 2);

  const inner = await sharp(SOURCE_SVG)
    .resize(innerSize, innerSize, { fit: 'contain' })
    .toBuffer();

  await sharp({
    create: {
      width: size,
      height: size,
      channels: 4,
      background: { r: 37, g: 99, b: 235, alpha: 1 },
    },
  })
    .composite([{ input: inner, top: padding, left: padding }])
    .png()
    .toFile(outputPath);

  console.log(`Generated: ${path.basename(outputPath)} (${size}x${size}, maskable)`);
};

const generateFavicon = async () => {
  const outputPath = path.join(CLIENT_PUBLIC, 'favicon.ico');
  await sharp(SOURCE_SVG)
    .resize(48, 48)
    .toFormat('png')
    .toFile(outputPath.replace('.ico', '.png'));
  console.log('Generated: favicon.png (48x48)');
};

const generateAppleTouchIcon = async () => {
  const outputPath = path.join(CLIENT_PUBLIC, 'apple-touch-icon.png');
  await sharp(SOURCE_SVG)
    .resize(180, 180, {
      fit: 'contain',
      background: { r: 37, g: 99, b: 235, alpha: 1 },
    })
    .png()
    .toFile(outputPath);
  console.log('Generated: apple-touch-icon.png (180x180)');
};

const generateManifest = () => {
  const manifest = {
    name: 'ExamPro',
    short_name: 'ExamPro',
    description: 'Exam Entry and Management System',
    start_url: '/',
    display: 'standalone',
    background_color: '#f3f4f6',
    theme_color: '#2563eb',
    orientation: 'portrait',
    icons: [
      {
        src: '/icons/icon-72x72.png',
        sizes: '72x72',
        type: 'image/png',
      },
      {
        src: '/icons/icon-96x96.png',
        sizes: '96x96',
        type: 'image/png',
      },
      {
        src: '/icons/icon-128x128.png',
        sizes: '128x128',
        type: 'image/png',
      },
      {
        src: '/icons/icon-144x144.png',
        sizes: '144x144',
        type: 'image/png',
      },
      {
        src: '/icons/icon-152x152.png',
        sizes: '152x152',
        type: 'image/png',
      },
      {
        src: '/icons/icon-192x192.png',
        sizes: '192x192',
        type: 'image/png',
      },
      {
        src: '/icons/icon-384x384.png',
        sizes: '384x384',
        type: 'image/png',
      },
      {
        src: '/icons/icon-512x512.png',
        sizes: '512x512',
        type: 'image/png',
      },
      {
        src: '/icons/maskable-192x192.png',
        sizes: '192x192',
        type: 'image/png',
        purpose: 'maskable',
      },
      {
        src: '/icons/maskable-512x512.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'maskable',
      },
    ],
  };

  const outputPath = path.join(CLIENT_PUBLIC, 'manifest');
  fs.writeFileSync(outputPath, JSON.stringify(manifest, null, 2));
  console.log('Generated: manifest.webmanifest');
};

const main = async () => {
  console.log('=== PWA Asset Generator ===\n');

  if (!fs.existsSync(SOURCE_SVG)) {
    console.error(`Source SVG not found: ${SOURCE_SVG}`);
    console.error('Please create client/public/logo.svg first.');
    process.exit(1);
  }

  ensureDir(ICONS_DIR);

  const sizes = [72, 96, 128, 144, 152, 192, 384, 512];

  console.log('\nGenerating standard icons...');
  for (const size of sizes) {
    const outputPath = path.join(ICONS_DIR, `icon-${size}x${size}.png`);
    await generateIcon(size, outputPath);
  }

  console.log('\nGenerating maskable icons...');
  await generateMaskableIcon(192, path.join(ICONS_DIR, 'maskable-192x192.png'));
  await generateMaskableIcon(512, path.join(ICONS_DIR, 'maskable-512x512.png'));

  console.log('\nGenerating favicon and apple-touch-icon...');
  await generateFavicon();
  await generateAppleTouchIcon();

  console.log('\nGenerating manifest...');
  generateManifest();

  console.log('\n=== Done! ===');
  console.log('Generated files in:');
  console.log(`  ${ICONS_DIR}`);
  console.log(`  ${CLIENT_PUBLIC}/manifest.webmanifest`);
  console.log(`  ${CLIENT_PUBLIC}/apple-touch-icon.png`);
  console.log(`  ${CLIENT_PUBLIC}/favicon.png`);
};

main().catch((error) => {
  console.error('Generation failed:', error);
  process.exit(1);
});