#!/usr/bin/env node
/** Enforces the <5 KB gzipped budget for the published ESM bundle. */
import { gzipSync, brotliCompressSync } from 'node:zlib';
import { readFileSync, existsSync } from 'node:fs';

const BUDGET = 5 * 1024;
const files = ['dist/index.mjs', 'dist/index.cjs', 'dist/index.global.js'];
const kb = (n) => `${(n / 1024).toFixed(2)} KB`;

let budgeted = 0;
for (const file of files) {
  if (!existsSync(file)) continue;
  const raw = readFileSync(file);
  const gz = gzipSync(raw, { level: 9 }).length;
  const br = brotliCompressSync(raw).length;
  const mark = file.endsWith('index.mjs') ? ' (budget)' : '';
  if (mark) budgeted = gz;
  console.log(
    `${file.padEnd(24)} raw ${kb(raw.length).padStart(9)}  gzip ${kb(gz).padStart(9)}  brotli ${kb(br).padStart(9)}${mark}`,
  );
}

if (!budgeted) {
  console.error('size: dist/index.mjs missing - run the build first');
  process.exit(1);
}
if (budgeted > BUDGET) {
  console.error(`size: budget exceeded - ${kb(budgeted)} gzipped > ${kb(BUDGET)}`);
  process.exit(1);
}
console.log(`size: OK - ${kb(budgeted)} gzipped, ${kb(BUDGET - budgeted)} under budget`);
