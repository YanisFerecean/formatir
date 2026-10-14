/**
 * How to trigger every metric in the demo. Single source for the "Test
 * scenarios" section on the page and for the generated `/llms.txt`, so the
 * two never drift apart. Plain data - no JSX - because vite.config.ts imports it.
 */
export interface Scenario {
  /** Metric the scenario produces (`event.type`). */
  metric: string;
  /** What to do, in plain words. Selectors refer to `data-testid` / `name`. */
  action: string;
  /** When the event appears. */
  wait: string;
}

export const SCENARIOS: Scenario[] = [
  {
    metric: 'session_start',
    action: 'Load the page. Emitted once per session.',
    wait: 'immediately',
  },
  {
    metric: 'rage_click',
    action: 'Click the step indicator ([data-testid="step-indicator"]) 3 times within 500 ms.',
    wait: 'on the 3rd click',
  },
  {
    metric: 'dead_click',
    action:
      'Click a static element once: the step indicator, or the CV drop zone ([data-testid="cv-dropzone"]) in step 2 - not its button.',
    wait: '1000 ms after the click',
  },
  {
    metric: 'hesitation',
    action:
      'Focus a field (e.g. [name="firstName"]), wait more than 3 s, then type. Leaving it without typing reports abandoned: true.',
    wait: 'on the first keystroke or on blur',
  },
  {
    metric: 'field_effort',
    action: 'Type into a field, press Backspace a few times, then leave it.',
    wait: 'on blur',
  },
  {
    metric: 'field_effort (refills)',
    action: 'Type into a field, clear it completely, type again, then leave it. data.refills becomes 1.',
    wait: 'on blur',
  },
  {
    metric: 'validation_error',
    action: 'Click Next ([data-testid="next"]) with required fields empty. One event per invalid field.',
    wait: 'immediately',
  },
  {
    metric: 'validation_error (custom)',
    action:
      'In step 2, enter a salary ([name="salary"]) between 1 and 19999 and click Next. Reason: belowMarketRate.',
    wait: 'immediately',
  },
  {
    metric: 'js_error',
    action:
      'In step 2, click "Simulate failed upload" ([data-testid="simulate-upload"]). The panel button [data-testid="outside-error"] throws outside the form and is ignored on purpose (errorScope: "root").',
    wait: 'immediately',
  },
  {
    metric: 'step_change',
    action:
      'Complete a step and click Next, or click Back ([data-testid="back"]). Going back sets back: true. Also fires once on load (to: "personal").',
    wait: 'immediately',
  },
  {
    metric: 'field_revisit',
    action: 'Focus field A, move to field B, then focus field A again.',
    wait: 'on the focus of A',
  },
  {
    metric: 'paste',
    action: 'Paste text into any field (Ctrl/Cmd+V). Only the length change is reported.',
    wait: 'right after the paste',
  },
  {
    metric: 'autofill',
    action:
      'Let the browser autofill the personal details, or dispatch new InputEvent("input", { bubbles: true, inputType: "insertReplacementText" }) on a field without a preceding keydown.',
    wait: '100 ms (fields filled together form one event)',
  },
  {
    metric: 'thrash',
    action:
      'Move the pointer quickly left and right over the form: at least 6 direction changes of 4 px or more within 1 s.',
    wait: 'on the 6th direction change',
  },
  {
    metric: 'form_submit',
    action: 'Fill in all four steps, tick the consent box and click Submit ([data-testid="submit"]).',
    wait: 'immediately',
  },
  {
    metric: 'form_dropoff',
    action:
      'Touch at least one field, then click "Report drop-off" ([data-testid="report-dropoff"]) or switch to another tab. Not reported after a successful submit.',
    wait: 'immediately',
  },
  {
    metric: 'custom',
    action: 'Click "Custom event" ([data-testid="custom-event"]).',
    wait: 'immediately',
  },
  {
    metric: 'score',
    action: 'Any weighted signal above (rage click, dead click, hesitation, errors, ...) changes the score.',
    wait: 'together with the signal',
  },
];

/** Code access on the page, shown in the section and in llms.txt. */
export const AGENT_API = `// The demo's instance and the full event log of this session
window.formatir.getSnapshot();      // score, level, signals, per-field stats
window.formatirEvents;              // every event, oldest first

// Wait for an event instead of sleeping
await new Promise((resolve) =>
  window.addEventListener('formatir:event', function on(e) {
    if (e.detail.type === 'rage_click') {
      window.removeEventListener('formatir:event', on);
      resolve(e.detail);
    }
  }),
);`;

/** Data attributes an agent can read without parsing text. */
export const HOOKS: [string, string][] = [
  ['[data-testid="score"]', 'data-score (0-100), data-level (calm | mild | elevated | severe)'],
  ['[data-testid="signal-<name>"]', 'data-value - weighted signal counts, e.g. signal-rage_click'],
  ['[data-testid="event-stream"] li', 'role="log", newest first; data-event-type, data-field'],
  ['[data-testid="field-effort"] tr', 'data-field, data-keystrokes, data-corrections, data-refills, data-hesitation-ms'],
  ['[data-testid="insights"] li', 'data-insight - derived warnings (score, rage, dead, err, refill-*, ...)'],
  ['#application', 'the observed root; data-step is the current step id'],
];
