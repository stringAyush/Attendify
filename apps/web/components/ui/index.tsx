'use client';

import React from 'react';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
import * as Icon from '@/components/ui/icons';

// ─── Button ───────────────────────────────────────────────────
interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost' | 'outline' | 'success';
  size?: 'xs' | 'sm' | 'md' | 'lg';
  loading?: boolean;
  icon?: React.ReactNode;
  iconRight?: React.ReactNode;
}

export function Button({
  variant = 'primary',
  size = 'md',
  loading = false,
  icon,
  iconRight,
  children,
  className,
  disabled,
  ...props
}: ButtonProps) {
  const base =
    'inline-flex items-center justify-center gap-2 font-semibold rounded-lg transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed select-none active:scale-[0.97]';

  const variants = {
    primary:
      'bg-indigo-600 text-white hover:bg-indigo-700 focus-visible:ring-indigo-500 shadow-sm shadow-indigo-200/50 dark:shadow-none',
    secondary:
      'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-700 focus-visible:ring-slate-400',
    danger:
      'bg-red-600 text-white hover:bg-red-700 focus-visible:ring-red-500 shadow-sm shadow-red-200/50 dark:shadow-none',
    ghost:
      'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-slate-100 focus-visible:ring-slate-400',
    outline:
      'border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/60 focus-visible:ring-slate-400 bg-white dark:bg-transparent shadow-xs',
    success:
      'bg-emerald-600 text-white hover:bg-emerald-700 focus-visible:ring-emerald-500 shadow-sm shadow-emerald-200/50 dark:shadow-none',
  };

  const sizes = {
    xs: 'h-7 px-2.5 text-xs',
    sm: 'h-8 px-3 text-xs',
    md: 'h-10 px-4 text-sm',
    lg: 'h-11 px-6 text-sm',
  };

  return (
    <button
      className={cn(base, variants[variant], sizes[size], className)}
      disabled={disabled || loading}
      {...props}
    >
      {loading ? (
        <svg className="w-3.5 h-3.5 animate-spin flex-shrink-0" viewBox="0 0 24 24" fill="none">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
        </svg>
      ) : icon ? (
        <span className="flex-shrink-0">{icon}</span>
      ) : null}
      {children}
      {iconRight && !loading && <span className="flex-shrink-0">{iconRight}</span>}
    </button>
  );
}

// ─── Input ────────────────────────────────────────────────────
interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  hint?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  inputSize?: 'sm' | 'md' | 'lg';
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, hint, leftIcon, rightIcon, className, id, inputSize = 'md', ...props }, ref) => {
    const inputId = id ?? label?.toLowerCase().replace(/\s+/g, '-');

    const sizes = {
      sm: 'h-8 text-xs',
      md: 'h-10 text-sm',
      lg: 'h-11 text-base',
    };

    return (
      <div className="w-full">
        {label && (
          <label
            htmlFor={inputId}
            className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1.5 tracking-wide"
          >
            {label}
          </label>
        )}
        <div className="relative">
          {leftIcon && (
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none flex-shrink-0">
              {leftIcon}
            </span>
          )}
          <input
            id={inputId}
            ref={ref}
            className={cn(
              'w-full px-3.5 rounded-lg border transition-all duration-150 outline-none',
              sizes[inputSize],
              'bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100',
              'placeholder:text-slate-400 dark:placeholder:text-slate-600',
              error
                ? 'border-red-400 dark:border-red-600 focus:border-red-500 focus:ring-2 focus:ring-red-100 dark:focus:ring-red-950/30'
                : 'border-slate-200 dark:border-slate-700 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 dark:focus:ring-indigo-950/30',
              leftIcon && 'pl-9',
              rightIcon && 'pr-10',
              className
            )}
            {...props}
          />
          {rightIcon && (
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400">
              {rightIcon}
            </span>
          )}
        </div>
        {error && <p className="mt-1.5 text-xs text-red-500 font-medium">{error}</p>}
        {!error && hint && <p className="mt-1.5 text-xs text-slate-400 dark:text-slate-500">{hint}</p>}
      </div>
    );
  }
);
Input.displayName = 'Input';

