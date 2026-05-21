// Simple script to create app icons
// Run: node create-icons.js

const fs = require('fs');
const path = require('path');

const svgIcon = `<svg width="512" height="512" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#dc2626;stop-opacity:1" />
      <stop offset="100%" style="stop-color:#991b1b;stop-opacity:1" />
    </linearGradient>
  </defs>
  <rect width="512" height="512" rx="100" fill="url(#grad)"/>
  <text x="256" y="340" font-size="280" text-anchor="middle" fill="white">🚨</text>
</svg>`;

const publicDir = path.join(__dirname, 'apps', 'frontend', 'public');

// Create icon-192.png placeholder
fs.writeFileSync(path.join(publicDir, 'icon.svg'), svgIcon);

console.log('✅ Icon SVG created!');
console.log('📝 To create PNG icons:');
console.log('   1. Open icon.svg in browser');
console.log('   2. Take screenshot or use online converter');
console.log('   3. Save as icon-192.png (192x192)');
console.log('   4. Save as icon-512.png (512x512)');
console.log('   5. Place in apps/frontend/public/');
