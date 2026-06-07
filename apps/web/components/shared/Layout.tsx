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

// ─── Nav structure ────────────────────────────────────────────
const NAV_GROUPS = [
  {
    label: 'Main',
    items: [
      { href: '/dashboard',  label: 'Dashboard',  NavIcon: Icon.Home },
      { href: '/classes',    label: 'Classes',    NavIcon: Icon.BookOpen },
      { href: '/students',   label: 'Students',   NavIcon: Icon.Users },
      { href: '/attendance', label: 'Attendance', NavIcon: Icon.ClipboardCheck },
    ],
  },
  {
    label: 'Insights',
    items: [
      { href: '/analytics',  label: 'Analytics',  NavIcon: Icon.BarChart2 },
      { href: '/reports',    label: 'Reports',    NavIcon: Icon.FileText },
    ],
  },
];

const MOBILE_NAV = [
  { href: '/dashboard',  label: 'Home',       MobileIcon: Icon.Home },
  { href: '/classes',    label: 'Classes',    MobileIcon: Icon.BookOpen },
  { href: '/attendance', label: 'Attend',     MobileIcon: Icon.ClipboardCheck },
  { href: '/analytics',  label: 'Analytics',  MobileIcon: Icon.BarChart2 },
  { href: '/reports',    label: 'Reports',    MobileIcon: Icon.FileText },
];

