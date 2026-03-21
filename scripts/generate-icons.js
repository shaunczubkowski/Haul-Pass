#!/usr/bin/env node
/**
 * Generate branded FillRight PWA icons using sharp.
 *
 * Renders the Lucide Fuel SVG icon on a purple background at multiple sizes:
 *   icon-192.png            (192×192) — Android PWA, purpose: any
 *   icon-512.png            (512×512) — Android PWA, purpose: any
 *   icon-192-maskable.png   (192×192) — artwork within W3C maskable safe-zone
 *   icon-512-maskable.png   (512×512) — artwork within W3C maskable safe-zone
 *   apple-touch-icon.png    (180×180) — iOS Add to Home Screen
 *
 * Run from the repo root:
 *   node scripts/generate-icons.js
 */

const sharp = require("sharp");
const path = require("path");
const fs = require("fs");

const PURPLE = "#7c3aed";

// Lucide Fuel icon paths (24×24 viewBox, ISC license)
const FUEL_PATHS = [
  "M14 13h2a2 2 0 0 1 2 2v2a2 2 0 0 0 4 0v-6.998a2 2 0 0 0-.59-1.42L18 5",
  "M14 21V5a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v16",
  "M2 21h13",
  "M3 9h11",
];

/**
 * Build an SVG string for the icon at 512×512.
 *
 * Non-maskable: content at ~70% of canvas (scale 15 = 360px, 76px padding).
 * Maskable: content fits within the W3C safe-zone circle (radius = 40% of
 * canvas = 204.8px → largest inscribed square ≈ 289px → scale 12 = 288px,
 * 112px padding).
 */
function makeSvg(maskable = false) {
  const scale = maskable ? 12 : 15;
  const contentSize = 24 * scale;
  const padding = (512 - contentSize) / 2;
  const pathEls = FUEL_PATHS.map((d) => `    <path d="${d}"/>`).join("\n");

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="512" height="512">
  <rect width="512" height="512" fill="${PURPLE}"/>
  <g transform="translate(${padding} ${padding}) scale(${scale})" stroke="#ffffff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" fill="none">
${pathEls}
  </g>
</svg>`;
}

async function main() {
  const publicDir = path.join(__dirname, "..", "public");

  const targets = [
    { name: "icon-192.png", size: 192, maskable: false },
    { name: "icon-512.png", size: 512, maskable: false },
    { name: "icon-192-maskable.png", size: 192, maskable: true },
    { name: "icon-512-maskable.png", size: 512, maskable: true },
    { name: "apple-touch-icon.png", size: 180, maskable: false },
  ];

  for (const { name, size, maskable } of targets) {
    const svg = Buffer.from(makeSvg(maskable));
    const out = path.join(publicDir, name);
    await sharp(svg).resize(size, size).png().toFile(out);
    const bytes = fs.statSync(out).size;
    const variant = maskable ? "maskable" : "any    ";
    console.log(
      `  [${variant}]  ${String(size).padStart(3)}px  ${name.padEnd(30)}  ${bytes.toLocaleString()} bytes`
    );
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
