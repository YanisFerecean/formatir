#!/usr/bin/env node
/**
 * Tests the package the way users get it: `npm pack` the built SDK, install
 * the tarball into an empty project and exercise every published entry point.
 * Unit tests run against `src/` and cannot catch packaging mistakes (a missing
 * export, a wrong path, types that do not resolve); this does. Run it after
 * `pnpm build`.
 */
import { execFileSync } from 'node:child_process';
import { mkdtempSync, mkdirSync, readFileSync, realpathSync, rmSync, symlinkSync, writeFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const sdk = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const require = createRequire(join(sdk, 'package.json'));
const work = mkdtempSync(join(tmpdir(), 'formatir-package-'));
const app = join(work, 'app');
const keep = process.argv.includes('--keep');

const run = (cmd, args, cwd) =>
  execFileSync(cmd, args, { cwd, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] });

/** Link a dependency of the SDK workspace into the test project. */
function link(name) {
  const target = realpathSync(dirname(require.resolve(`${name}/package.json`)));
  const dest = join(app, 'node_modules', name);
  mkdirSync(dirname(dest), { recursive: true });
  symlinkSync(target, dest, 'dir');
}

function main() {
try {
  // 1. Pack exactly what `npm publish` would upload, and install it.
  // npm < 11 prints an array, newer versions an object keyed by package name.
  const packed = JSON.parse(run('npm', ['pack', '--json', '--pack-destination', work], sdk));
  const tarball = join(work, (Array.isArray(packed) ? packed[0] : Object.values(packed)[0]).filename);
  mkdirSync(app);
  writeFileSync(join(app, 'package.json'), JSON.stringify({ name: 'consumer', private: true, type: 'module' }));
  run('npm', ['install', tarball, '--offline', '--no-audit', '--no-fund', '--no-package-lock', '--ignore-scripts'], app);

  // 2. Optional peers and tooling come from the workspace, not the network.
  for (const name of ['react', 'vue', '@types/react', 'happy-dom']) link(name);

  // 3. Runtime checks, inside the consumer project.
  writeFileSync(join(app, 'check.mjs'), CHECKS);
  process.stdout.write(run('node', ['check.mjs'], app));

  // 4. Types: a TypeScript user with node16 resolution (which honours `exports`).
  writeFileSync(join(app, 'consumer.ts'), CONSUMER);
  writeFileSync(
    join(app, 'tsconfig.json'),
    JSON.stringify({
      compilerOptions: {
        module: 'node16',
        moduleResolution: 'node16',
        target: 'es2020',
        lib: ['es2020', 'dom'],
        strict: true,
        noEmit: true,
        skipLibCheck: false,
        types: [],
      },
      files: ['consumer.ts'],
    }),
  );
  run(process.execPath, [require.resolve('typescript/bin/tsc'), '-p', app], app);
  console.log('ok   types resolve and type-check for every entry (node16 resolution)');
  console.log('package test: OK');
} catch (error) {
  console.error(error.stdout || '');
  console.error(error.stderr || error.message);
  console.error('package test: FAILED');
  process.exitCode = 1;
} finally {
  if (keep) console.log(`kept ${work}`);
  else rmSync(work, { recursive: true, force: true });
}
}

/* ------------------------------------------------------------------------- */

