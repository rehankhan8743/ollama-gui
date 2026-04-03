const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

// Sizes for each mipmap density (in pixels)
const densities = {
  mdpi: 48,
  hdpi: 72,
  xhdpi: 96,
  xxhdpi: 144,
  xxxhdpi: 192
};

function generateLlamaIconSVG() {
  return `
<svg xmlns="http://www.w3.org/2000/svg" width="1024" height="1024" viewBox="0 0 1024 1024">
  <defs>
    <!-- Beautiful purple-blue gradient background -->
    <linearGradient id="bgGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#667eea"/>
      <stop offset="100%" stop-color="#764ba2"/>
    </linearGradient>

    <!-- Rainbow gradient for SOHEL text -->
    <linearGradient id="textGrad" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" stop-color="#ff6b6b"/>
      <stop offset="16%" stop-color="#ffa502"/>
      <stop offset="33%" stop-color="#ffd700"/>
      <stop offset="50%" stop-color="#2ed573"/>
      <stop offset="66%" stop-color="#1e90ff"/>
      <stop offset="83%" stop-color="#a855f7"/>
      <stop offset="100%" stop-color="#ff6b81"/>
    </linearGradient>

    <!-- Drop shadow for text -->
    <filter id="textShadow" x="-10%" y="-20%" width="120%" height="140%">
      <feDropShadow dx="0" dy="4" stdDeviation="6" flood-color="rgba(0,0,0,0.4)"/>
    </filter>
  </defs>

  <!-- Rounded square background -->
  <rect x="0" y="0" width="1024" height="1024" rx="220" fill="url(#bgGrad)"/>

  <!-- Subtle decorative dots -->
  <g opacity="0.08">
    <circle cx="120" cy="150" r="5" fill="white"/>
    <circle cx="900" cy="180" r="4" fill="white"/>
    <circle cx="850" cy="950" r="6" fill="white"/>
    <circle cx="150" cy="880" r="3" fill="white"/>
    <circle cx="800" cy="100" r="3" fill="white"/>
    <circle cx="200" cy="90" r="4" fill="white"/>
  </g>

  <!-- ==================== -->
  <!-- SOHEL TEXT AT TOP    -->
  <!-- ==================== -->
  <text x="512" y="155" text-anchor="middle"
        font-family="'Arial Black', 'Arial', sans-serif"
        font-weight="900" font-size="140"
        fill="url(#textGrad)"
        letter-spacing="12"
        filter="url(#textShadow)">SOHEL</text>

  <!-- Decorative line under text -->
  <line x1="200" y1="180" x2="824" y2="180" stroke="rgba(255,255,255,0.3)" stroke-width="3" stroke-linecap="round"/>

  <!-- ==================== -->
  <!-- CUTE LLAMA CHARACTER -->
  <!-- ==================== -->
  <g transform="translate(512, 560) scale(0.78)">
    <!-- Shadow base -->
    <ellipse cx="0" cy="200" rx="200" ry="40" fill="rgba(0,0,0,0.15)"/>

    <!-- Body -->
    <ellipse cx="0" cy="100" rx="220" ry="180" fill="#ffffff"/>

    <!-- Neck -->
    <rect x="-80" y="-140" width="160" height="240" rx="45" fill="#ffffff"/>

    <!-- Head -->
    <ellipse cx="0" cy="-260" rx="170" ry="145" fill="#ffffff"/>

    <!-- Ears (pointy) -->
    <polygon points="-130,-340 -105,-415 -65,-355" fill="#ffffff"/>
    <polygon points="130,-340 105,-415 65,-355" fill="#ffffff"/>

    <!-- Inner ears (pink) -->
    <polygon points="-115,-345 -95,-405 -65,-350" fill="#ffcdd2"/>
    <polygon points="115,-345 95,-405 65,-350" fill="#ffcdd2"/>

    <!-- Eyes -->
    <ellipse cx="-60" cy="-260" rx="32" ry="38" fill="#2d3748"/>
    <ellipse cx="60" cy="-260" rx="32" ry="38" fill="#2d3748"/>

    <!-- Eye shine (cute sparkle) -->
    <circle cx="-70" cy="-270" r="14" fill="#ffffff"/>
    <circle cx="50" cy="-270" r="14" fill="#ffffff"/>
    <circle cx="-55" cy="-255" r="7" fill="#ffffff"/>
    <circle cx="65" cy="-255" r="7" fill="#ffffff"/>

    <!-- Nose -->
    <ellipse cx="0" cy="-222" rx="28" ry="16" fill="#ffccaa"/>

    <!-- Friendly smile -->
    <path d="M-45,-200 Q0,-170 45,-200" fill="none" stroke="#2d3748" stroke-width="7" stroke-linecap="round"/>

    <!-- Rosy cheeks -->
    <ellipse cx="-95" cy="-218" rx="22" ry="13" fill="#ff9a9e" opacity="0.6"/>
    <ellipse cx="95" cy="-218" rx="22" ry="13" fill="#ff9a9e" opacity="0.6"/>

    <!-- Cute pink bowtie -->
    <ellipse cx="-40" cy="200" rx="35" ry="22" fill="#ff6b9d"/>
    <ellipse cx="40" cy="200" rx="35" ry="22" fill="#ff6b9d"/>
    <circle cx="0" cy="200" r="14" fill="#e91e63"/>

    <!-- Body accent lines (cute fur) -->
    <path d="M-60,80 Q-90,60 -120,80" fill="none" stroke="#e8e8e8" stroke-width="6" stroke-linecap="round"/>
    <path d="M60,80 Q90,60 120,80" fill="none" stroke="#e8e8e8" stroke-width="6" stroke-linecap="round"/>
    <path d="M-50,120 Q-75,105 -100,120" fill="none" stroke="#e8e8e8" stroke-width="5" stroke-linecap="round"/>
    <path d="M50,120 Q75,105 100,120" fill="none" stroke="#e8e8e8" stroke-width="5" stroke-linecap="round"/>
  </g>

  <!-- Small decorative hearts -->
  <g transform="translate(220, 400)">
    <path d="M0,-10 C-12,-25 -30,-10 -15,5 L0,20 L15,5 C30,-10 12,-25 0,-10 Z"
          fill="#ff6b9d" opacity="0.4"/>
  </g>
  <g transform="translate(800, 420)">
    <path d="M0,-8 C-10,-20 -25,-8 -12,4 L0,16 L12,4 C25,-8 10,-20 0,-8 Z"
          fill="#ff6b9d" opacity="0.35"/>
  </g>
</svg>
  `;
}

