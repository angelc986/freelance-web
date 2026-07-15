const sharp = require("sharp");
const fs = require("fs");
const path = require("path");

const SVG = `<svg xmlns="http://www.w3.org/2000/svg" width="512" height="512" viewBox="0 0 512 512">
  <defs>
    <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#2563EB"/>
      <stop offset="100%" style="stop-color:#1D4ED8"/>
    </linearGradient>
  </defs>
  <rect width="512" height="512" rx="80" fill="url(#bg)"/>
  <text x="256" y="310" font-family="Arial,sans-serif" font-size="280" font-weight="bold" fill="white" text-anchor="middle">T</text>
  <line x1="160" y1="380" x2="352" y2="380" stroke="white" stroke-width="12" stroke-linecap="round" opacity="0.7"/>
  <line x1="200" y1="400" x2="312" y2="400" stroke="white" stroke-width="8" stroke-linecap="round" opacity="0.5"/>
</svg>`;

const sizes = [192, 384, 512]; // 192 for Android/iOS, 512 for splash/manifest

async function generate() {
  const outDir = path.join(__dirname, "..", "public", "icons");
  if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });

  // Save original SVG
  fs.writeFileSync(path.join(outDir, "icon-512.svg"), SVG);

  for (const size of sizes) {
    const buffer = await sharp(Buffer.from(SVG)).resize(size, size).png().toBuffer();
    const name = `icon-${size}x${size}.png`;
    fs.writeFileSync(path.join(outDir, name), buffer);
    console.log(`✅ ${name} (${size}x${size})`);
  }
}

generate().catch(console.error);
