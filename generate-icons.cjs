const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

const densities = {
  mdpi: 48,
  hdpi: 72,
  xhdpi: 96,
  xxhdpi: 144,
  xxxhdpi: 192
};

function generateLlamaIconSVG() {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="1024" height="1024" viewBox="0 0 1024 1024">
  <defs>
    <linearGradient id="textGrad" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" style="stop-color:#e8304a;stop-opacity:1" />
      <stop offset="50%" style="stop-color:#c0368a;stop-opacity:1" />
      <stop offset="100%" style="stop-color:#6b3ab5;stop-opacity:1" />
    </linearGradient>
    <clipPath id="roundedClip">
      <rect width="1024" height="1024" rx="200" ry="200"/>
    </clipPath>
  </defs>

  <!-- Background -->
  <rect width="1024" height="1024" rx="200" ry="200" fill="white"/>

  <!-- Llama Body / Fluffy outline -->
  <g clip-path="url(#roundedClip)" fill="none" stroke="#111" stroke-linecap="round" stroke-linejoin="round">

    <!-- Left ear -->
    <path d="M330 210 Q310 130 360 100 Q400 80 410 160 Q420 200 390 230 Z"
          fill="white" stroke="#111" stroke-width="22"/>

    <!-- Right ear -->
    <path d="M630 210 Q650 130 610 100 Q570 80 560 160 Q550 200 580 230 Z"
          fill="white" stroke="#111" stroke-width="22"/>

    <!-- Left fluffy side -->
    <path d="M260 340 Q200 380 190 460 Q180 530 200 590 Q210 640 240 680 Q260 710 290 730 Q320 750 360 760 Q400 765 430 762"
          fill="none" stroke="#111" stroke-width="24"/>

    <!-- Right fluffy side -->
    <path d="M760 340 Q820 380 830 460 Q840 530 820 590 Q810 640 780 680 Q760 710 730 730 Q700 750 660 760 Q620 765 590 762"
          fill="none" stroke="#111" stroke-width="24"/>

    <!-- Main head circle -->
    <ellipse cx="512" cy="390" rx="230" ry="220"
             fill="white" stroke="#111" stroke-width="24"/>

    <!-- Fluffy fur texture left -->
    <path d="M285 330 Q265 360 260 400" stroke="#111" stroke-width="20" fill="none"/>
    <path d="M275 420 Q255 450 258 490" stroke="#111" stroke-width="20" fill="none"/>
    <path d="M282 510 Q262 540 268 580" stroke="#111" stroke-width="20" fill="none"/>
    <path d="M298 600 Q278 630 285 665" stroke="#111" stroke-width="20" fill="none"/>

    <!-- Fluffy fur texture right -->
    <path d="M738 330 Q758 360 762 400" stroke="#111" stroke-width="20" fill="none"/>
    <path d="M748 420 Q768 450 765 490" stroke="#111" stroke-width="20" fill="none"/>
    <path d="M742 510 Q762 540 756 580" stroke="#111" stroke-width="20" fill="none"/>
    <path d="M726 600 Q746 630 740 665" stroke="#111" stroke-width="20" fill="none"/>

    <!-- Snout -->
    <ellipse cx="512" cy="460" rx="110" ry="85"
             fill="white" stroke="#111" stroke-width="22"/>

    <!-- Nose (Y shape) -->
    <path d="M512 435 L512 470 M500 485 L512 470 L524 485"
          stroke="#111" stroke-width="14" fill="none" stroke-linecap="round"/>

    <!-- Left eye -->
    <circle cx="420" cy="380" r="22" fill="#111"/>

    <!-- Right eye -->
    <circle cx="604" cy="380" r="22" fill="#111"/>

    <!-- Bottom body -->
    <path d="M290 720 Q300 780 320 800 Q350 820 430 830 Q470 835 512 835 Q554 835 594 830 Q674 820 700 800 Q720 780 730 720"
          fill="white" stroke="#111" stroke-width="22"/>
  </g>

  <!-- SOHEL text with gradient -->
  <text x="512" y="960"
        font-family="'Arial Black', Arial, sans-serif"
        font-size="148"
        font-weight="900"
        text-anchor="middle"
        fill="url(#textGrad)"
        letter-spacing="8">SOHEL</text>
</svg>`;
}

async function generateIcons() {
  try {
    console.log('  Generating Ollama GUI app icon...\n');

    const svg = generateLlamaIconSVG();
    const tempFile = 'icon-1024-temp.png';

    await sharp(Buffer.from(svg))
      .resize(1024, 1024)
      .png()
      .toFile(tempFile);

    console.log('  Created base icon (1024x1024)');

    for (const [density, size] of Object.entries(densities)) {
      const dir = path.join('android', 'app', 'src', 'main', 'res', `mipmap-${density}`);

      await sharp(tempFile)
        .resize(size, size)
        .png()
        .toFile(path.join(dir, 'ic_launcher.png'));

      await sharp(tempFile)
        .resize(size, size)
        .png()
        .toFile(path.join(dir, 'ic_launcher_round.png'));

      await sharp(tempFile)
        .resize(size, size)
        .png()
        .toFile(path.join(dir, 'ic_launcher_foreground.png'));

      console.log(`  Generated ${density} icons (${size}x${size})`);
    }

    fs.unlinkSync(tempFile);
    console.log('\n  All app icons generated successfully!');

  } catch (err) {
    console.error('Failed to generate icons:', err);
    process.exit(1);
  }
}

generateIcons();
