import type { Plugin } from 'vite';
import { AGENT_API, HOOKS, SCENARIOS } from './src/data/scenarios.ts';

/** `/llms.txt`: what the demo is and how an agent can drive and verify it. */
export function llmsTxt(): string {
  return [
    '# Formatir demo',
    '',
    '> Live demo of Formatir, a privacy-first behaviour analytics SDK for web forms (npm: formatir).',
    '> A multi-step job application form is observed by the SDK; a telemetry panel shows every detected event.',
    '> Nothing is sent anywhere (transport: "none"), and only the form (#application) is tracked.',
    '',
    '## How to verify',
    '',
    '- `window.formatirEvents`: every event of the session, oldest first. Each has `type`, `data`, `field?.key`, `step`, `t` (ms since start).',
    '- `window.formatir.getSnapshot()`: score, level, signals and per-field stats.',
    '- `formatir:event` is dispatched on `window` for every event (`event.detail`) - wait for it instead of sleeping.',
    '- The telemetry panel is excluded from tracking, so clicking its buttons never creates behavioural events.',
    '',
    '```js',
    AGENT_API,
    '```',
    '',
    '## Test scenarios',
    '',
    ...SCENARIOS.map((s) => `- **${s.metric}** - ${s.action} Appears: ${s.wait}.`),
    '',
    '## Data attributes',
    '',
    ...HOOKS.map(([selector, meaning]) => `- \`${selector}\`: ${meaning}`),
    '',
    '## Docs',
    '',
    '- [SDK README](https://github.com/YanisFerecean/formatir/tree/main/packages/formatir-sdk#readme): API, options, extras, bindings, collector',
    '- [Batch JSON schema](https://unpkg.com/formatir/schema/batch.schema.json)',
    '- [Source](https://github.com/YanisFerecean/formatir)',
    '',
  ].join('\n');
}

/** Serves `/llms.txt` in dev and emits it into the build. */
export function llmsTxtPlugin(): Plugin {
  return {
    name: 'formatir-llms-txt',
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        if (!req.url?.endsWith('/llms.txt')) return next();
        res.setHeader('content-type', 'text/plain; charset=utf-8');
        res.end(llmsTxt());
      });
    },
    generateBundle() {
      this.emitFile({ type: 'asset', fileName: 'llms.txt', source: llmsTxt() });
    },
  };
}