const CHECKS = String.raw`
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { existsSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import vm from 'node:vm';

const require = createRequire(import.meta.url);
const root = dirname(require.resolve('formatir/package.json'));
const pkg = JSON.parse(readFileSync(join(root, 'package.json'), 'utf8'));
const ok = (msg) => console.log('ok   ' + msg);
const names = (mod) => Object.keys(mod).filter((k) => k !== 'default' && k !== '__esModule').sort();

// Every export path resolves in ESM and CJS, with the same named exports.
const entries = Object.keys(pkg.exports).filter((k) => !k.endsWith('.json')).map((k) => k.replace(/^\./, 'formatir'));
const loaded = {};
for (const entry of entries) {
  const esm = await import(entry);
  const cjs = require(entry);
  assert.deepEqual(names(esm), names(cjs), entry + ': ESM and CJS exports differ');
  assert.ok(names(esm).length > 0, entry + ': no exports');
  loaded[entry] = esm;
}
ok('import + require for ' + entries.join(', '));

// Declared type files exist.
for (const [key, conditions] of Object.entries(pkg.exports)) {
  if (typeof conditions === 'string') { assert.ok(existsSync(join(root, conditions)), key); continue; }
  for (const branch of Object.values(conditions)) assert.ok(existsSync(join(root, branch.types)), key + ' types ' + branch.types);
}
ok('every exports entry points at existing type declarations');

// Expected public API.
const expected = {
  formatir: ['Formatir', 'OPT_OUT_KEY', 'OUTBOX_KEY', 'VERSION', 'create', 'getInstance', 'init', 'version'],
  'formatir/extras': ['autofill', 'funnel', 'paste', 'revisits', 'thrash'],
  'formatir/react': ['FormatirContext', 'FormatirProvider', 'useFormatir', 'useFormatirEvent', 'useFormatirInstance', 'useFormatirSnapshot'],
  'formatir/vue': ['FORMATIR_KEY', 'FormatirPlugin', 'useFormatir', 'useFormatirEvent', 'useFormatirInstance'],
  'formatir/svelte': ['formatir'],
  'formatir/react-hook-form': ['createErrorReporter', 'flattenErrors', 'formatirOnInvalid', 'reportErrors'],
  'formatir/zod': ['issuePath', 'reportZodError', 'withFormatir'],
  'formatir/server': ['METRICS', 'createHandler', 'parseBatch', 'toNodeListener'],
};
for (const [entry, list] of Object.entries(expected)) {
  assert.ok(loaded[entry], entry + ' is not in package.json "exports"');
  for (const name of list) assert.ok(name in loaded[entry], entry + ' is missing ' + name);
}
ok('public API of all ' + Object.keys(expected).length + ' entries');

// Version and schema.
assert.equal(loaded.formatir.VERSION, pkg.version, 'VERSION does not match package.json');
const schema = require('formatir/schema.json');
assert.deepEqual(schema.$defs.event.properties.type.enum, [...loaded['formatir/server'].METRICS]);
ok('VERSION ' + pkg.version + ', schema.json ships and matches METRICS');

// Bindings share the core's module instance instead of bundling a copy.
for (const file of ['react', 'vue', 'svelte', 'react-hook-form', 'zod', 'server']) {
  const code = readFileSync(join(root, 'dist', file + '.mjs'), 'utf8');
  // Minified, so look for a string constant of the core and for the import.
  assert.ok(!code.includes('formatir:outbox'), file + ' bundles a copy of the core');
  // The framework bindings create instances, so they must import the core;
  // the adapters and the server only use its types.
  if (['react', 'vue', 'svelte'].includes(file)) {
    assert.match(code, /from\s*['"]formatir['"]/, file + ' does not import the core');
  }
}
ok('bindings import the core instead of bundling it');

// <script> builds define their globals.
for (const [file, global, member] of [['index.global.js', 'Formatir', 'init'], ['extras.global.js', 'FormatirExtras', 'paste']]) {
  const sandbox = {};
  vm.runInNewContext(readFileSync(join(root, 'dist', file), 'utf8'), sandbox);
  assert.equal(typeof sandbox[global]?.[member], 'function', file + ' does not define ' + global + '.' + member);
}
ok('IIFE builds define window.Formatir and window.FormatirExtras');

// Runtime: core + every extra in a DOM.
const { Window } = await import('happy-dom');
const win = new Window({ url: 'https://consumer.test/' });
for (const k of ['document', 'navigator', 'location', 'MutationObserver', 'Event', 'InputEvent', 'MouseEvent', 'FocusEvent', 'KeyboardEvent', 'getSelection', 'innerWidth', 'innerHeight', 'localStorage']) {
  Object.defineProperty(globalThis, k, { value: win[k], configurable: true, writable: true });
}
globalThis.window = win;
win.document.body.innerHTML = '<form id="f"><input name="a"/><input name="b"/></form>';
const { init } = loaded.formatir;
const { autofill, funnel, paste, revisits, thrash } = loaded['formatir/extras'];
const seen = [];
const f = init({ root: '#f', transport: 'none', plugins: [paste(), autofill(), revisits(), funnel(), thrash()], onEvent: (e) => seen.push(e.type) });
const [a, b] = win.document.querySelectorAll('input');
const click = () => a.dispatchEvent(new win.MouseEvent('click', { bubbles: true, clientX: 5, clientY: 5, detail: 1 }));
click(); click(); click();
a.dispatchEvent(new win.FocusEvent('focusin', { bubbles: true }));
a.dispatchEvent(new win.FocusEvent('focusout', { bubbles: true }));
b.dispatchEvent(new win.FocusEvent('focusin', { bubbles: true }));
a.dispatchEvent(new win.FocusEvent('focusin', { bubbles: true }));
a.dispatchEvent(new win.Event('paste', { bubbles: true, cancelable: true }));
b.value = 'x';
b.dispatchEvent(new win.InputEvent('input', { bubbles: true, inputType: 'insertReplacementText' }));
f.setStep('one');
f.setStep('two');
for (let i = 0; i < 12; i++) a.dispatchEvent(new win.MouseEvent('mousemove', { bubbles: true, clientX: i % 2 ? 300 : 100, clientY: 50 }));
await new Promise((r) => setTimeout(r, 200));
for (const type of ['session_start', 'rage_click', 'field_focus', 'score', 'paste', 'autofill', 'field_revisit', 'step_change', 'thrash']) {
  assert.ok(seen.includes(type), 'runtime: no ' + type + ' event');
}
f.destroy();
await win.happyDOM.close();
ok('runtime: core detectors and all five extras emit events');

// Server: a batch round-trip through the Fetch handler.
const { createHandler } = loaded['formatir/server'];
const stored = [];
const handler = createHandler({ onBatch: (batch) => void stored.push(batch) });
const body = { sdk: 'formatir', v: pkg.version, sessionId: 's', sentAt: 1, reason: 'batch', events: [{ id: 'e', type: 'rage_click', ts: 1, t: 0, sessionId: 's', data: { count: 3 } }] };
const res = await handler(new Request('https://c.test/', { method: 'POST', body: JSON.stringify(body), headers: { 'content-type': 'application/json' } }));
assert.equal(res.status, 204);
assert.equal(stored.length, 1);
ok('server: createHandler accepts a batch');
`;

