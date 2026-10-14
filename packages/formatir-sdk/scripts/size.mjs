#!/usr/bin/env node
/** Enforces gzip budgets per published entry (the core must stay < 6 KB). */
import { gzipSync, brotliCompressSync } from 'node:zlib';
import { readFileSync, existsSync, appendFileSync } from 'node:fs';

/** Budget per ESM entry, in bytes gzipped. CJS / IIFE builds are reported only. */
const BUDGETS = {
  'dist/index.mjs': 6 * 1024,
  'dist/extras.mjs': 2 * 1024,
};
const files = Object.keys(BUDGETS).flatMap((f) => [
  f,
  f.replace(/\.mjs$/, '.cjs'),
  f.replace(/\.mjs$/, '.global.js'),
]);
const kb = (n) => `${(n / 1024).toFixed(2)} KB`;

const rows = [];
let failed = false;
for (const file of files) {
  if (!existsSync(file)) continue;
  const raw = readFileSync(file);
  const gz = gzipSync(raw, { level: 9 }).length;
  const br = brotliCompressSync(raw).length;
  const budget = BUDGETS[file];
  const over = budget && gz > budget;
  if (over) failed = true;
  rows.push({ file, raw: raw.length, gz, br, budget });
  console.log(
    `${file.padEnd(24)} raw ${kb(raw.length).padStart(9)}  gzip ${kb(gz).padStart(9)}  brotli ${kb(br).padStart(9)}` +
      (budget ? `  budget ${kb(budget)}${over ? '  EXCEEDED' : ''}` : ''),
  );
}

const missing = Object.keys(BUDGETS).filter((f) => !existsSync(f));
if (missing.length) {
  console.error(`size: ${missing.join(', ')} missing - run the build first`);
  process.exit(1);
}

// In GitHub Actions, publish the table on the job summary.
if (process.env.GITHUB_STEP_SUMMARY) {
  const table = [
    '### Bundle size',
    '',
    '| File | Raw | Gzip | Brotli | Budget |',
    '| ---- | --: | ---: | -----: | -----: |',
    ...rows.map(
      (r) =>
        `| \`${r.file}\` | ${kb(r.raw)} | ${kb(r.gz)} | ${kb(r.br)} | ${r.budget ? `${kb(r.budget)} ${r.gz > r.budget ? '❌' : '✅'}` : '-'} |`,
    ),
    '',
  ].join('\n');
  appendFileSync(process.env.GITHUB_STEP_SUMMARY, table);
}

if (failed) {
  console.error('size: budget exceeded');
  process.exit(1);
}
console.log('size: OK - every entry is within its budget');
