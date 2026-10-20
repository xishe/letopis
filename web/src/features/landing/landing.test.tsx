import { describe, it, expect, beforeEach, vi } from 'vitest';
import { screen } from '@testing-library/react';
import { renderApp } from '../../test/renderApp';
import { useDemo } from '../../store/demoStore';

describe('лендинг и команда', () => {
  beforeEach(() => {
    // jsdom не реализует IntersectionObserver, нужный framer-motion (whileInView)
    vi.stubGlobal(
      'IntersectionObserver',
      class {
        observe() {}
        unobserve() {}
        disconnect() {}
        takeRecords() {
          return [];
        }
      },
    );
    localStorage.clear();
    useDemo.getState().resetDemo();
  });

  it('лендинг содержит три тезиса и ссылку на /app', () => {
    renderApp('/');
    expect(screen.getByText('4 из 5')).toBeInTheDocument();
    expect(screen.getByText('3 из 5')).toBeInTheDocument();
    expect(screen.getByText('5 из 5')).toBeInTheDocument();
    const links = screen.getAllByRole('link').filter((a) => a.getAttribute('href') === '/app');
    expect(links.length).toBeGreaterThan(0);
  });

  it('команда: пустое состояние', () => {
    renderApp('/app/team');
    expect(screen.getByText('Сотрудники ещё не поделились результатами')).toBeInTheDocument();
    expect(screen.queryByText('R-1')).not.toBeInTheDocument();
  });

  it('команда: после setVisibility отображается R-1', () => {
    useDemo.getState().setVisibility('R-1', true);
    renderApp('/app/team');
    expect(screen.getByText('R-1')).toBeInTheDocument();
    expect(screen.queryByText('Сотрудники ещё не поделились результатами')).not.toBeInTheDocument();
  });
});
