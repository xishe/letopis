import { useEffect, useRef } from 'react';

/** Фокус в поле ввода — хоткеи без модификаторов не срабатывают. */
export function isTypingTarget(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false;
  const tag = target.tagName;
  return tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT' || target.isContentEditable;
}

export interface HotkeyHandlers {
  palette(): void; // Ctrl/⌘+K (работает всегда) и C (только вне полей)
  next(): void; // J
  prev(): void; // K
}

/** Глобальные хоткеи страницы. `enabled=false` отключает J/K/C (например, при открытой панели). */
export function useHotkeys(handlers: HotkeyHandlers, enabled: boolean): void {
  const ref = useRef(handlers);
  ref.current = handlers;
  const on = useRef(enabled);
  on.current = enabled;

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      const key = e.key.toLowerCase();
      if ((e.ctrlKey || e.metaKey) && key === 'k') {
        e.preventDefault();
        ref.current.palette();
        return;
      }
      if (e.ctrlKey || e.metaKey || e.altKey || e.defaultPrevented) return;
      if (isTypingTarget(e.target) || !on.current) return;
      if (key === 'c') {
        e.preventDefault();
        ref.current.palette();
      } else if (key === 'j') ref.current.next();
      else if (key === 'k') ref.current.prev();
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);
}