async function generateIcons() {
  try {
    console.log('  Generating Ollama GUI app icon...\n');

    // Generate SVG
    const svg = generateLlamaIconSVG();

    // Create temporary 1024x1024 PNG
    const tempFile = 'icon-1024-temp.png';
    await sharp(Buffer.from(svg))
      .resize(1024, 1024)
      .png()
      .toFile(tempFile);

    console.log('  Created base icon (1024x1024)');

    // Generate each mipmap density
    for (const [density, size] of Object.entries(densities)) {
      const dir = path.join('android', 'app', 'src', 'main', 'res', `mipmap-${density}`);

      // Generate ic_launcher.png
      await sharp(tempFile)
        .resize(size, size)
        .png()
        .toFile(path.join(dir, 'ic_launcher.png'));

      // Generate ic_launcher_round.png
      await sharp(tempFile)
        .resize(size, size)
        .png()
        .toFile(path.join(dir, 'ic_launcher_round.png'));

      // Generate ic_launcher_foreground.png
      await sharp(tempFile)
        .resize(size, size)
        .png()
        .toFile(path.join(dir, 'ic_launcher_foreground.png'));

      console.log(`  Generated ${density} icons (${size}x${size})`);
    }

    // Cleanup temp file
    fs.unlinkSync(tempFile);
    console.log('\n  All app icons generated successfully!');

  } catch (err) {
    console.error('Failed to generate icons:', err);
    process.exit(1);
  }
}

generateIcons();
