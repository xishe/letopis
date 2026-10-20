import { beforeEach, describe, expect, it } from 'vitest';
import { act, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderApp } from '../../test/renderApp';
import { useDemo } from '../../store/demoStore';

beforeEach(() => {
  localStorage.clear();
  useDemo.getState().resetDemo();
});

describe('онбординг', () => {
  it('«Собрать хронику» disabled, пока подключено меньше двух источников', async () => {
    renderApp('/app/onboarding');
    const build = await screen.findByRole('button', { name: 'Собрать хронику' });
    expect(build).toBeDisabled();

    act(() => useDemo.getState().connectSource('Jira'));
    expect(screen.getByRole('button', { name: 'Собрать хронику' })).toBeDisabled();

    act(() => useDemo.getState().connectSource('GitLab'));
    expect(screen.getByRole('button', { name: 'Собрать хронику' })).toBeEnabled();
  });

  it('«Подключить» показывает спиннер, затем «Подключено»', async () => {
    renderApp('/app/onboarding');
    await userEvent.click(await screen.findByRole('button', { name: 'Подключить Jira' }));
    expect(screen.getByText('Подключаем')).toBeInTheDocument();
    expect(await screen.findByText('Подключено', undefined, { timeout: 2000 })).toBeInTheDocument();
    expect(useDemo.getState().session.connected).toContain('Jira');
  });
});
