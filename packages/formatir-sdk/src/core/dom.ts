import type { FieldRef } from '../types';
import { cut } from './util';

/** Everything a user can reasonably expect to react to a click. */
const INTERACTIVE =
  'a,button,input,select,textarea,label,summary,details,option,video,audio,' +
  '[role=button],[role=link],[role=checkbox],[role=radio],[role=tab],[role=menuitem],' +
  '[role=switch],[role=option],[contenteditable],[tabindex],[onclick]';

const FIELDS = 'input,select,textarea,[contenteditable]';

export type FieldElement = HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement;

export const isElement = (t: EventTarget | null | undefined): t is Element =>
  !!t && (t as Node).nodeType === 1;

/**
 * The element that really received the event. Events leaving an open shadow
 * root are retargeted to its host; `composedPath()[0]` still is the inner node.
 */
export function targetOf(e: Event): Element | null {
  const t = e.composedPath ? e.composedPath()[0] : e.target;
  return isElement(t) ? t : null;
}

/** Parent across shadow boundaries (a shadow root's parent is its host). */
const up = (n: Node): Node | null => n.parentNode || (n as ShadowRoot).host || null;

/** `root.contains(el)`, but also true for nodes inside nested shadow roots. */
export function containsDeep(root: Node, el: Node | null): boolean {
  for (let n = el; n; n = up(n)) if (n === root) return true;
  return false;
}

/** `el.closest(selector)` that keeps searching past shadow hosts. */
export function closestDeep(el: Element | null, selector: string): Element | null {
  while (el) {
    const hit = el.closest(selector);
    if (hit) return hit;
    el = (el.getRootNode() as ShadowRoot).host || null;
  }
  return null;
}

/** True when the element itself or an ancestor is interactive. */
export function isInteractive(el: Element): boolean {
  return !!el.closest(INTERACTIVE) || (el as HTMLElement).isContentEditable === true;
}

export function isField(el: Element | null): el is FieldElement {
  return !!el && el.matches(FIELDS) && !(el as HTMLInputElement).disabled;
}

export const fieldsIn = (root: ParentNode): FieldElement[] =>
  Array.prototype.filter.call(root.querySelectorAll(FIELDS), (el: Element) =>
    isField(el),
  ) as FieldElement[];

/**
 * Stable key for a field. Prefers author-provided identifiers and falls back to
 * a structural path - never to a value, placeholder or label text.
 */
export function fieldKey(el: FieldElement): string {
  const attr =
    el.getAttribute('data-formatir-field') || el.getAttribute('name') || el.id;
  if (attr) return attr;
  const parent = el.parentElement;
  const idx = parent ? Array.prototype.indexOf.call(parent.children, el) : 0;
  return `${el.tagName.toLowerCase()}:${fieldType(el)}:${idx}`;
}

export const fieldType = (el: FieldElement): string =>
  (el as HTMLInputElement).type || el.tagName.toLowerCase();

/** Form identifier: `data-formatir-form`, `id` or `name`, else the fallback. */
export const formIdOf = (el: Element | null, fallback = 'form'): string =>
  (el &&
    (el.getAttribute('data-formatir-form') ||
      el.id ||
      el.getAttribute('name'))) ||
  fallback;

/** Id of the form a field belongs to (honours the `form` attribute), if any. */
export function formOf(el: FieldElement): string | undefined {
  const form = (el as HTMLInputElement).form || el.closest('form');
  return form ? formIdOf(form) : undefined;
}

export function fieldRef(el: FieldElement, step?: string): FieldRef {
  const ref: FieldRef = { key: fieldKey(el), type: fieldType(el) };
  const form = formOf(el);
  if (form) ref.form = form;
  if (step) ref.step = step;
  return ref;
}

/** Character count of the current value. The value itself never leaves the DOM. */
export function valueLength(el: FieldElement): number {
  const t = (el as HTMLInputElement).type;
  if (t === 'checkbox' || t === 'radio') return (el as HTMLInputElement).checked ? 1 : 0;
  const v = (el as HTMLInputElement).value;
  return typeof v === 'string' ? v.length : 0;
}

/** Structural selector (tag / id / first class / position). No text content. */
export function selectorOf(el: Element, depth = 3): string {
  const parts: string[] = [];
  let node: Element | null = el;
  while (node && parts.length < depth && node.nodeType === 1) {
    let part = node.tagName.toLowerCase();
    if (node.id) {
      parts.unshift(`${part}#${node.id}`);
      break;
    }
    const cls = node.getAttribute('class');
    if (cls) {
      const first = cls.trim().split(/\s+/)[0];
      if (first) part += `.${first}`;
    }
    const parent: Element | null = node.parentElement;
    if (parent) {
      const i = Array.prototype.indexOf.call(parent.children, node) + 1;
      part += `:nth-child(${i})`;
    }
    parts.unshift(part);
    node = parent;
  }
  return cut(parts.join('>'), 200);
}
