import { beforeEach, describe, expect, it } from 'vitest';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderApp } from '../../test/renderApp';
import { useDemo } from '../../store/demoStore';

beforeEach(() => {
  localStorage.clear();
  useDemo.getState().resetDemo();
});

describe('отчёты', () => {
  it('неизвестный id → страница сборки', async () => {
    renderApp('/app/reports/rep-999');
    expect(await screen.findByRole('heading', { name: 'Сборка self-review' })).toBeInTheDocument();
    expect(screen.getByText(/Выбрано 8/)).toBeInTheDocument();
  });

  it('«Собрать черновик» disabled при пустом выборе', async () => {
    renderApp('/app/reports/new');
    await userEvent.click(await screen.findByRole('button', { name: 'Снять выбор' }));
    expect(screen.getByRole('button', { name: 'Собрать черновик' })).toBeDisabled();
    expect(screen.getByText('Выбрано 0')).toBeInTheDocument();
  });

  it('сборка → черновик, «Показать сразу» открывает текст со сносками', async () => {
    renderApp('/app/reports/new');
    await userEvent.click(await screen.findByRole('button', { name: 'Собрать черновик' }));
    await userEvent.click(await screen.findByRole('button', { name: 'Показать сразу' }));
    expect(await screen.findByText('Ключевые результаты')).toBeInTheDocument();
    expect(screen.getAllByRole('button', { name: /^R-\d+$/ }).length).toBeGreaterThan(0);
    expect(screen.getByText('Получена обратная связь руководителя')).toBeInTheDocument();
    expect(useDemo.getState().reports).toHaveLength(1);
  });
});
