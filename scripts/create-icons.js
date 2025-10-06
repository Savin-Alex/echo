#!/usr/bin/env node

/*
 * Simple script to create placeholder icons for Echo
 * This creates basic colored squares as placeholder icons
 */

const fs = require('fs');
const path = require('path');

// Create a simple SVG icon
const svgIcon = `
<svg width="512" height="512" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="grad1" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#4A90E2;stop-opacity:1" />
      <stop offset="100%" style="stop-color:#357ABD;stop-opacity:1" />
    </linearGradient>
  </defs>
  <rect width="512" height="512" rx="80" ry="80" fill="url(#grad1)"/>
  <text x="256" y="280" font-family="Arial, sans-serif" font-size="200" font-weight="bold" text-anchor="middle" fill="white">E</text>
  <circle cx="256" cy="350" r="8" fill="white" opacity="0.8"/>
  <circle cx="280" cy="350" r="8" fill="white" opacity="0.8"/>
  <circle cx="304" cy="350" r="8" fill="white" opacity="0.8"/>
</svg>`;

// Create build directory if it doesn't exist
const buildDir = path.join(__dirname, '..', 'build');
if (!fs.existsSync(buildDir)) {
  fs.mkdirSync(buildDir, { recursive: true });
}

// Write SVG icon
const svgPath = path.join(buildDir, 'icon.svg');
fs.writeFileSync(svgPath, svgIcon);

// Create a simple PNG using Node.js (basic implementation)
// For production, you should use proper icon creation tools
const createSimplePng = () => {
  // This is a very basic PNG creation - in production use proper tools
  const pngData = Buffer.from([
    0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A, // PNG signature
    0x00, 0x00, 0x00, 0x0D, 0x49, 0x48, 0x44, 0x52, // IHDR chunk
    0x00, 0x00, 0x02, 0x00, 0x00, 0x00, 0x02, 0x00, // 512x512
    0x08, 0x06, 0x00, 0x00, 0x00, 0xC4, 0x46, 0x38, // RGBA
    0x7A, 0x00, 0x00, 0x00, 0x1A, 0x49, 0x44, 0x41, // IDAT chunk
    0x54, 0x78, 0x9C, 0x63, 0x00, 0x01, 0x00, 0x00, // Compressed data
    0x05, 0x00, 0x01, 0x0D, 0x0A, 0x2D, 0xB4, 0x00, // (simplified)
    0x00, 0x00, 0x00, 0x49, 0x45, 0x4E, 0x44, 0xAE, // IEND chunk
    0x42, 0x60, 0x82
  ]);
  
  return pngData;
};

// Create placeholder files
const iconPaths = [
  { file: 'icon.png', data: createSimplePng() },
  { file: 'icon.ico', data: createSimplePng() }, // Simplified - use proper ICO creation
  { file: 'icon.icns', data: createSimplePng() } // Simplified - use proper ICNS creation
];

iconPaths.forEach(({ file, data }) => {
  const filePath = path.join(buildDir, file);
  fs.writeFileSync(filePath, data);
  console.log(`Created placeholder icon: ${file}`);
});

// Create DMG background placeholder
const dmgBackgroundSvg = `
<svg width="540" height="380" xmlns="http://www.w3.org/2000/svg">
  <rect width="540" height="380" fill="#f5f5f5"/>
  <rect x="20" y="20" width="500" height="340" rx="10" ry="10" fill="white" stroke="#ddd" stroke-width="2"/>
  <text x="270" y="120" font-family="Arial, sans-serif" font-size="48" font-weight="bold" text-anchor="middle" fill="#4A90E2">Echo</text>
  <text x="270" y="170" font-family="Arial, sans-serif" font-size="24" text-anchor="middle" fill="#666">AI Interview & Meeting Copilot</text>
  <text x="270" y="220" font-family="Arial, sans-serif" font-size="16" text-anchor="middle" fill="#999">Drag Echo to Applications to install</text>
</svg>`;

fs.writeFileSync(path.join(buildDir, 'dmg-background.svg'), dmgBackgroundSvg);

console.log('\n✅ Placeholder icons created successfully!');
console.log('\n📝 Note: These are placeholder icons. For production, create proper icons using:');
console.log('   - Design tools (Figma, Sketch, etc.)');
console.log('   - Icon creation tools (iconutil, ImageMagick, etc.)');
console.log('   - Professional icon design services');
console.log('\n🔧 To create proper icons, follow the instructions in build/README.md');