// ─── Sidebar Content ──────────────────────────────────────────
function SidebarContent({
  onClose,
  collapsed,
  onToggleCollapse,
}: {
  onClose?: () => void;
  collapsed?: boolean;
  onToggleCollapse?: () => void;
}) {
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
      <div className="h-14 px-4 flex items-center justify-between border-b border-slate-100 dark:border-slate-800/80 flex-shrink-0">
        <Link href="/dashboard" onClick={onClose} className="flex items-center gap-2.5 min-w-0">
          <AttendifyMark size={26} className="flex-shrink-0" />
          {!collapsed && (
            <span className="text-sm font-bold text-slate-900 dark:text-white tracking-tight truncate">
              Attendify
            </span>
          )}
        </Link>
        {onToggleCollapse && !onClose && (
          <button
            onClick={onToggleCollapse}
            className="hidden lg:flex p-1.5 rounded-md text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors flex-shrink-0"
            title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            {collapsed ? <Icon.ChevronRight size={14} /> : <Icon.ChevronLeft size={14} />}
          </button>
        )}
      </div>

      {/* Nav groups */}
      <nav className="flex-1 px-2 py-3 overflow-y-auto scrollbar-hide space-y-5">
        {NAV_GROUPS.map((group) => (
          <div key={group.label}>
            {!collapsed && (
              <p className="px-3 mb-1.5 text-[10px] font-bold text-slate-400 dark:text-slate-600 uppercase tracking-widest">
                {group.label}
              </p>
            )}
            <div className="space-y-0.5">
              {group.items.map(({ href, label, NavIcon }) => {
                const isActive = pathname === href || pathname.startsWith(`${href}/`);
                return (
                  <Link
                    key={href}
                    href={href}
                    onClick={onClose}
                    title={collapsed ? label : undefined}
                    className={cn(
                      'sidebar-link',
                      isActive && 'active',
                      collapsed && 'justify-center px-2'
                    )}
                  >
                    <NavIcon
                      size={16}
                      className={cn(
                        'flex-shrink-0 transition-colors',
                        isActive
                          ? 'text-indigo-600 dark:text-indigo-400'
                          : 'text-slate-400 dark:text-slate-500'
                      )}
                    />
                    {!collapsed && (
                      <span className="truncate">{label}</span>
                    )}
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      {/* User section */}
      {user && (
        <div className={cn('px-2 py-3 border-t border-slate-100 dark:border-slate-800/80 flex-shrink-0', collapsed && 'flex flex-col items-center gap-2')}>
          {!collapsed ? (
            <div className="flex items-center gap-2.5 px-2 py-2 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors group">
              <Avatar name={user.name} src={user.avatar} size="sm" />
              <div className="flex-1 min-w-0">
                <p className="text-xs font-bold text-slate-900 dark:text-slate-100 truncate">{user.name}</p>
                <p className="text-[10px] text-slate-400 dark:text-slate-500 truncate">{user.email}</p>
              </div>
              <button
                onClick={handleLogout}
                title="Sign out"
                className="p-1.5 rounded-md text-slate-400 hover:text-red-500 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/20 transition-colors opacity-0 group-hover:opacity-100"
              >
                <Icon.LogOut size={13} />
              </button>
            </div>
          ) : (
            <>
              <Avatar name={user.name} src={user.avatar} size="sm" />
              <button
                onClick={handleLogout}
                title="Sign out"
                className="p-1.5 rounded-md text-slate-400 hover:text-red-500 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/20 transition-colors"
              >
                <Icon.LogOut size={13} />
              </button>
            </>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Desktop Sidebar ──────────────────────────────────────────
interface SidebarProps {
  mobileOpen: boolean;
  onMobileClose: () => void;
}

export function Sidebar({ mobileOpen, onMobileClose }: SidebarProps) {
  const [collapsed, setCollapsed] = React.useState(false);

  return (
    <>
      {/* Desktop */}
      <motion.aside
        animate={{ width: collapsed ? 64 : 224 }}
        transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
        className="hidden lg:flex flex-col fixed left-0 top-0 bottom-0 bg-white dark:bg-slate-950 border-r border-slate-100 dark:border-slate-800/80 z-30 overflow-hidden"
      >
        <SidebarContent
          collapsed={collapsed}
          onToggleCollapse={() => setCollapsed((c) => !c)}
        />
      </motion.aside>

      {/* Mobile Drawer overlay */}
      <AnimatePresence>
        {mobileOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }}
              className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40 lg:hidden"
              onClick={onMobileClose}
            />
            <motion.aside
              initial={{ x: -240 }}
              animate={{ x: 0 }}
              exit={{ x: -240 }}
              transition={{ duration: 0.22, ease: [0.25, 1, 0.5, 1] }}
              className="fixed left-0 top-0 bottom-0 w-60 bg-white dark:bg-slate-950 border-r border-slate-100 dark:border-slate-800/80 z-50 lg:hidden"
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
export function MobileBottomNav() {
  const pathname = usePathname();

  return (
    <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-30 bg-white/95 dark:bg-slate-950/95 backdrop-blur-md border-t border-slate-100 dark:border-slate-800/80 safe-bottom">
      <div className="flex">
        {MOBILE_NAV.map(({ href, label, MobileIcon }) => {
          const isActive = pathname === href || pathname.startsWith(`${href}/`);
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                'bottom-nav-item',
                isActive
                  ? 'text-indigo-600 dark:text-indigo-400 active'
                  : 'text-slate-400 dark:text-slate-500'
              )}
            >
              <MobileIcon size={21} />
              <span className={cn('text-[10px] font-medium leading-none', isActive && 'font-bold')}>
                {label}
              </span>
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
    <header className="sticky top-0 z-20 h-14 bg-white/90 dark:bg-slate-950/90 backdrop-blur-md border-b border-slate-100 dark:border-slate-800/80 flex items-center px-4 gap-3">
      <button
        onClick={onMenuClick}
        className="lg:hidden p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 dark:text-slate-400 transition-colors -ml-1"
        aria-label="Open menu"
      >
        <Icon.Menu size={19} />
      </button>
      <h1 className="text-sm font-bold text-slate-800 dark:text-slate-200 lg:hidden flex-1">{title}</h1>
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
  const [sidebarCollapsed, setSidebarCollapsed] = React.useState(false);

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
      <Sidebar mobileOpen={mobileOpen} onMobileClose={() => setMobileOpen(false)} />
      {/* Main content — offset dynamically based on sidebar state */}
      <div
        className="transition-[padding-left] duration-200 ease-out"
        style={{ paddingLeft: sidebarCollapsed ? 64 : undefined }}
      >
        <div className="lg:pl-56">
          <Header
            onMenuClick={() => setMobileOpen(true)}
            title={title}
            action={headerAction}
          />
          <main className="px-4 py-5 lg:px-7 lg:py-6 pb-28 lg:pb-8 max-w-7xl mx-auto">
            {children}
          </main>
        </div>
      </div>
      <MobileBottomNav />
    </div>
  );
}