// ─── Textarea ─────────────────────────────────────────────────
interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
  hint?: string;
}

export const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ label, error, hint, className, id, ...props }, ref) => {
    const inputId = id ?? label?.toLowerCase().replace(/\s+/g, '-');
    return (
      <div className="w-full">
        {label && (
          <label htmlFor={inputId} className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1.5 tracking-wide">
            {label}
          </label>
        )}
        <textarea
          id={inputId}
          ref={ref}
          className={cn(
            'w-full px-3.5 py-2.5 rounded-lg border text-sm transition-all duration-150 outline-none resize-none',
            'bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100',
            'placeholder:text-slate-400 dark:placeholder:text-slate-600',
            error
              ? 'border-red-400 focus:border-red-500 focus:ring-2 focus:ring-red-100'
              : 'border-slate-200 dark:border-slate-700 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 dark:focus:ring-indigo-950/30',
            className
          )}
          {...props}
        />
        {error && <p className="mt-1.5 text-xs text-red-500 font-medium">{error}</p>}
        {!error && hint && <p className="mt-1.5 text-xs text-slate-400 dark:text-slate-500">{hint}</p>}
      </div>
    );
  }
);
Textarea.displayName = 'Textarea';

// ─── Select ───────────────────────────────────────────────────
interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  options: { value: string; label: string }[];
  placeholder?: string;
}

export const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
  ({ label, error, options, placeholder, className, id, ...props }, ref) => {
    const selectId = id ?? label?.toLowerCase().replace(/\s+/g, '-');
    return (
      <div className="w-full">
        {label && (
          <label htmlFor={selectId} className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1.5 tracking-wide">
            {label}
          </label>
        )}
        <div className="relative">
          <select
            id={selectId}
            ref={ref}
            className={cn(
              'w-full h-10 pl-3.5 pr-10 rounded-lg border text-sm transition-all duration-150 outline-none appearance-none cursor-pointer',
              'bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100',
              error
                ? 'border-red-400 focus:border-red-500 focus:ring-2 focus:ring-red-100'
                : 'border-slate-200 dark:border-slate-700 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 dark:focus:ring-indigo-950/30',
              className
            )}
            {...props}
          >
            {placeholder && (
              <option value="" disabled>
                {placeholder}
              </option>
            )}
            {options.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">
            <Icon.ChevronDown size={15} />
          </span>
        </div>
        {error && <p className="mt-1.5 text-xs text-red-500 font-medium">{error}</p>}
      </div>
    );
  }
);
Select.displayName = 'Select';

// ─── Card ──────────────────────────────────────────────────────
interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  clickable?: boolean;
  variant?: 'default' | 'elevated' | 'flat' | 'inset';
  noPad?: boolean;
}

