const sharp = require('sharp');
const path = require('path');

const svgPath = path.join(__dirname, 'icon-source.svg');
const sizes = [192, 512];

async function generate() {
  for (const size of sizes) {
    const outPath = path.join(__dirname, `icon-${size}.png`);
    await sharp(svgPath)
      .resize(size, size)
      .png()
      .toFile(outPath);
    console.log(`Generated: ${outPath}`);
  }
}

generate().catch(console.error);