const CONSUMER = String.raw`
import { Formatir, create, init, type FormatirEvent, type FormatirOptions, type Plugin } from 'formatir';
import { autofill, funnel, paste, revisits, thrash } from 'formatir/extras';
import { FormatirProvider, useFormatirEvent } from 'formatir/react';
import { FormatirPlugin, useFormatir } from 'formatir/vue';
import { formatir as action } from 'formatir/svelte';
import { formatirOnInvalid } from 'formatir/react-hook-form';
import { withFormatir } from 'formatir/zod';
import { createHandler, parseBatch, type FormatirBatch } from 'formatir/server';

const plugins: Plugin[] = [paste(), autofill(), revisits(), funnel(), thrash({ reversals: 8 })];
const options: FormatirOptions = { endpoint: '/api', errorScope: 'root', plugins };
const instance = init(options);
const other = create({ root: '#newsletter' });
instance.on('paste', (e: FormatirEvent<'paste'>) => e.data.blocked satisfies boolean);
instance.on('thrash', (e) => e.data.reversals satisfies number);
const version: string = Formatir.version;

void FormatirProvider;
void useFormatirEvent;
void FormatirPlugin;
void useFormatir;
void action;
void formatirOnInvalid(instance);
void withFormatir(instance, { safeParse: () => ({ success: true as const }) });
const handler: (r: Request) => Promise<Response> = createHandler({ onBatch: (b: FormatirBatch) => void b.events });
const parsed = parseBatch('{}');
if (!parsed.ok) parsed.error satisfies string;
void [other, version, handler];
`;

main();