export function Card({ children, className, clickable = false, variant = 'default', noPad = false, ...props }: CardProps) {
  const variants = {
    default: 'bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs dark:shadow-none',
    elevated: 'bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800 shadow-md dark:shadow-none',
    flat: 'bg-slate-50 dark:bg-slate-900/50 border border-slate-100 dark:border-slate-800/60',
    inset: 'bg-slate-50/50 dark:bg-slate-950/50 border border-slate-100 dark:border-slate-800',
  };

  return (
    <div
      className={cn(
        'rounded-xl transition-all duration-150',
        variants[variant],
        clickable && 'cursor-pointer hover:border-indigo-200/80 dark:hover:border-slate-700 hover:shadow-md active:scale-[0.99] card-hover',
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}

// ─── Badge ────────────────────────────────────────────────────
interface BadgeProps {
  children: React.ReactNode;
  variant?: 'default' | 'success' | 'danger' | 'warning' | 'info' | 'purple' | 'indigo';
  size?: 'sm' | 'md';
  dot?: boolean;
  className?: string;
}

const badgeDotColors: Record<string, string> = {
  default: 'bg-slate-400',
  success:  'bg-emerald-500',
  danger:   'bg-red-500',
  warning:  'bg-amber-500',
  info:     'bg-sky-500',
  purple:   'bg-violet-500',
  indigo:   'bg-indigo-500',
};

export function Badge({ children, variant = 'default', size = 'sm', dot = false, className }: BadgeProps) {
  const variants = {
    default: 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400',
    success: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-400 border border-emerald-200/60 dark:border-emerald-900/40',
    danger:  'bg-red-50 text-red-700 dark:bg-red-950/30 dark:text-red-400 border border-red-200/60 dark:border-red-900/40',
    warning: 'bg-amber-50 text-amber-700 dark:bg-amber-950/30 dark:text-amber-400 border border-amber-200/60 dark:border-amber-900/40',
    info:    'bg-sky-50 text-sky-700 dark:bg-sky-950/30 dark:text-sky-400 border border-sky-200/60 dark:border-sky-900/40',
    purple:  'bg-violet-50 text-violet-700 dark:bg-violet-950/30 dark:text-violet-400 border border-violet-200/60 dark:border-violet-900/40',
    indigo:  'bg-indigo-50 text-indigo-700 dark:bg-indigo-950/30 dark:text-indigo-400 border border-indigo-200/60 dark:border-indigo-900/40',
  };

  const sizes = {
    sm: 'px-2 py-0.5 text-xs',
    md: 'px-2.5 py-1 text-xs',
  };

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-md font-semibold tracking-wide',
        variants[variant],
        sizes[size],
        className
      )}
    >
      {dot && <span className={cn('w-1.5 h-1.5 rounded-full flex-shrink-0', badgeDotColors[variant])} />}
      {children}
    </span>
  );
}

// ─── Avatar ───────────────────────────────────────────────────
interface AvatarProps {
  name: string;
  src?: string | null;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  ring?: boolean;
  ringColor?: string;
  className?: string;
}

const AVATAR_COLORS = [
  'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-300',
  'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300',
  'bg-rose-100 text-rose-700 dark:bg-rose-900/40 dark:text-rose-300',
  'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300',
  'bg-violet-100 text-violet-700 dark:bg-violet-900/40 dark:text-violet-300',
  'bg-sky-100 text-sky-700 dark:bg-sky-900/40 dark:text-sky-300',
];

