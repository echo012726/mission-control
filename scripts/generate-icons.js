const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

const iconsDir = path.join(__dirname, 'public', 'icons');

// Create icons directory if it doesn't exist
if (!fs.existsSync(iconsDir)) {
  fs.mkdirSync(iconsDir, { recursive: true });
}

// Icon sizes needed
const sizes = [72, 96, 128, 144, 152, 192, 384, 512];

// Create a simple gradient icon with "MC" text
async function createIcon(size) {
  const svg = `
    <svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" style="stop-color:#6366f1;stop-opacity:1" />
          <stop offset="100%" style="stop-color:#8b5cf6;stop-opacity:1" />
        </linearGradient>
      </defs>
      <rect width="${size}" height="${size}" rx="${size * 0.15}" fill="url(#grad)"/>
      <text x="50%" y="55%" font-family="Arial, sans-serif" font-weight="bold" font-size="${size * 0.4}px" 
            fill="white" text-anchor="middle" dominant-baseline="middle">MC</text>
    </svg>
  `;
  
  await sharp(Buffer.from(svg))
    .png()
    .toFile(path.join(iconsDir, `icon-${size}x${size}.png`));
  
  console.log(`Created icon-${size}x${size}.png`);
}

// Create Apple touch icon
async function createAppleIcon() {
  const size = 180;
  const svg = `
    <svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" style="stop-color:#6366f1;stop-opacity:1" />
          <stop offset="100%" style="stop-color:#8b5cf6;stop-opacity:1" />
        </linearGradient>
      </defs>
      <rect width="${size}" height="${size}" rx="${size * 0.15}" fill="url(#grad)"/>
      <text x="50%" y="55%" font-family="Arial, sans-serif" font-weight="bold" font-size="${size * 0.4}px" 
            fill="white" text-anchor="middle" dominant-baseline="middle">MC</text>
    </svg>
  `;
  
  await sharp(Buffer.from(svg))
    .png()
    .toFile(path.join(iconsDir, 'apple-touch-icon.png'));
  
  console.log('Created apple-touch-icon.png');
}

async function main() {
  console.log('Generating PWA icons...');
  
  for (const size of sizes) {
    await createIcon(size);
  }
  
  await createAppleIcon();
  
  console.log('All icons generated successfully!');
}

main().catch(console.error);
