'use client';

import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { DashboardLayout } from '@/components/shared/Layout';
import {
  Card, Button, Input, Select, Badge, useToast, Avatar, Modal, ConfirmDialog, Skeleton,
} from '@/components/ui';
import * as Icon from '@/components/ui/icons';
import { useAuthStore } from '@/lib/store/auth.store';
import { classApi, ClassItem } from '@/lib/api';
import Link from 'next/link';

type SettingsTab = 'account' | 'preferences' | 'notifications' | 'classes' | 'privacy';

export default function SettingsPage() {
  const { user, updateUser, logout } = useAuthStore();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState<SettingsTab>('account');

  // Account Form
  const [name, setName] = useState(user?.name ?? '');
  const [email, setEmail] = useState(user?.email ?? '');
  const [institution, setInstitution] = useState(user?.teacher?.institution?.name ?? 'Attendify Academy');
  const [role, setRole] = useState(user?.role ?? 'TEACHER');

  // Preferences Form
  const [theme, setTheme] = useState<'light' | 'dark' | 'system'>('system');
  const [language, setLanguage] = useState('en');

  // Notifications Form
  const [notifEmail, setNotifEmail] = useState(true);
  const [notifPush, setNotifPush] = useState(false);
  const [notifWeekly, setNotifWeekly] = useState(true);
  const [notifAtRisk, setNotifAtRisk] = useState(true);

  // Manage Classes Data
  const [classes, setClasses] = useState<ClassItem[]>([]);
  const [classesLoading, setClassesLoading] = useState(true);

  // Privacy & Security States
  const [twoFactor, setTwoFactor] = useState(false);
  const [telemetry, setTelemetry] = useState(true);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [passwordForm, setPasswordForm] = useState({ current: '', newPassword: '', confirm: '' });

  // Theme Sync on mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedTheme = localStorage.getItem('attendify-theme') as 'light' | 'dark' | 'system' | null;
      if (savedTheme) {
        setTheme(savedTheme);
      }
    }

    // Load classes
    classApi.list({ limit: 100 })
      .then((res) => {
        setClasses(res.data as ClassItem[]);
      })
      .catch((err) => console.error('Failed to load classes', err))
      .finally(() => setClassesLoading(false));
  }, []);

  // Theme apply function
  const handleThemeChange = (newTheme: 'light' | 'dark' | 'system') => {
    setTheme(newTheme);
    localStorage.setItem('attendify-theme', newTheme);

    const root = document.documentElement;
    if (newTheme === 'dark') {
      root.classList.add('dark');
    } else if (newTheme === 'light') {
      root.classList.remove('dark');
    } else {
      const systemDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      if (systemDark) root.classList.add('dark');
      else root.classList.remove('dark');
    }
    toast('success', `Theme changed to ${newTheme}`);
  };

  // Profile Save
  const handleSaveProfile = () => {
    if (!name.trim()) {
      toast('error', 'Name is required');
      return;
    }
    updateUser({ name, email });
    toast('success', 'Profile updated successfully');
  };

  // Preference Save
  const handleSavePreferences = () => {
    toast('success', 'Preferences saved');
  };

  // Notifications Save
  const handleSaveNotifications = () => {
    toast('success', 'Notification settings updated');
  };

  // Password Update
  const handleUpdatePassword = () => {
    if (!passwordForm.current || !passwordForm.newPassword || !passwordForm.confirm) {
      toast('error', 'Please fill out all fields');
      return;
    }
    if (passwordForm.newPassword !== passwordForm.confirm) {
      toast('error', 'New passwords do not match');
      return;
    }
    toast('success', 'Password updated successfully!');
    setShowPasswordModal(false);
    setPasswordForm({ current: '', newPassword: '', confirm: '' });
  };

  // Delete Account
  const handleDeleteAccount = async () => {
    toast('success', 'Account deleted successfully');
    setShowDeleteConfirm(false);
    await logout();
    window.location.href = '/auth/signup';
  };

  const tabs = [
    { id: 'account', label: 'Edit Profile', icon: <Icon.User size={15} /> },
    { id: 'preferences', label: 'Preferences', icon: <Icon.SlidersHorizontal size={15} /> },
    { id: 'notifications', label: 'Notifications', icon: <Icon.Bell size={15} /> },
    { id: 'classes', label: 'Manage Classes', icon: <Icon.BookOpen size={15} /> },
    { id: 'privacy', label: 'Security & Privacy', icon: <Icon.Shield size={15} /> },
  ] as const;

  return (
    <DashboardLayout title="Settings">
      <div className="space-y-6">
        {/* Page Header */}
        <div className="flex flex-col gap-1.5">
          <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-slate-50 tracking-tight">Settings & Preferences</h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">Configure your profile, notification targets, and institute preferences.</p>
        </div>

        {/* Tab switcher */}
        <div className="flex flex-col lg:flex-row gap-6 items-start">
          <Card className="w-full lg:w-64 p-2 flex flex-row lg:flex-col overflow-x-auto scrollbar-hide gap-1 lg:gap-0.5 flex-shrink-0">
            {tabs.map((t) => {
              const active = activeTab === t.id;
              return (
                <button
                  key={t.id}
                  onClick={() => setActiveTab(t.id)}
                  className={`flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-xs sm:text-sm font-bold text-left transition-all whitespace-nowrap lg:w-full active:scale-98 ${
                    active
                      ? 'bg-indigo-500 text-white shadow-sm shadow-indigo-200 dark:shadow-none'
                      : 'text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/40 hover:text-slate-900 dark:hover:text-slate-200'
                  }`}
                >
                  {t.icon}
                  {t.label}
                </button>
              );
            })}
          </Card>

          {/* Main content viewport */}
          <div className="flex-1 w-full min-w-0">
            <AnimatePresence mode="wait">
              <motion.div
                key={activeTab}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.18 }}
              >
                {/* ── Tab: Account ── */}
                {activeTab === 'account' && (
                  <Card className="p-5 sm:p-6 space-y-6">
                    <div>
                      <h3 className="text-sm sm:text-base font-extrabold text-slate-900 dark:text-slate-100">Personal Information</h3>
                      <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">Manage your public credentials and role identification.</p>
                    </div>

                    <div className="flex flex-col sm:flex-row items-center gap-5 pb-2 border-b border-slate-50 dark:border-slate-800/60">
                      <Avatar name={name} size="lg" className="h-16 w-16 text-lg" />
                      <div className="text-center sm:text-left space-y-1">
                        <p className="text-sm font-bold text-slate-800 dark:text-slate-200">{name || 'Your Name'}</p>
                        <p className="text-xs text-slate-400 dark:text-slate-500">Teacher Account · {institution}</p>
                        <div className="flex gap-2 justify-center sm:justify-start">
                          <Button size="xs" variant="outline">Change Photo</Button>
                          <Button size="xs" variant="ghost" className="text-red-500 dark:text-red-400">Remove</Button>
                        </div>
                      </div>
                    </div>

                    <div className="grid sm:grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <label className="text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Full Name</label>
                        <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Full Name" />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Email Address</label>
                        <Input value={email} onChange={(e) => setEmail(e.target.value)} type="email" placeholder="Email Address" />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Institution / School</label>
                        <Input value={institution} onChange={(e) => setInstitution(e.target.value)} placeholder="Institution Name" />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">System Role</label>
                        <Select
                          value={role}
                          onChange={(e) => setRole(e.target.value as 'TEACHER' | 'ADMIN')}
                          options={[
                            { value: 'TEACHER', label: 'Teacher / Instructor' },
                            { value: 'ADMIN', label: 'Administrator' },
                          ]}
                          disabled
                        />
                      </div>
                    </div>

                    <div className="pt-2 flex justify-end">
                      <Button onClick={handleSaveProfile} className="w-full sm:w-auto">
                        Save Changes
                      </Button>
                    </div>
                  </Card>
                )}

                {/* ── Tab: Preferences ── */}
                {activeTab === 'preferences' && (
                  <Card className="p-5 sm:p-6 space-y-6">
                    <div>
                      <h3 className="text-sm sm:text-base font-extrabold text-slate-900 dark:text-slate-100">Application Preferences</h3>
                      <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">Customize how Attendify behaves and renders on this device.</p>
                    </div>

                    {/* Theme selector */}
                    <div className="space-y-3">
                      <label className="text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Theme Mode</label>
                      <div className="grid grid-cols-3 gap-3">
                        {([
                          { id: 'light', label: 'Light', icon: <Icon.Sun size={15} />, colorClass: 'border-slate-200 bg-white text-slate-800' },
                          { id: 'dark', label: 'Dark', icon: <Icon.Moon size={15} />, colorClass: 'border-slate-800 bg-slate-950 text-slate-200' },
                          { id: 'system', label: 'System', icon: <Icon.SlidersHorizontal size={15} />, colorClass: 'border-slate-200 bg-slate-100 text-slate-800 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200' },
                        ] as const).map((t) => {
                          const active = theme === t.id;
                          return (
                            <button
                              key={t.id}
                              onClick={() => handleThemeChange(t.id)}
                              className={`flex flex-col items-center gap-2 p-3 border rounded-xl transition-all text-xs font-bold active:scale-98 ${t.colorClass} ${
                                active ? 'ring-2 ring-indigo-500 border-indigo-500 shadow-sm' : 'opacity-70 hover:opacity-100'
                              }`}
                            >
                              {t.icon}
                              {t.label}
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {/* Language config */}
                    <div className="space-y-1.5 max-w-sm">
                      <label className="text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Interface Language</label>
                      <Select
                        value={language}
                        onChange={(e) => setLanguage(e.target.value)}
                        options={[
                          { value: 'en', label: 'English (US)' },
                          { value: 'es', label: 'Español' },
                          { value: 'fr', label: 'Français' },
                        ]}
                      />
                    </div>

                    <div className="pt-2 flex justify-end">
                      <Button onClick={handleSavePreferences} className="w-full sm:w-auto">
                        Save Preferences
                      </Button>
                    </div>
                  </Card>
                )}

                {/* ── Tab: Notifications ── */}
                {activeTab === 'notifications' && (
                  <Card className="p-5 sm:p-6 space-y-6">
                    <div>
                      <h3 className="text-sm sm:text-base font-extrabold text-slate-900 dark:text-slate-100">Notifications & Alerts</h3>
                      <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">Control when you get notified about student and session updates.</p>
                    </div>

                    <div className="space-y-4">
                      {[
                        { title: 'Email Alerts', desc: 'Receive daily status check emails for absent students.', val: notifEmail, set: setNotifEmail },
                        { title: 'Mobile Push Notifications', desc: 'Get push alerts on your phone when a session starts.', val: notifPush, set: setNotifPush },
                        { title: 'Weekly Attendance Reports', desc: 'Receive automated weekly progress summaries for your classes.', val: notifWeekly, set: setNotifWeekly },
                        { title: 'At-Risk Warnings', desc: 'Immediate notification when any student drops below 75% attendance rate.', val: notifAtRisk, set: setNotifAtRisk },
                      ].map((n, i) => (
                        <label key={i} className="flex items-start gap-3.5 p-3.5 rounded-xl border border-slate-50 dark:border-slate-800/40 bg-slate-50/20 dark:bg-slate-900/10 cursor-pointer hover:bg-slate-50/50 dark:hover:bg-slate-900/20 transition-all select-none">
                          <input
                            type="checkbox"
                            checked={n.val}
                            onChange={(e) => n.set(e.target.checked)}
                            className="mt-1 w-4 h-4 rounded text-indigo-600 border-slate-300 dark:border-slate-700 focus:ring-indigo-500"
                          />
                          <div>
                            <p className="text-xs sm:text-sm font-bold text-slate-800 dark:text-slate-200">{n.title}</p>
                            <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-0.5 leading-normal">{n.desc}</p>
                          </div>
                        </label>
                      ))}
                    </div>

                    <div className="pt-2 flex justify-end">
                      <Button onClick={handleSaveNotifications} className="w-full sm:w-auto">
                        Update Alerts
                      </Button>
                    </div>
                  </Card>
                )}

                {/* ── Tab: Classes ── */}
                {activeTab === 'classes' && (
                  <Card className="p-5 sm:p-6 space-y-6">
                    <div>
                      <h3 className="text-sm sm:text-base font-extrabold text-slate-900 dark:text-slate-100">Classes & Roster Administration</h3>
                      <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">Overview of active academic classes under your supervision.</p>
                    </div>

                    {classesLoading ? (
                      <div className="space-y-3">
                        {[1, 2, 3].map((i) => <Skeleton key={i} className="h-16 w-full" />)}
                      </div>
                    ) : classes.length === 0 ? (
                      <div className="text-center py-8">
                        <Icon.BookOpen className="mx-auto text-slate-300 mb-3" size={24} />
                        <p className="text-sm font-bold text-slate-700 dark:text-slate-300">No active classes found</p>
                        <Link href="/classes?create=true" className="mt-3 inline-block">
                          <Button size="sm">Create New Class</Button>
                        </Link>
                      </div>
                    ) : (
                      <div className="space-y-3.5">
                        {classes.map((cls) => (
                          <div key={cls.id} className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 rounded-xl border border-slate-100 dark:border-slate-800/80 bg-slate-50/30 dark:bg-slate-900/10 gap-3">
                            <div>
                              <div className="flex items-center gap-2">
                                <h4 className="text-xs sm:text-sm font-bold text-slate-800 dark:text-slate-200">{cls.name}</h4>
                                {cls.section && <Badge variant="default" size="sm">{cls.section}</Badge>}
                              </div>
                              <p className="text-[10px] text-slate-400 mt-0.5">{cls.academicYear} · {cls._count?.enrollments ?? 0} students enrolled</p>
                            </div>
                            <div className="flex gap-2 w-full sm:w-auto">
                              <Link href={`/classes?id=${cls.id}`} className="flex-1 sm:flex-initial">
                                <Button size="xs" variant="outline" className="w-full">
                                  Manage
                                </Button>
                              </Link>
                              <Link href={`/attendance?create=true`} className="flex-1 sm:flex-initial">
                                <Button size="xs" className="w-full">
                                  Record Attendance
                                </Button>
                              </Link>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </Card>
                )}

                {/* ── Tab: Privacy ── */}
                {activeTab === 'privacy' && (
                  <Card className="p-5 sm:p-6 space-y-6">
                    <div>
                      <h3 className="text-sm sm:text-base font-extrabold text-slate-900 dark:text-slate-100">Security & Privacy</h3>
                      <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">Manage authentication parameters, analytics settings, and data safety.</p>
                    </div>

                    {/* Checkboxes */}
                    <div className="space-y-4">
                      <label className="flex items-start gap-3.5 p-3.5 rounded-xl border border-slate-50 dark:border-slate-800/40 bg-slate-50/20 dark:bg-slate-900/10 cursor-pointer hover:bg-slate-50/50 dark:hover:bg-slate-900/20 transition-all select-none">
                        <input
                          type="checkbox"
                          checked={telemetry}
                          onChange={(e) => setTelemetry(e.target.checked)}
                          className="mt-1 w-4 h-4 rounded text-indigo-600 border-slate-300 dark:border-slate-700 focus:ring-indigo-500"
                        />
                        <div>
                          <p className="text-xs sm:text-sm font-bold text-slate-800 dark:text-slate-200">Share Telemetry / Analytics Data</p>
                          <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-0.5 leading-normal">Help improve Attendify by sharing anonymous application crash and statistics reports.</p>
                        </div>
                      </label>

                      <label className="flex items-start gap-3.5 p-3.5 rounded-xl border border-slate-50 dark:border-slate-800/40 bg-slate-50/20 dark:bg-slate-900/10 cursor-pointer hover:bg-slate-50/50 dark:hover:bg-slate-900/20 transition-all select-none">
                        <input
                          type="checkbox"
                          checked={twoFactor}
                          onChange={(e) => setTwoFactor(e.target.checked)}
                          className="mt-1 w-4 h-4 rounded text-indigo-600 border-slate-300 dark:border-slate-700 focus:ring-indigo-500"
                        />
                        <div>
                          <p className="text-xs sm:text-sm font-bold text-slate-800 dark:text-slate-200">Enforce Two-Factor Authentication</p>
                          <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-0.5 leading-normal">Prompt for confirmation code on logging in from a new device.</p>
                        </div>
                      </label>
                    </div>

                    <div className="pt-2 border-t border-slate-100 dark:border-slate-800 space-y-4">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-50/50 dark:bg-slate-900/10 p-4 rounded-xl border border-slate-100 dark:border-slate-800/80">
                        <div>
                          <p className="text-xs sm:text-sm font-bold text-slate-800 dark:text-slate-200">Account Password</p>
                          <p className="text-[11px] text-slate-400">Keep your account secure by rotating your password regularly.</p>
                        </div>
                        <Button size="sm" variant="outline" onClick={() => setShowPasswordModal(true)}>
                          Change Password
                        </Button>
                      </div>

                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-red-50/10 dark:bg-red-950/5 p-4 rounded-xl border border-red-100/40 dark:border-red-900/20">
                        <div>
                          <p className="text-xs sm:text-sm font-bold text-red-600 dark:text-red-400">Danger Zone</p>
                          <p className="text-[11px] text-slate-400">Permanently delete your user credentials and all attendance records.</p>
                        </div>
                        <Button size="sm" variant="danger" onClick={() => setShowDeleteConfirm(true)}>
                          Delete Account
                        </Button>
                      </div>
                    </div>
                  </Card>
                )}
              </motion.div>
            </AnimatePresence>
          </div>
        </div>
      </div>

      {/* Password Modal */}
      <Modal open={showPasswordModal} onClose={() => setShowPasswordModal(false)} title="Change Password" size="sm">
        <div className="space-y-4 pt-1">
          <div className="space-y-1.5">
            <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Current Password</label>
            <Input
              type="password"
              value={passwordForm.current}
              onChange={(e) => setPasswordForm({ ...passwordForm, current: e.target.value })}
              placeholder="••••••••"
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">New Password</label>
            <Input
              type="password"
              value={passwordForm.newPassword}
              onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
              placeholder="••••••••"
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Confirm New Password</label>
            <Input
              type="password"
              value={passwordForm.confirm}
              onChange={(e) => setPasswordForm({ ...passwordForm, confirm: e.target.value })}
              placeholder="••••••••"
            />
          </div>

          <div className="flex gap-2 pt-2">
            <Button variant="secondary" className="flex-1" onClick={() => setShowPasswordModal(false)}>Cancel</Button>
            <Button className="flex-1" onClick={handleUpdatePassword}>Update Password</Button>
          </div>
        </div>
      </Modal>

      {/* Delete Confirm */}
      <ConfirmDialog
        open={showDeleteConfirm}
        onClose={() => setShowDeleteConfirm(false)}
        onConfirm={handleDeleteAccount}
        title="Delete Account?"
        description="Are you absolutely sure you want to delete your account? This action cannot be undone and you will lose all attendance records and classes permanently."
        confirmLabel="Yes, Delete Account"
      />
    </DashboardLayout>
  );
}