export function Avatar({ name, src, size = 'md', ring = false, ringColor = 'ring-indigo-500', className }: AvatarProps) {
  const sizes = {
    xs: 'w-6 h-6 text-[10px]',
    sm: 'w-8 h-8 text-xs',
    md: 'w-10 h-10 text-sm',
    lg: 'w-12 h-12 text-base',
    xl: 'w-16 h-16 text-xl',
  };

  const initials = name
    .split(' ')
    .map((w) => w[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  const colorIdx = name.charCodeAt(0) % AVATAR_COLORS.length;

  if (src) {
    return (
      <img
        src={src}
        alt={name}
        className={cn(
          'rounded-full object-cover flex-shrink-0',
          sizes[size],
          ring && `ring-2 ring-offset-2 ${ringColor}`,
          className
        )}
      />
    );
  }

  return (
    <div
      className={cn(
        'rounded-full flex items-center justify-center font-bold flex-shrink-0',
        sizes[size],
        AVATAR_COLORS[colorIdx],
        ring && `ring-2 ring-offset-2 ${ringColor}`,
        className
      )}
    >
      {initials}
    </div>
  );
}

// ─── Spinner ──────────────────────────────────────────────────
export function Spinner({ className, size = 20 }: { className?: string; size?: number }) {
  return (
    <svg
      className={cn('animate-spin text-indigo-600', className)}
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
    >
      <circle className="opacity-20" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" />
      <path className="opacity-80" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
    </svg>
  );
}

// ─── Empty State ──────────────────────────────────────────────
interface EmptyStateProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  action?: React.ReactNode;
  compact?: boolean;
}

export function EmptyState({ icon, title, description, action, compact = false }: EmptyStateProps) {
  return (
    <div className={cn('flex flex-col items-center justify-center text-center px-4', compact ? 'py-10' : 'py-16')}>
      <div className="w-12 h-12 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800 flex items-center justify-center text-slate-400 dark:text-slate-500 mb-4">
        {icon}
      </div>
      <h3 className="text-sm font-bold text-slate-900 dark:text-slate-200 mb-1">{title}</h3>
      <p className="text-xs text-slate-500 dark:text-slate-400 max-w-xs mb-5 leading-relaxed">{description}</p>
      {action}
    </div>
  );
}

// ─── Skeleton ─────────────────────────────────────────────────
export function Skeleton({ className }: { className?: string }) {
  return (
    <div className={cn('animate-pulse bg-slate-100 dark:bg-slate-800/60 rounded-lg', className)} />
  );
}

// ─── Modal ────────────────────────────────────────────────────
interface ModalProps {
  open: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  children: React.ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  footer?: React.ReactNode;
}

export function Modal({ open, onClose, title, description, children, size = 'md', footer }: ModalProps) {
  React.useEffect(() => {
    if (open) document.body.style.overflow = 'hidden';
    else document.body.style.overflow = '';
    return () => { document.body.style.overflow = ''; };
  }, [open]);

  const sizes = { sm: 'max-w-sm', md: 'max-w-md', lg: 'max-w-2xl', xl: 'max-w-4xl' };

  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={onClose}
          />
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 16 }}
            transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
            className={cn(
              'relative w-full bg-white dark:bg-slate-900 shadow-xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col',
              'max-h-[92vh] rounded-t-2xl sm:rounded-xl',
              sizes[size]
            )}
          >
            {/* Header */}
            <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex items-start justify-between gap-4 flex-shrink-0">
              <div>
                <h2 className="text-base font-bold text-slate-900 dark:text-slate-100">{title}</h2>
                {description && (
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{description}</p>
                )}
              </div>
              <button
                onClick={onClose}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors flex-shrink-0"
              >
                <Icon.X size={15} />
              </button>
            </div>
            {/* Body */}
            <div className="px-6 py-5 overflow-y-auto flex-1">{children}</div>
            {/* Footer */}
            {footer && (
              <div className="px-6 py-4 border-t border-slate-100 dark:border-slate-800 flex-shrink-0">
                {footer}
              </div>
            )}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}

// ─── Toast System ─────────────────────────────────────────────
interface Toast {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  message: string;
}

