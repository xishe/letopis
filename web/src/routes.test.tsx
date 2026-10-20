import { describe, expect, it, beforeEach } from 'vitest';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderApp as renderAt } from './test/renderApp';
import { useDemo } from './store/demoStore';

beforeEach(() => {
  localStorage.clear();
  useDemo.getState().resetDemo();
});

describe('routes', () => {
  it('/app без построенной хроники → онбординг', async () => {
    renderAt('/app');
    expect(await screen.findByText(/Подключение источников/)).toBeInTheDocument();
  });

  it('/app после buildChronicle → хроника, счётчик входящих в сайдбаре', async () => {
    useDemo.getState().buildChronicle();
    renderAt('/app');
    expect(await screen.findByText(/Хроника — скоро/)).toBeInTheDocument();
    expect(screen.getByText('Входящие').parentElement).toHaveTextContent('3');
  });

  it('«Сбросить демо» очищает стор и ведёт на онбординг', async () => {
    useDemo.getState().buildChronicle();
    useDemo.getState().confirm('R-11');
    renderAt('/app/chronicle');
    await userEvent.click(await screen.findByText('Сбросить демо'));
    expect(await screen.findByText(/Подключение источников/)).toBeInTheDocument();
    expect(useDemo.getState().session.chronicleBuiltAt).toBeUndefined();
    expect(useDemo.getState().results.find((r) => r.id === 'R-11')!.status).toBe('suggested');
  });
});

