/**
 * Vue 3 bindings.
 *
 * ```ts
 * import { FormatirPlugin } from 'formatir/vue';
 *
 * createApp(App).use(FormatirPlugin, { endpoint: '/api/formatir' }).mount('#app');
 * ```
 */
import {
  inject,
  onBeforeUnmount,
  onMounted,
  provide,
  shallowRef,
  unref,
  watch,
  type App,
  type InjectionKey,
  type Ref,
  type ShallowRef,
} from 'vue';
import { create } from 'formatir';
import type { FormatirInstance, FormatirOptions, MetricListener, MetricName } from 'formatir';

export type FormatirRef = ShallowRef<FormatirInstance | null>;

/** Injection key of the instance shared by the plugin or `useFormatirInstance()`. */
export const FORMATIR_KEY: InjectionKey<FormatirRef> = Symbol('formatir');

/**
 * App-wide instance: `app.use(FormatirPlugin, options)`. Destroyed with the
 * app (Vue >= 3.5); also exposed as `this.$formatir` in templates.
 */
export const FormatirPlugin = {
  install(app: App, options: FormatirOptions = {}): void {
    const instance = shallowRef(typeof document === 'undefined' ? null : create(options));
    app.provide(FORMATIR_KEY, instance);
    app.config.globalProperties.$formatir = instance.value;
    app.onUnmount?.(() => instance.value?.destroy());
  },
};

export interface VueFormatirOptions extends Omit<FormatirOptions, 'root'> {
  /** Selector, element or template ref of the subtree to observe. */
  root?: FormatirOptions['root'] | Ref<Element | null | undefined>;
}

/**
 * Component-scoped instance: created on mount, destroyed before unmount and
 * provided to descendants (`useFormatir()`, `useFormatirEvent()`).
 */
export function useFormatirInstance(options: VueFormatirOptions = {}): FormatirRef {
  const instance: FormatirRef = shallowRef(null);
  provide(FORMATIR_KEY, instance);
  onMounted(() => {
    instance.value = create({ ...options, root: unref(options.root) || undefined });
  });
  onBeforeUnmount(() => {
    instance.value?.destroy();
    instance.value = null;
  });
  return instance;
}

/** The nearest provided instance (from the plugin or an ancestor). */
export const useFormatir = (): FormatirRef => inject(FORMATIR_KEY, shallowRef(null), false);

/** Subscribe to a metric (or `'*'`) for the lifetime of the component. */
export function useFormatirEvent<K extends MetricName>(
  metric: K | '*',
  listener: MetricListener<K>,
  instance: FormatirRef = useFormatir(),
): void {
  watch(
    instance,
    (target, _, onCleanup) => {
      if (target) onCleanup(target.on<K>(metric, listener));
    },
    { immediate: true },
  );
}

declare module 'vue' {
  interface ComponentCustomProperties {
    $formatir: FormatirInstance | null;
  }
}
