'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { AnimatePresence, motion } from 'framer-motion';
import { useAuthStore } from '@/lib/store/auth.store';
import { Avatar, useToast } from '@/components/ui';
import { AttendifyMark } from '@/components/ui/icons';
import * as Icon from '@/components/ui/icons';
import { cn } from '@/lib/utils';

// ─── Nav items ────────────────────────────────────────────────
const navItems = [
  { href: '/dashboard',  label: 'Dashboard',  NavIcon: Icon.Home,          MobileIcon: Icon.Home },
  { href: '/classes',    label: 'Classes',    NavIcon: Icon.BookOpen,       MobileIcon: Icon.BookOpen },
  { href: '/students',   label: 'Students',   NavIcon: Icon.Users,          MobileIcon: Icon.Users },
  { href: '/attendance', label: 'Attendance', NavIcon: Icon.ClipboardCheck, MobileIcon: Icon.ClipboardCheck },
  { href: '/analytics',  label: 'Analytics',  NavIcon: Icon.BarChart2,      MobileIcon: Icon.BarChart2 },
  { href: '/reports',    label: 'Reports',    NavIcon: Icon.FileText,       MobileIcon: Icon.FileText },
];

// ─── Desktop Sidebar ──────────────────────────────────────────
interface SidebarProps {
  mobileOpen: boolean;
  onMobileClose: () => void;
}

function SidebarContent({ onClose }: { onClose?: () => void }) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout } = useAuthStore();
  const { toast } = useToast();

  const handleLogout = async () => {
    await logout();
    toast('success', 'Signed out');
    router.push('/auth/login');
  };

  return (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className="h-14 px-4 flex items-center border-b border-slate-100 dark:border-slate-800">
        <Link href="/dashboard" onClick={onClose} className="flex items-center gap-2.5">
          <AttendifyMark size={28} />
          <span className="text-sm font-semibold text-slate-900 dark:text-white tracking-tight">Attendify</span>
        </Link>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-2 py-3 overflow-y-auto scrollbar-hide space-y-0.5">
        {navItems.map(({ href, label, NavIcon }) => {
          const isActive = pathname === href || pathname.startsWith(`${href}/`);
          return (
            <Link
              key={href}
              href={href}
              onClick={onClose}
              className={cn(
                'flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors duration-100',
                isActive
                  ? 'bg-indigo-50 dark:bg-indigo-950/50 text-indigo-700 dark:text-indigo-300'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-slate-200'
              )}
            >
              <NavIcon
                size={16}
                className={isActive ? 'text-indigo-600 dark:text-indigo-400' : 'text-slate-400 dark:text-slate-500'}
              />
              {label}
            </Link>
          );
        })}
      </nav>

      {/* User */}
      {user && (
        <div className="px-2 py-3 border-t border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2.5 px-2 py-2 rounded-lg">
            <Avatar name={user.name} src={user.avatar} size="sm" />
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold text-slate-900 dark:text-slate-100 truncate">{user.name}</p>
              <p className="text-[11px] text-slate-400 truncate">{user.email}</p>
            </div>
            <button
              onClick={handleLogout}
              title="Sign out"
              className="p-1.5 rounded-md text-slate-400 hover:text-red-500 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
            >
              <Icon.LogOut size={14} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export function Sidebar({ mobileOpen, onMobileClose }: SidebarProps) {
  return (
    <>
      {/* Desktop */}
      <aside className="hidden lg:flex flex-col w-56 fixed left-0 top-0 bottom-0 bg-white dark:bg-slate-900 border-r border-slate-100 dark:border-slate-800 z-30">
        <SidebarContent />
      </aside>

      {/* Mobile Drawer */}
      <AnimatePresence>
        {mobileOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }}
              className="fixed inset-0 bg-black/40 z-40 lg:hidden"
              onClick={onMobileClose}
            />
            <motion.aside
              initial={{ x: -240 }}
              animate={{ x: 0 }}
              exit={{ x: -240 }}
              transition={{ duration: 0.22, ease: [0.25, 1, 0.5, 1] }}
              className="fixed left-0 top-0 bottom-0 w-60 bg-white dark:bg-slate-900 border-r border-slate-100 dark:border-slate-800 z-50 lg:hidden"
            >
              <SidebarContent onClose={onMobileClose} />
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </>
  );
}

// ─── Mobile Bottom Nav ────────────────────────────────────────
const MOBILE_NAV = navItems.slice(0, 5);

export function MobileBottomNav() {
  const pathname = usePathname();

  return (
    <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-30 bg-white dark:bg-slate-900 border-t border-slate-100 dark:border-slate-800 safe-bottom">
      <div className="flex">
        {MOBILE_NAV.map(({ href, label, MobileIcon }) => {
          const isActive = pathname === href || pathname.startsWith(`${href}/`);
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                'flex-1 flex flex-col items-center gap-1 py-2.5 transition-colors duration-100',
                isActive
                  ? 'text-indigo-600 dark:text-indigo-400'
                  : 'text-slate-400 dark:text-slate-500'
              )}
            >
              <MobileIcon size={20} />
              <span className="text-[10px] font-medium leading-none">{label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}

// ─── Top Header ───────────────────────────────────────────────
interface HeaderProps {
  onMenuClick: () => void;
  title: string;
  action?: React.ReactNode;
}

export function Header({ onMenuClick, title, action }: HeaderProps) {
  return (
    <header className="sticky top-0 z-20 h-14 bg-white/95 dark:bg-slate-900/95 backdrop-blur-sm border-b border-slate-100 dark:border-slate-800 flex items-center px-4 gap-3">
      <button
        onClick={onMenuClick}
        className="lg:hidden p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 dark:text-slate-400 transition-colors"
        aria-label="Open menu"
      >
        <Icon.Menu size={20} />
      </button>
      <h1 className="text-sm font-semibold text-slate-800 dark:text-slate-200 lg:hidden flex-1">{title}</h1>
      {action && <div className="lg:hidden ml-auto">{action}</div>}
    </header>
  );
}

// ─── Dashboard Layout ─────────────────────────────────────────
export function DashboardLayout({
  children,
  title = 'Attendify',
  headerAction,
}: {
  children: React.ReactNode;
  title?: string;
  headerAction?: React.ReactNode;
}) {
  const [mobileOpen, setMobileOpen] = React.useState(false);

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
      <Sidebar mobileOpen={mobileOpen} onMobileClose={() => setMobileOpen(false)} />
      <div className="lg:pl-56">
        <Header
          onMenuClick={() => setMobileOpen(true)}
          title={title}
          action={headerAction}
        />
        <main className="px-4 py-5 lg:px-8 lg:py-7 pb-24 lg:pb-7 max-w-6xl mx-auto">
          {children}
        </main>
      </div>
      <MobileBottomNav />
    </div>
  );
}
