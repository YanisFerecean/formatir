import type { FieldRef } from '../types';
import { cut } from './util';

/** Everything a user can reasonably expect to react to a click. */
const INTERACTIVE =
  'a,button,input,select,textarea,label,summary,details,option,video,audio,' +
  '[role=button],[role=link],[role=checkbox],[role=radio],[role=tab],[role=menuitem],' +
  '[role=switch],[role=option],[contenteditable],[tabindex],[onclick]';

const FIELDS = 'input,select,textarea,[contenteditable]';

export type FieldElement = HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement;

export const isElement = (t: EventTarget | null): t is Element =>
  !!t && (t as Node).nodeType === 1;

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

export const fieldRef = (el: FieldElement, step?: string): FieldRef => ({
  key: fieldKey(el),
  type: fieldType(el),
  ...(step ? { step } : null),
});

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
