import { Navigate, createBrowserRouter, type RouteObject } from 'react-router-dom';
import AppShell from './app/AppShell';
import LandingPage from './features/landing';
import OnboardingPage from './features/onboarding';
import ChroniclePage from './features/chronicle';
import ReportsPage from './features/reports';
import TeamPage from './features/team';

function AppIndex() {
  return <Navigate to="/app/onboarding" replace />;
}

export const routes: RouteObject[] = [
  { path: '/', element: <LandingPage /> },
  {
    path: '/app',
    element: <AppShell />,
    children: [
      { index: true, element: <AppIndex /> },
      { path: 'onboarding', element: <OnboardingPage /> },
      { path: 'chronicle', element: <ChroniclePage /> },
      { path: 'reports/new', element: <ReportsPage /> },
      { path: 'reports/:id', element: <ReportsPage /> },
      { path: 'team', element: <TeamPage /> },
    ],
  },
  { path: '*', element: <Navigate to="/" replace /> },
];

export const router = createBrowserRouter(routes);