const ToastContext = React.createContext<{
  toast: (type: Toast['type'], message: string) => void;
} | null>(null);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = React.useState<Toast[]>([]);

  const toast = React.useCallback((type: Toast['type'], message: string) => {
    const id = Math.random().toString(36).slice(2);
    setToasts((prev) => [...prev, { id, type, message }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4500);
  }, []);

  return (
    <ToastContext.Provider value={{ toast }}>
      {children}
      <div className="fixed bottom-24 sm:bottom-6 right-4 z-[100] flex flex-col gap-2 max-w-xs w-full pointer-events-none">
        <AnimatePresence>
          {toasts.map((t) => (
            <motion.div
              key={t.id}
              initial={{ opacity: 0, y: 10, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95, x: 20 }}
              transition={{ duration: 0.2, ease: 'easeOut' }}
              className={cn(
                'flex items-start gap-3 p-3.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-lg text-sm pointer-events-auto',
                t.type === 'success' && 'border-l-4 border-l-emerald-500',
                t.type === 'error'   && 'border-l-4 border-l-red-500',
                t.type === 'warning' && 'border-l-4 border-l-amber-500',
                t.type === 'info'    && 'border-l-4 border-l-sky-500'
              )}
            >
              <span className="mt-0.5 flex-shrink-0">
                {t.type === 'success' && <Icon.CheckCircle className="text-emerald-600" size={16} />}
                {t.type === 'error'   && <Icon.AlertCircle className="text-red-500" size={16} />}
                {t.type === 'warning' && <Icon.AlertTriangle className="text-amber-600" size={16} />}
                {t.type === 'info'    && <Icon.InfoCircle className="text-sky-600" size={16} />}
              </span>
              <span className="text-slate-800 dark:text-slate-200 flex-1 leading-snug font-medium text-xs">{t.message}</span>
              <button
                onClick={() => setToasts((prev) => prev.filter((x) => x.id !== t.id))}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 mt-0.5 p-0.5 rounded"
              >
                <Icon.X size={13} />
              </button>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = React.useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used inside ToastProvider');
  return ctx;
}

// ─── Progress Bar ─────────────────────────────────────────────
interface ProgressBarProps {
  value: number;
  max?: number;
  className?: string;
  showLabel?: boolean;
  size?: 'xs' | 'sm' | 'md';
  color?: 'auto' | 'brand' | 'success' | 'warning' | 'danger';
  animated?: boolean;
}

export function ProgressBar({ value, max = 100, className, showLabel = false, size = 'xs', color = 'auto', animated = false }: ProgressBarProps) {
  const pct = Math.min(100, Math.max(0, (value / max) * 100));

  const autoColor =
    pct >= 85 ? 'bg-emerald-500' :
    pct >= 70 ? 'bg-indigo-500'  :
    pct >= 50 ? 'bg-amber-500'   : 'bg-red-500';

  const manualColors = {
    brand:   'bg-indigo-500',
    success: 'bg-emerald-500',
    warning: 'bg-amber-500',
    danger:  'bg-red-500',
    auto:    autoColor,
  };

  const heights = { xs: 'h-1.5', sm: 'h-2', md: 'h-2.5' };

  return (
    <div className={cn('w-full', className)}>
      <div className={cn('bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden', heights[size])}>
        <motion.div
          className={cn('h-full rounded-full', manualColors[color], animated && 'animate-pulse')}
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 0.55, ease: 'easeOut' }}
        />
      </div>
      {showLabel && (
        <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 mt-1 tabular-nums block">
          {Math.round(pct)}%
        </span>
      )}
    </div>
  );
}

// ─── Progress Ring ─────────────────────────────────────────────
interface ProgressRingProps {
  value: number;
  size?: number;
  strokeWidth?: number;
  className?: string;
  showLabel?: boolean;
}

export function ProgressRing({ value, size = 48, strokeWidth = 4, className, showLabel = true }: ProgressRingProps) {
  const pct = Math.min(100, Math.max(0, value));
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (pct / 100) * circumference;

  const color =
    pct >= 85 ? '#059669' :
    pct >= 70 ? '#4f46e5' :
    pct >= 50 ? '#d97706' : '#dc2626';

  return (
    <div className={cn('relative inline-flex items-center justify-center', className)} style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={radius} fill="none" strokeWidth={strokeWidth} className="stroke-slate-100 dark:stroke-slate-800" />
        <circle
          cx={size / 2} cy={size / 2} r={radius}
          fill="none"
          stroke={color}
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          className="transition-all duration-500 ease-out"
        />
      </svg>
      {showLabel && (
        <span className="absolute text-[10px] font-bold tabular-nums" style={{ color }}>
          {Math.round(pct)}%
        </span>
      )}
    </div>
  );
}

// ─── Divider ──────────────────────────────────────────────────
export function Divider({ className, label }: { className?: string; label?: string }) {
  if (label) {
    return (
      <div className={cn('flex items-center gap-3', className)}>
        <div className="flex-1 h-px bg-slate-200 dark:bg-slate-800" />
        <span className="text-xs font-semibold text-slate-400 dark:text-slate-500 tracking-wide">{label}</span>
        <div className="flex-1 h-px bg-slate-200 dark:bg-slate-800" />
      </div>
    );
  }
  return <div className={cn('h-px bg-slate-100 dark:bg-slate-800', className)} />;
}

// ─── Section Header ───────────────────────────────────────────
export function SectionHeader({
  title,
  description,
  action,
  label,
}: {
  title: string;
  description?: string;
  action?: React.ReactNode;
  label?: string;
}) {
  return (
    <div className="flex items-start justify-between gap-4">
      <div>
        {label && <p className="section-label mb-1">{label}</p>}
        <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100">{title}</h2>
        {description && <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5 leading-relaxed">{description}</p>}
      </div>
      {action && <div className="flex-shrink-0">{action}</div>}
    </div>
  );
}

// ─── Page Header ──────────────────────────────────────────────
export function PageHeader({
  title,
  subtitle,
  action,
  backHref,
  onBack,
}: {
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
  backHref?: string;
  onBack?: () => void;
}) {
  return (
    <div className="flex items-center gap-3">
      {(backHref || onBack) && (
        <button
          onClick={onBack}
          className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 dark:text-slate-400 transition-colors flex-shrink-0"
        >
          <Icon.ArrowLeft size={17} />
        </button>
      )}
      <div className="flex-1 min-w-0">
        <h1 className="text-xl font-extrabold text-slate-900 dark:text-slate-50 tracking-tight truncate">{title}</h1>
        {subtitle && <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{subtitle}</p>}
      </div>
      {action && <div className="flex-shrink-0">{action}</div>}
    </div>
  );
}

// ─── StatCard ─────────────────────────────────────────────────
interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: React.ReactNode;
  iconBg?: string;
  trend?: 'up' | 'down' | 'neutral';
  trendValue?: string;
  className?: string;
}

export function StatCard({ title, value, subtitle, icon, iconBg, trend, trendValue, className }: StatCardProps) {
  return (
    <Card className={cn('p-5', className)}>
      <div className="flex items-start justify-between mb-3">
        <div className={cn('w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0', iconBg || 'bg-indigo-50 dark:bg-indigo-950/30 text-indigo-600 dark:text-indigo-400')}>
          {icon}
        </div>
        {trend && trend !== 'neutral' && (
          <span className={cn('flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full',
            trend === 'up'
              ? 'text-emerald-700 bg-emerald-50 dark:text-emerald-400 dark:bg-emerald-950/30'
              : 'text-red-700 bg-red-50 dark:text-red-400 dark:bg-red-950/30'
          )}>
            {trend === 'up' ? <Icon.TrendingUp size={12} /> : <Icon.TrendingDown size={12} />}
            {trendValue}
          </span>
        )}
      </div>
      <p className="text-2xl font-extrabold text-slate-900 dark:text-slate-50 tracking-tight tabular-nums">{value}</p>
      <p className="text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider mt-1">{title}</p>
      {subtitle && <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">{subtitle}</p>}
    </Card>
  );
}

// ─── AttendanceChip ───────────────────────────────────────────
type AttStatus = 'PRESENT' | 'ABSENT' | 'LATE' | 'HALF_DAY';

interface AttendanceChipProps {
  status: AttStatus;
  selected: boolean;
  onClick: () => void;
  disabled?: boolean;
  compact?: boolean;
}

const CHIP_LABELS: Record<AttStatus, string> = {
  PRESENT: 'P',
  ABSENT:  'A',
  LATE:    'L',
  HALF_DAY:'H',
};

const CHIP_ACTIVE: Record<AttStatus, string> = {
  PRESENT:  'att-chip-present',
  ABSENT:   'att-chip-absent',
  LATE:     'att-chip-late',
  HALF_DAY: 'att-chip-halfday',
};

export function AttendanceChip({ status, selected, onClick, disabled = false, compact = false }: AttendanceChipProps) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={cn(
        'att-chip',
        compact ? 'h-9 min-w-[2.75rem] text-[11px]' : 'h-11 min-w-[3.5rem]',
        selected ? CHIP_ACTIVE[status] : 'att-chip-idle'
      )}
    >
      {CHIP_LABELS[status]}
    </button>
  );
}

// ─── QuickActionCard ──────────────────────────────────────────
interface QuickActionCardProps {
  href: string;
  label: string;
  description?: string;
  icon: React.ReactNode;
  iconBg?: string;
  onClick?: () => void;
}

export function QuickActionCard({ href, label, description, icon, iconBg, onClick }: QuickActionCardProps) {
  const content = (
    <div className="flex items-center gap-3.5 px-4 py-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-indigo-300/70 dark:hover:border-slate-700 hover:bg-indigo-50/30 dark:hover:bg-slate-800/50 transition-all duration-150 group shadow-xs active:scale-[0.97] cursor-pointer">
      <div className={cn('w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0', iconBg || 'bg-indigo-50 dark:bg-indigo-950/30 text-indigo-600 dark:text-indigo-400')}>
        {icon}
      </div>
      <div className="min-w-0">
        <p className="text-sm font-semibold text-slate-800 dark:text-slate-200 truncate">{label}</p>
        {description && <p className="text-xs text-slate-400 dark:text-slate-500 truncate mt-0.5">{description}</p>}
      </div>
      <Icon.ArrowUpRight size={14} className="ml-auto text-slate-300 dark:text-slate-600 group-hover:text-indigo-400 flex-shrink-0 transition-colors" />
    </div>
  );

  if (onClick) {
    return <div onClick={onClick}>{content}</div>;
  }

  return <Link href={href}>{content}</Link>;
}

// ─── FilterChip ───────────────────────────────────────────────
interface FilterChipProps {
  label: string;
  active: boolean;
  onClick: () => void;
  count?: number;
}

export function FilterChip({ label, active, onClick, count }: FilterChipProps) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold border transition-all duration-100 whitespace-nowrap flex-shrink-0',
        active
          ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm shadow-indigo-200/50 dark:shadow-none'
          : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600'
      )}
    >
      {label}
      {count !== undefined && (
        <span className={cn('text-[10px] font-bold px-1 py-px rounded-sm', active ? 'bg-indigo-500 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400')}>
          {count}
        </span>
      )}
    </button>
  );
}

