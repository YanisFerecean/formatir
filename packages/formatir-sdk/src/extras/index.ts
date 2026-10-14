/**
 * Opt-in detectors. They live outside the core bundle so the default build
 * stays small - import only what you need:
 *
 * ```ts
 * import { Formatir } from 'formatir';
 * import { paste, thrash } from 'formatir/extras';
 *
 * Formatir.init({ plugins: [paste(), thrash()] });
 * ```
 */
export { paste } from './paste';
export { autofill } from './autofill';
export { revisits } from './revisits';
export { funnel } from './funnel';
export { thrash, type ThrashOptions } from './thrash';
