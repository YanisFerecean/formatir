import { describe, expect, it } from 'vitest';
import { createApp, defineComponent, h, nextTick, ref } from 'vue';
import type { FormatirEvent, FormatirInstance } from '../src';
import { FormatirPlugin, useFormatir, useFormatirEvent, useFormatirInstance } from '../src/vue';

const mount = (component: ReturnType<typeof defineComponent>, plugin = false) => {
  const el = document.createElement('div');
  document.body.appendChild(el);
  const app = createApp(component);
  if (plugin) app.use(FormatirPlugin, { transport: 'none' });
  app.mount(el);
  return { app, el, unmount: () => (app.unmount(), el.remove()) };
};

describe('formatir/vue', () => {
  it('FormatirPlugin provides an app-wide instance', () => {
    let instance: FormatirInstance | null = null;
    const got: string[] = [];
    const { app, unmount } = mount(
      defineComponent({
        setup() {
          instance = useFormatir().value;
          useFormatirEvent('custom', (e: FormatirEvent<'custom'>) => void got.push(String(e.data.name)));
          return () => null;
        },
      }),
      true,
    );
    expect(app.config.globalProperties.$formatir).toBe(instance);
    instance!.track('hello');
    expect(got).toEqual(['hello']);
    unmount();
    expect(instance!.active).toBe(false);
  });

  it('useFormatirInstance scopes an instance to a component and its children', async () => {
    const got: string[] = [];
    let owner: ReturnType<typeof useFormatirInstance> | null = null;
    const Child = defineComponent({
      setup() {
        useFormatirEvent('field_focus', (e) => void got.push(e.field!.key));
        return () => null;
      },
    });
    const { el, unmount } = mount(
      defineComponent({
        setup() {
          const form = ref<HTMLFormElement | null>(null);
          owner = useFormatirInstance({ transport: 'none', root: form });
          return () => h('form', { ref: form }, [h('input', { name: 'city' }), h(Child)]);
        },
      }),
    );
    await nextTick();
    expect(owner!.value?.active).toBe(true);
    el.querySelector('input')!.dispatchEvent(new FocusEvent('focusin', { bubbles: true }));
    expect(got).toEqual(['city']);
    const instance = owner!.value!;
    unmount();
    expect(instance.active).toBe(false);
  });
});
