import sharp from 'sharp';

const W = 1200, H = 630;

const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
  <defs>
    <!-- Deep space background -->
    <radialGradient id="bg" cx="30%" cy="50%" r="80%">
      <stop offset="0%"   stop-color="#0d0a2e"/>
      <stop offset="100%" stop-color="#020408"/>
    </radialGradient>

    <!-- Purple aurora blob -->
    <radialGradient id="aurora1" cx="50%" cy="50%" r="50%">
      <stop offset="0%"   stop-color="#7B2FFF" stop-opacity="0.55"/>
      <stop offset="100%" stop-color="#7B2FFF" stop-opacity="0"/>
    </radialGradient>

    <!-- Cyan aurora blob -->
    <radialGradient id="aurora2" cx="50%" cy="50%" r="50%">
      <stop offset="0%"   stop-color="#00D4FF" stop-opacity="0.40"/>
      <stop offset="100%" stop-color="#00D4FF" stop-opacity="0"/>
    </radialGradient>

    <!-- NexSwap text glow -->
    <filter id="textGlow" x="-20%" y="-20%" width="140%" height="140%">
      <feGaussianBlur in="SourceGraphic" stdDeviation="18" result="blur"/>
      <feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>
    </filter>

    <!-- Card glow -->
    <filter id="cardGlow" x="-5%" y="-5%" width="110%" height="110%">
      <feGaussianBlur in="SourceGraphic" stdDeviation="12" result="blur"/>
      <feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>
    </filter>

    <!-- Card clip -->
    <clipPath id="cardClip">
      <rect x="720" y="55" width="430" height="520" rx="24"/>
    </clipPath>

    <!-- Button gradient -->
    <linearGradient id="btnGrad" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%"   stop-color="#7B2FFF"/>
      <stop offset="100%" stop-color="#00D4FF"/>
    </linearGradient>

    <!-- ETH icon gradient -->
    <linearGradient id="ethGrad" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%"   stop-color="#627EEA"/>
      <stop offset="100%" stop-color="#3C5BD0"/>
    </linearGradient>

    <!-- USDC icon gradient -->
    <linearGradient id="usdcGrad" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%"   stop-color="#2775CA"/>
      <stop offset="100%" stop-color="#1A5EA8"/>
    </linearGradient>

    <!-- Stars blur -->
    <filter id="starGlow">
      <feGaussianBlur stdDeviation="1" result="blur"/>
      <feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>
    </filter>
  </defs>

  <!-- ── Background ─────────────────────────────────────────────── -->
  <rect width="${W}" height="${H}" fill="url(#bg)"/>

  <!-- Stars -->
  ${Array.from({length: 120}, (_, i) => {
    const x = (i * 137.508) % W;
    const y = (i * 89.312)  % H;
    const r = i % 5 === 0 ? 1.4 : 0.7;
    const op = 0.3 + (i % 7) * 0.1;
    return `<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="${r}" fill="white" opacity="${op.toFixed(2)}"/>`;
  }).join('\n  ')}

  <!-- Aurora blobs -->
  <ellipse cx="160"  cy="400" rx="340" ry="280" fill="url(#aurora1)" opacity="0.9"/>
  <ellipse cx="80"   cy="150" rx="220" ry="180" fill="url(#aurora1)" opacity="0.5"/>
  <ellipse cx="500"  cy="560" rx="260" ry="160" fill="url(#aurora2)" opacity="0.45"/>

  <!-- Swirling aurora lines (SVG paths approximating the AI image) -->
  <path d="M-40 480 Q200 320 520 420 Q680 470 820 380" stroke="#7B2FFF" stroke-width="3" fill="none" opacity="0.25" stroke-linecap="round"/>
  <path d="M-40 510 Q220 360 540 450 Q700 495 830 400" stroke="#9D50FF" stroke-width="2" fill="none" opacity="0.18" stroke-linecap="round"/>
  <path d="M50  540 Q260 400 560 500 Q710 540 840 440" stroke="#00D4FF" stroke-width="2" fill="none" opacity="0.20" stroke-linecap="round"/>
  <path d="M-60 300 Q100 200 300 260 Q450 300 600 220" stroke="#7B2FFF" stroke-width="2.5" fill="none" opacity="0.20" stroke-linecap="round"/>

  <!-- Small planet bottom-left -->
  <circle cx="115" cy="555" r="52" fill="#1a0a3a" stroke="#7B2FFF" stroke-width="1.5" opacity="0.85"/>
  <circle cx="115" cy="555" r="52" fill="none" stroke="#9D50FF" stroke-width="0.5" opacity="0.4"/>
  <!-- Planet ring -->
  <ellipse cx="115" cy="555" rx="80" ry="18" fill="none" stroke="#7B2FFF" stroke-width="1.2" opacity="0.45"/>

  <!-- Tiny moon top-right area -->
  <circle cx="680" cy="68" r="18" fill="#1a1040" stroke="#5a30bb" stroke-width="1" opacity="0.7"/>

  <!-- ── NexSwap text (left side) ────────────────────────────────── -->
  <!-- Glow layer -->
  <text x="60" y="295"
    font-family="'Inter', 'Arial Black', sans-serif"
    font-weight="900" font-size="148"
    fill="#7B2FFF" opacity="0.35"
    filter="url(#textGlow)">NexSwap</text>

  <!-- Cyan glow layer -->
  <text x="60" y="295"
    font-family="'Inter', 'Arial Black', sans-serif"
    font-weight="900" font-size="148"
    fill="#00D4FF" opacity="0.12"
    filter="url(#textGlow)">NexSwap</text>

  <!-- Main text -->
  <text x="60" y="295"
    font-family="'Inter', 'Arial Black', sans-serif"
    font-weight="900" font-size="148"
    fill="white">NexSwap</text>

  <!-- Subtitle -->
  <text x="68" y="348"
    font-family="'Inter', Arial, sans-serif"
    font-weight="500" font-size="28"
    fill="#00D4FF" letter-spacing="1">Next-Gen DEX  ·  Powered by Uniswap v3</text>

  <!-- ── Swap Card (right side) ──────────────────────────────────── -->
  <!-- Card shadow/glow -->
  <rect x="718" y="53" width="434" height="524" rx="26"
    fill="none" stroke="#7B2FFF" stroke-width="2" opacity="0.6"
    filter="url(#cardGlow)"/>

  <!-- Card background -->
  <rect x="720" y="55" width="430" height="520" rx="24"
    fill="#0d0d24" opacity="0.95"/>
  <rect x="720" y="55" width="430" height="520" rx="24"
    fill="none" stroke="#7B2FFF" stroke-width="1.5" opacity="0.7"/>

  <!-- Card inner subtle gradient -->
  <rect x="720" y="55" width="430" height="180" rx="24"
    fill="url(#aurora1)" opacity="0.06" clip-path="url(#cardClip)"/>

  <!-- Card header -->
  <text x="755" y="103"
    font-family="'Inter', Arial, sans-serif"
    font-weight="700" font-size="22" fill="white">Swap</text>

  <!-- Settings icon -->
  <circle cx="1115" cy="93" r="16" fill="rgba(255,255,255,0.07)" stroke="rgba(255,255,255,0.12)" stroke-width="1"/>
  <text x="1115" y="99" text-anchor="middle"
    font-family="Arial" font-size="16" fill="rgba(255,255,255,0.5)">⚙</text>

  <!-- ── You Pay box ─────────────────────────────────────────────── -->
  <rect x="738" y="118" width="394" height="110" rx="16"
    fill="rgba(255,255,255,0.05)" stroke="rgba(255,255,255,0.09)" stroke-width="1"/>

  <text x="756" y="143" font-family="'Inter',Arial,sans-serif" font-size="12"
    fill="rgba(255,255,255,0.45)">You pay</text>
  <text x="1118" y="143" text-anchor="end" font-family="'Inter',Arial,sans-serif" font-size="12"
    fill="rgba(255,255,255,0.35)">Balance: 2.4587 ETH</text>

  <!-- ETH circle icon -->
  <circle cx="771" cy="183" r="20" fill="url(#ethGrad)"/>
  <polygon points="771,167 771,183 762,183" fill="white" opacity="0.9"/>
  <polygon points="771,167 780,183 771,183" fill="white" opacity="0.7"/>
  <polygon points="771,199 762,183 771,186" fill="white" opacity="0.7"/>
  <polygon points="771,199 780,183 771,186" fill="white" opacity="0.9"/>

  <text x="798" y="178" font-family="'Inter',Arial,sans-serif" font-weight="700"
    font-size="18" fill="white">ETH</text>
  <text x="798" y="196" font-family="'Inter',Arial,sans-serif" font-size="13"
    fill="rgba(255,255,255,0.35)">Ethereum</text>

  <!-- Amount -->
  <text x="1118" y="178" text-anchor="end"
    font-family="'Inter',Arial,sans-serif" font-weight="700"
    font-size="30" fill="white">1.00</text>
  <text x="1118" y="200" text-anchor="end"
    font-family="'Inter',Arial,sans-serif" font-size="13"
    fill="rgba(255,255,255,0.35)">≈ $3,246.72</text>

  <!-- ── Swap arrow button ───────────────────────────────────────── -->
  <circle cx="935" cy="252" r="20" fill="url(#btnGrad)" opacity="0.9"/>
  <text x="935" y="259" text-anchor="middle"
    font-family="Arial" font-size="17" fill="white">⇅</text>

  <!-- ── You Receive box ────────────────────────────────────────── -->
  <rect x="738" y="276" width="394" height="110" rx="16"
    fill="rgba(255,255,255,0.05)" stroke="rgba(255,255,255,0.09)" stroke-width="1"/>

  <text x="756" y="301" font-family="'Inter',Arial,sans-serif" font-size="12"
    fill="rgba(255,255,255,0.45)">You receive</text>
  <text x="1118" y="301" text-anchor="end" font-family="'Inter',Arial,sans-serif" font-size="12"
    fill="rgba(255,255,255,0.35)">Balance: 4,850.00 USDC</text>

  <!-- USDC circle icon -->
  <circle cx="771" cy="341" r="20" fill="url(#usdcGrad)"/>
  <text x="771" y="347" text-anchor="middle"
    font-family="Arial Black,sans-serif" font-size="17" font-weight="900" fill="white">$</text>

  <text x="798" y="336" font-family="'Inter',Arial,sans-serif" font-weight="700"
    font-size="18" fill="white">USDC</text>
  <text x="798" y="354" font-family="'Inter',Arial,sans-serif" font-size="13"
    fill="rgba(255,255,255,0.35)">USD Coin</text>

  <!-- Amount -->
  <text x="1118" y="334" text-anchor="end"
    font-family="'Inter',Arial,sans-serif" font-weight="700"
    font-size="26" fill="white">3,246.72</text>
  <text x="1118" y="356" text-anchor="end"
    font-family="'Inter',Arial,sans-serif" font-size="13"
    fill="rgba(255,255,255,0.35)">≈ $3,246.72</text>

  <!-- ── Swap button ────────────────────────────────────────────── -->
  <rect x="738" y="404" width="394" height="54" rx="14" fill="url(#btnGrad)"/>
  <text x="935" y="438" text-anchor="middle"
    font-family="'Inter',Arial,sans-serif" font-weight="700"
    font-size="20" fill="white" letter-spacing="0.5">Swap</text>

  <!-- ── Rate row ───────────────────────────────────────────────── -->
  <rect x="738" y="472" width="394" height="42" rx="10"
    fill="rgba(255,255,255,0.03)" stroke="rgba(255,255,255,0.07)" stroke-width="1"/>
  <text x="756" y="498"
    font-family="'Inter',Arial,sans-serif" font-size="13"
    fill="rgba(255,255,255,0.5)">≈  1 ETH ≈ 3,246.72 USDC</text>
  <text x="1118" y="498" text-anchor="end"
    font-family="'Inter',Arial,sans-serif" font-size="13"
    fill="rgba(0,212,255,0.8)">0.05%</text>

  <!-- ── Powered by Uniswap ─────────────────────────────────────── -->
  <text x="935" y="549" text-anchor="middle"
    font-family="'Inter',Arial,sans-serif" font-size="13"
    fill="rgba(255,255,255,0.25)">🦄  Powered by Uniswap v3</text>

</svg>`;

const pngBuffer = await sharp(Buffer.from(svg))
  .resize(W, H)
  .png({ quality: 95, compressionLevel: 9 })
  .toBuffer();

import { writeFileSync } from 'fs';
writeFileSync('public/og-image.png', pngBuffer);
console.log(`✅  public/og-image.png written (${(pngBuffer.length / 1024).toFixed(0)} KB)`);
