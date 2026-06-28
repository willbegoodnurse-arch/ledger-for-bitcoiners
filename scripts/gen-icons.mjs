import { mkdir } from "node:fs/promises";
import { dirname, join } from "node:path";
import sharp from "sharp";

const icons = [
  ["public/icons/apple-touch-icon.svg", "public/icons/apple-touch-icon-180.png", 180],
  ["public/icons/icon-192.svg", "public/icons/icon-192.png", 192],
  ["public/icons/icon-512.svg", "public/icons/icon-512.png", 512],
];

for (const [source, output, size] of icons) {
  await mkdir(dirname(output), { recursive: true });
  await sharp(join(process.cwd(), source)).resize(size, size).png().toFile(join(process.cwd(), output));
  console.log(`generated ${output}`);
}
