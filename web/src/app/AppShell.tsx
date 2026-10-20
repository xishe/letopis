import { Outlet } from 'react-router-dom';
import { Toaster } from '../ui/Toast';
import Sidebar from './Sidebar';

export default function AppShell() {
  return (
    <div className="flex h-full bg-bg">
      <Sidebar />
      <main className="min-w-0 flex-1 overflow-y-auto">
        <Outlet />
      </main>
      <Toaster />
    </div>
  );
}