// ─── Tabs ─────────────────────────────────────────────────────
interface Tab {
  id: string;
  label: string;
  count?: number;
}

interface TabsProps {
  tabs: Tab[];
  active: string;
  onChange: (id: string) => void;
  className?: string;
}

export function Tabs({ tabs, active, onChange, className }: TabsProps) {
  return (
    <div className={cn('flex gap-0.5 p-1 bg-slate-100 dark:bg-slate-800/60 rounded-lg', className)}>
      {tabs.map((tab) => (
        <button
          key={tab.id}
          onClick={() => onChange(tab.id)}
          className={cn(
            'flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition-all duration-150',
            active === tab.id
              ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 shadow-xs'
              : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300'
          )}
        >
          {tab.label}
          {tab.count !== undefined && (
            <span className={cn('text-[10px] font-bold px-1 rounded-sm', active === tab.id ? 'text-indigo-600 dark:text-indigo-400' : 'text-slate-400')}>
              {tab.count}
            </span>
          )}
        </button>
      ))}
    </div>
  );
}

// ─── Confirm Dialog ───────────────────────────────────────────
interface ConfirmDialogProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  description?: string;
  confirmLabel?: string;
  confirmVariant?: 'primary' | 'danger';
  loading?: boolean;
}

export function ConfirmDialog({
  open, onClose, onConfirm, title, description,
  confirmLabel = 'Confirm', confirmVariant = 'danger', loading = false,
}: ConfirmDialogProps) {
  return (
    <Modal open={open} onClose={onClose} title={title} description={description} size="sm">
      <div className="flex gap-3 pt-1">
        <Button variant="secondary" className="flex-1" onClick={onClose}>
          Cancel
        </Button>
        <Button variant={confirmVariant} className="flex-1" onClick={onConfirm} loading={loading}>
          {confirmLabel}
        </Button>
      </div>
    </Modal>
  );
}
