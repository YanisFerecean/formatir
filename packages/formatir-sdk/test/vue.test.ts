import { describe, expect, it } from 'vitest';
import { createApp, defineComponent, h, nextTick, ref, shallowRef } from 'vue';
import { create, type FormatirEvent, type FormatirInstance } from '../src';
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

  it('useFormatirEvent unsubscribes when its component unmounts', async () => {
    const got: string[] = [];
    const show = ref(true);
    let instance: FormatirInstance | null = null;
    const Listener = defineComponent({
      setup() {
        useFormatirEvent('custom', (e: FormatirEvent<'custom'>) => void got.push(String(e.data.name)));
        return () => null;
      },
    });
    const { unmount } = mount(
      defineComponent({
        setup() {
          instance = useFormatir().value;
          return () => (show.value ? h(Listener) : null);
        },
      }),
      true,
    );
    instance!.track('before');
    show.value = false;
    await nextTick();
    instance!.track('after');
    expect(got).toEqual(['before']);
    unmount();
  });

  it('useFormatirEvent follows an explicit instance ref when it changes', async () => {
    const got: string[] = [];
    const a = create({ transport: 'none' });
    const b = create({ transport: 'none' });
    const target = shallowRef<FormatirInstance | null>(a);
    const { unmount } = mount(
      defineComponent({
        setup() {
          useFormatirEvent('custom', (e: FormatirEvent<'custom'>) => void got.push(String(e.data.name)), target);
          return () => null;
        },
      }),
    );
    a.track('a1');
    target.value = b;
    await nextTick();
    a.track('a2');
    b.track('b1');
    expect(got).toEqual(['a1', 'b1']);
    unmount();
    a.destroy();
    b.destroy();
  });

  it('works without a provider', () => {
    let provided: unknown = 'unset';
    const { unmount } = mount(
      defineComponent({
        setup() {
          provided = useFormatir().value;
          useFormatirEvent('custom', () => {});
          return () => null;
        },
      }),
    );
    expect(provided).toBeNull();
    unmount();
  });
});
