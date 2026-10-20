import { render } from '@testing-library/react';
import { MemoryRouter, useRoutes } from 'react-router-dom';
import { routes } from '../routes';

function AppRoutes() {
  return useRoutes(routes);
}

/**
 * Рендерит приложение (все маршруты) по пути `path`.
 * Не используйте createMemoryRouter/RouterProvider в тестах: в jsdom + Node 24 навигация data-router падает
 * на несовместимости AbortSignal. MemoryRouter + useRoutes работает.
 */
export function renderApp(path: string) {
  return render(
    <MemoryRouter initialEntries={[path]} future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <AppRoutes />
    </MemoryRouter>,
  );
}

