/**
 * React bindings.
 *
 * ```tsx
 * import { FormatirProvider, useFormatirEvent } from 'formatir/react';
 *
 * <FormatirProvider endpoint="/api/formatir" root="#application-form">
 *   <ApplicationForm />
 * </FormatirProvider>
 * ```
 */
import {
  createContext,
  createElement,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
  type RefObject,
} from 'react';
import { create } from 'formatir';
import type {
  FormatirInstance,
  FormatirOptions,
  FormatirSnapshot,
  MetricListener,
  MetricName,
} from 'formatir';

export interface ReactFormatirOptions extends Omit<FormatirOptions, 'root'> {
  /** Selector, element or ref of the subtree to observe. */
  root?: FormatirOptions['root'] | RefObject<Element | null>;
}

const resolveRoot = (root: ReactFormatirOptions['root']): FormatirOptions['root'] =>
  root && typeof root === 'object' && 'current' in root ? root.current || undefined : root;

/** The instance provided by the nearest `<FormatirProvider>`. */
export const FormatirContext = createContext<FormatirInstance | null>(null);

/**
 * Create an instance after mount and destroy it on unmount (StrictMode-safe).
 * Options are read once; remount (e.g. via `key`) to change them. Returns
 * `null` during the first render and on the server.
 */
export function useFormatirInstance(options: ReactFormatirOptions = {}): FormatirInstance | null {
  const [instance, setInstance] = useState<FormatirInstance | null>(null);
  const initial = useRef(options);

  useEffect(() => {
    const opts = initial.current;
    const next = create({ ...opts, root: resolveRoot(opts.root) });
    setInstance(next);
    return () => next.destroy();
  }, []);

  return instance;
}

export interface FormatirProviderProps extends ReactFormatirOptions {
  children?: ReactNode;
}

/** Owns one Formatir instance and shares it with `useFormatir()`. */
export function FormatirProvider({ children, ...options }: FormatirProviderProps): ReactNode {
  const instance = useFormatirInstance(options);
  return createElement(FormatirContext.Provider, { value: instance }, children);
}

/** The instance from the nearest provider (`null` until it is mounted). */
export const useFormatir = (): FormatirInstance | null => useContext(FormatirContext);

/**
 * Subscribe to a metric (or `'*'`). The listener may change between renders
 * without resubscribing. Defaults to the provider's instance.
 */
export function useFormatirEvent<K extends MetricName>(
  metric: K | '*',
  listener: MetricListener<K>,
  instance?: FormatirInstance | null,
): void {
  const provided = useFormatir();
  const target = instance === undefined ? provided : instance;
  const latest = useRef(listener);
  latest.current = listener;

  useEffect(() => {
    if (!target) return;
    return target.on<K>(metric, (event) => latest.current(event));
  }, [target, metric]);
}

/**
 * Live `getSnapshot()` - refreshed on every event and, with `intervalMs`, on
 * a timer so durations keep ticking between events.
 */
export function useFormatirSnapshot(
  intervalMs = 0,
  instance?: FormatirInstance | null,
): FormatirSnapshot | null {
  const provided = useFormatir();
  const target = instance === undefined ? provided : instance;
  const [snapshot, setSnapshot] = useState<FormatirSnapshot | null>(null);

  useEffect(() => {
    if (!target) return setSnapshot(null);
    const refresh = () => setSnapshot(target.getSnapshot());
    refresh();
    const off = target.on('*', refresh);
    const timer = intervalMs > 0 ? setInterval(refresh, intervalMs) : undefined;
    return () => {
      off();
      if (timer) clearInterval(timer);
    };
  }, [target, intervalMs]);

  return snapshot;
}
