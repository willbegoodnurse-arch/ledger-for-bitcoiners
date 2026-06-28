import assert from "node:assert/strict";
import { join } from "node:path";
import sharp from "sharp";

const icons = [
  ["public/icons/apple-touch-icon-180.png", 180],
  ["public/icons/icon-192.png", 192],
  ["public/icons/icon-512.png", 512],
];

for (const [iconPath, size] of icons) {
  const metadata = await sharp(join(process.cwd(), iconPath)).metadata();
  assert.equal(metadata.format, "png", `${iconPath} must be a PNG`);
  assert.equal(metadata.width, size, `${iconPath} must be ${size}px wide`);
  assert.equal(metadata.height, size, `${iconPath} must be ${size}px tall`);
  console.log(`verified ${iconPath}`);
}
