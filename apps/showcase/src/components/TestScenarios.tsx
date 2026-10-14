import { AGENT_API, HOOKS, SCENARIOS } from '../data/scenarios';
import { CodeBlock, SectionHeading } from './ui';

/** How to trigger and verify every metric - for people, test suites and agents. */
export function TestScenarios() {
  const base = import.meta.env.BASE_URL;

  return (
    <section id="test-scenarios" className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
      <SectionHeading
        title="How to trigger every metric"
        description="Each action below produces the listed event in the panel and in window.formatirEvents. Useful for manual testing, end-to-end suites and AI agents."
      />

      <div className="panel mt-10 overflow-x-auto">
        <table className="w-full min-w-[640px] text-left text-sm" data-testid="scenarios">
          <thead className="text-xs text-neutral-500">
            <tr>
              <th className="px-4 py-3 font-medium">Metric</th>
              <th className="px-4 py-3 font-medium">Action</th>
              <th className="px-4 py-3 font-medium">Appears</th>
            </tr>
          </thead>
          <tbody>
            {SCENARIOS.map((s) => (
              <tr key={s.metric} className="border-t border-neutral-200 align-top" data-metric={s.metric}>
                <td className="whitespace-nowrap px-4 py-2.5 font-mono text-xs text-blue-700">
                  {s.metric}
                </td>
                <td className="px-4 py-2.5 text-neutral-700">{s.action}</td>
                <td className="px-4 py-2.5 text-xs text-neutral-500">{s.wait}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="mt-5 grid gap-5 lg:grid-cols-2">
        <CodeBlock caption="Code access (browser console, Playwright, agents)" code={AGENT_API} />
        <div className="panel p-5">
          <h3 className="text-sm font-bold text-neutral-900">Data attributes</h3>
          <p className="mt-1 text-xs text-neutral-500">
            Read state without parsing text. Machine-readable summary:{' '}
            <a className="font-mono text-blue-700 underline" href={`${base}llms.txt`}>
              /llms.txt
            </a>
          </p>
          <dl className="mt-3 space-y-2 text-xs">
            {HOOKS.map(([selector, meaning]) => (
              <div key={selector}>
                <dt className="font-mono text-blue-700">{selector}</dt>
                <dd className="text-neutral-600">{meaning}</dd>
              </div>
            ))}
          </dl>
        </div>
      </div>
    </section>
  );
}
