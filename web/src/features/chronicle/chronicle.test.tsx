import { beforeEach, describe, expect, it } from 'vitest';
import { act, fireEvent, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderApp } from '../../test/renderApp';
import { useDemo } from '../../store/demoStore';
import type { Result } from '../../types';
import ResultRow from './ResultRow';
import { render } from '@testing-library/react';

beforeEach(() => {
  localStorage.clear();
  useDemo.getState().resetDemo();
});

const suggestedCount = () => document.querySelectorAll('[data-suggestion-card]').length;

describe('Хроника', () => {
  it('c внутри input не открывает палитру, вне input открывает', async () => {
    const user = userEvent.setup();
    renderApp('/app/chronicle');
    const input = document.createElement('input');
    document.body.appendChild(input);
    input.focus();
    await user.keyboard('c');
    expect(screen.queryByRole('dialog', { name: 'Палитра команд' })).toBeNull();
    input.remove();
    (document.activeElement as HTMLElement | null)?.blur();
    await user.keyboard('c');
    expect(await screen.findByRole('dialog', { name: 'Палитра команд' })).toBeTruthy();
  });

  it('Ctrl+K открывает палитру, Esc закрывает', async () => {
    const user = userEvent.setup();
    renderApp('/app/chronicle');
    await user.keyboard('{Control>}k{/Control}');
    expect(await screen.findByRole('dialog', { name: 'Палитра команд' })).toBeTruthy();
    await user.keyboard('{Escape}');
    await act(async () => {
      await new Promise((r) => setTimeout(r, 300));
    });
    expect(screen.queryByRole('dialog', { name: 'Палитра команд' })).toBeNull();
  });

  it('«Подтвердить» уменьшает число карточек «Новое от автосбора»', async () => {
    const user = userEvent.setup();
    renderApp('/app/chronicle');
    const before = suggestedCount();
    expect(before).toBe(3);
    const card = document.querySelector('[data-suggestion-card]') as HTMLElement;
    await user.click(within(card).getByRole('button', { name: 'Подтвердить' }));
    await act(async () => {
      await new Promise((r) => setTimeout(r, 400));
    });
    expect(suggestedCount()).toBe(before - 1);
  });

  it('J фокусирует первую карточку ленты, Enter открывает панель', async () => {
    const user = userEvent.setup();
    renderApp('/app/chronicle');
    await user.keyboard('j');
    const focused = document.activeElement as HTMLElement;
    expect(focused.hasAttribute('data-feed-card')).toBe(true);
    await user.keyboard('{Enter}');
    expect(await screen.findByRole('dialog')).toBeTruthy();
    expect(screen.getByLabelText('Эффект')).toBeTruthy();
  });

  it('длинный title не ломает строку: truncate', () => {
    const long: Result = {
      id: 'R-99',
      title: 'Очень длинное название результата '.repeat(5).slice(0, 150),
      summary: 'Краткое описание '.repeat(30),
      status: 'confirmed',
      effect: 'x'.repeat(150),
      items: [],
      evidence: [],
      visibleToManager: false,
      date: '2026-09-10',
    };
    expect(long.title).toHaveLength(150);
    render(<ResultRow result={long} onOpen={() => {}} />);
    const h = screen.getByRole('heading', { level: 3 });
    expect(h.className).toMatch(/truncate|line-clamp/);
    fireEvent.click(h);
  });
});
