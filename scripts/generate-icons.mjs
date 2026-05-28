import sharp from 'sharp';
import { writeFileSync, mkdirSync } from 'fs';

mkdirSync('public/icons', { recursive: true });

// NexSwap icon: purple/cyan gradient background + white lightning bolt
function makeSvg(size) {
  const pad  = Math.round(size * 0.18);
  const bolt = size - pad * 2;
  // Lightning bolt path scaled to bolt×bolt box, then translated by pad
  const s    = bolt / 24; // scale factor (bolt is drawn on a 24-unit grid)
  const tx   = pad;
  const ty   = pad;

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
  <defs>
    <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%"   stop-color="#7B2FFF"/>
      <stop offset="100%" stop-color="#00D4FF"/>
    </linearGradient>
    <filter id="glow">
      <feGaussianBlur stdDeviation="${Math.max(1, size * 0.025)}" result="blur"/>
      <feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>
    </filter>
  </defs>

  <!-- Background rounded square -->
  <rect width="${size}" height="${size}" rx="${Math.round(size * 0.22)}" fill="url(#bg)"/>

  <!-- Subtle inner highlight -->
  <rect width="${size}" height="${size * 0.55}" rx="${Math.round(size * 0.22)}"
    fill="rgba(255,255,255,0.08)"/>

  <!-- Lightning bolt (Lucide Zap path scaled) -->
  <!-- Original Lucide path: M13 2L3 14h9l-1 8 10-12h-9l1-8z on 24×24 grid -->
  <g transform="translate(${tx}, ${ty}) scale(${s.toFixed(4)})" filter="url(#glow)">
    <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"
      fill="white" opacity="0.95"/>
  </g>
</svg>`;
}

for (const size of [192, 512]) {
  const svg    = makeSvg(size);
  const buffer = await sharp(Buffer.from(svg))
    .resize(size, size)
    .png({ quality: 95 })
    .toBuffer();
  const path = `public/icons/icon-${size}.png`;
  writeFileSync(path, buffer);
  console.log(`✅  ${path} (${(buffer.length / 1024).toFixed(0)} KB)`);
}

// Also write a 32×32 favicon
const faviconSvg = makeSvg(32);
const faviconBuf = await sharp(Buffer.from(faviconSvg)).resize(32, 32).png().toBuffer();
writeFileSync('public/favicon.png', faviconBuf);
console.log('✅  public/favicon.png');
