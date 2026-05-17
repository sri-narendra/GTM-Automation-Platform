import { useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Menu, Moon, Sun, Bell } from 'lucide-react';
import Sidebar from './Sidebar';
import { useThemeStore } from '../../store/themeStore';
import { cn } from '../../lib/utils';

const pageTitles: Record<string, string> = {
  '/': 'Dashboard',
  '/leads': 'Leads',
  '/workflows': 'Workflows',
  '/jobs': 'Jobs',
  '/outreach': 'Outreach',
  '/resume': 'Resume Optimizer',
  '/settings': 'Settings',
};

export default function AppLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { isDark, toggle } = useThemeStore();
  const location = useLocation();

  const pageTitle = Object.entries(pageTitles).find(([path]) =>
    location.pathname.startsWith(path)
  )?.[1] || 'Dashboard';

  return (
    <div className="flex h-screen bg-surface-900">
      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <div className="flex-1 flex flex-col min-w-0">
        <header className="h-16 border-b border-surface-700/30 bg-surface-900/80 backdrop-blur-xl flex items-center justify-between px-4 lg:px-6 sticky top-0 z-10">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden p-2 rounded-lg text-surface-400 hover:text-white hover:bg-surface-700 transition-colors"
            >
              <Menu className="w-5 h-5" />
            </button>
            <h1 className="text-lg font-semibold text-white">{pageTitle}</h1>
          </div>

          <div className="flex items-center gap-2">
            <button className="relative p-2 rounded-lg text-surface-400 hover:text-white hover:bg-surface-700 transition-colors">
              <Bell className="w-5 h-5" />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-primary-500" />
            </button>
            <button
              onClick={toggle}
              className="p-2 rounded-lg text-surface-400 hover:text-white hover:bg-surface-700 transition-colors"
            >
              {isDark ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
            </button>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-4 lg:p-6">
          <motion.div
            key={location.pathname}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, ease: 'easeOut' }}
          >
            <Outlet />
          </motion.div>
        </main>
      </div>
    </div>
  );
}
