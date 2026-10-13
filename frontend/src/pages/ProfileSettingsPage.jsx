import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  User,
  Shield,
  KeyRound,
  Bell,
  Lock,
  Eye,
  EyeOff,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Sparkles,
  ArrowRight,
  RefreshCw,
  Check,
  X,
  Mail,
  Sliders,
  Database,
  Cpu,
  Trash2,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useNotifications } from '../context/NotificationContext';
import { changePassword, updateProfile } from '../services/api';
import { formatIndiaTime } from './HistoryPage';

export default function ProfileSettingsPage() {
  const { user, refreshUser, logout } = useAuth();
  const {
    notifications,
    unreadCount,
    settings: notifSettings,
    markAsRead,
    markAllAsRead,
    clearAll: clearAllNotifications,
    updateSetting,
  } = useNotifications();

  // Active Tab: 'profile' | 'password' | 'notifications' | 'theme'
  const [activeTab, setActiveTab] = useState('profile');

  // Profile Edit State
  const [fullName, setFullName] = useState(user?.full_name || '');
  const [profileSaving, setProfileSaving] = useState(false);
  const [profileSuccess, setProfileSuccess] = useState('');
  const [profileError, setProfileError] = useState('');

  // Password Change State
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmNewPassword, setShowConfirmNewPassword] = useState(false);
  const [passwordSaving, setPasswordSaving] = useState(false);
  const [passwordSuccess, setPasswordSuccess] = useState('');
  const [passwordError, setPasswordError] = useState('');

  // Password Strength Evaluation for New Password
  const hasMinLen = newPassword.length >= 8;
  const hasUpper = /[A-Z]/.test(newPassword);
  const hasLower = /[a-z]/.test(newPassword);
  const hasNumber = /\d/.test(newPassword);
  const hasSpecial = /[!@#$%^&*(),.?":{}|<>\-_+=~`]/.test(newPassword);
  const criteriaMet = [hasMinLen, hasUpper, hasLower, hasNumber, hasSpecial].filter(Boolean).length;

  let strengthLabel = 'Weak';
  let strengthColor = 'bg-rose-500';
  let strengthPercent = '20%';

  if (criteriaMet === 5) {
    strengthLabel = 'Strong';
    strengthColor = 'bg-emerald-400';
    strengthPercent = '100%';
  } else if (criteriaMet >= 3) {
    strengthLabel = 'Good';
    strengthColor = 'bg-emerald-500';
    strengthPercent = '65%';
  } else if (criteriaMet >= 2) {
    strengthLabel = 'Fair';
    strengthColor = 'bg-amber-400';
    strengthPercent = '40%';
  }

  // Handle Profile Update
  const handleProfileSubmit = async (e) => {
    e.preventDefault();
    setProfileError('');
    setProfileSuccess('');

    if (!fullName.trim() || fullName.trim().length < 2) {
      setProfileError('Full name must be at least 2 characters.');
      return;
    }

    setProfileSaving(true);
    try {
      await updateProfile({ fullName: fullName.trim() });
      await refreshUser();
      setProfileSuccess('Profile name updated successfully.');
    } catch (err) {
      setProfileError(err.message || 'Failed to update profile.');
    } finally {
      setProfileSaving(false);
    }
  };

  // Handle Password Change
  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    setPasswordError('');
    setPasswordSuccess('');

    if (!currentPassword) {
      setPasswordError('Please provide your current password.');
      return;
    }
    if (criteriaMet < 5) {
      setPasswordError('New password does not satisfy all complexity requirements.');
      return;
    }
    if (newPassword !== confirmNewPassword) {
      setPasswordError('New passwords do not match.');
      return;
    }

    setPasswordSaving(true);
    try {
      await changePassword({ currentPassword, newPassword });
      setPasswordSuccess('Password changed successfully! Keep your credentials secure.');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmNewPassword('');
    } catch (err) {
      setPasswordError(err.message || 'Failed to change password.');
    } finally {
      setPasswordSaving(false);
    }
  };

  const getInitials = (name) => {
    if (!name) return 'SC';
    const parts = name.trim().split(' ');
    if (parts.length >= 2) {
      return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    }
    return name.slice(0, 2).toUpperCase();
  };

  return (
    <div className="space-y-8 max-w-6xl mx-auto">
      {/* Top Profile Banner Card */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-[#040e06] via-[#06180a] to-[#040e06] border border-emerald-500/20 p-6 sm:p-8 shadow-xl">
        <div className="absolute top-0 right-0 w-80 h-80 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
          <div className="flex items-center gap-5">
            {/* User Avatar Initial */}
            <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-gradient-to-br from-emerald-400 via-emerald-600 to-emerald-800 p-0.5 shadow-lg shadow-emerald-950/60 flex items-center justify-center shrink-0">
              <div className="w-full h-full bg-[#030804] rounded-[14px] flex items-center justify-center text-emerald-400 font-extrabold text-2xl sm:text-3xl font-mono">
                {getInitials(user?.full_name)}
              </div>
            </div>

            <div className="space-y-1">
              <div className="flex items-center gap-2.5 flex-wrap">
                <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
                  {user?.full_name || 'Cryptographic Analyst'}
                </h1>
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 text-xs font-mono">
                  <CheckCircle2 className="w-3 h-3" />
                  Verified Analyst
                </span>
              </div>
              <p className="text-xs sm:text-sm text-slate-400 flex items-center gap-2">
                <Mail className="w-3.5 h-3.5 text-slate-500" />
                {user?.email || 'analyst@securecipher.org'}
              </p>
              <p className="text-[11px] text-slate-500 font-mono">
                Member ID: #{user?.id || 1} • SecureCipher Enterprise Cryptography Workspace
              </p>
            </div>
          </div>
        </div>

        {/* Tab Buttons */}
        <div className="relative z-10 flex items-center gap-2 pt-6 mt-6 border-t border-emerald-500/15 overflow-x-auto">
          <button
            onClick={() => setActiveTab('profile')}
            className={`px-4 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 transition-all cursor-pointer ${
              activeTab === 'profile'
                ? 'bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/20'
                : 'bg-[#040e06]/60 text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <User className="w-3.5 h-3.5" />
            Account Details
          </button>

          <button
            onClick={() => setActiveTab('password')}
            className={`px-4 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 transition-all cursor-pointer ${
              activeTab === 'password'
                ? 'bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/20'
                : 'bg-[#040e06]/60 text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <Lock className="w-3.5 h-3.5" />
            Password & Security
          </button>

          <button
            onClick={() => setActiveTab('notifications')}
            className={`px-4 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 transition-all cursor-pointer relative ${
              activeTab === 'notifications'
                ? 'bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/20'
                : 'bg-[#040e06]/60 text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <Bell className="w-3.5 h-3.5" />
            Notifications
            {unreadCount > 0 && (
              <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse ml-0.5" />
            )}
          </button>
        </div>
      </div>

      {/* ============================================================== */}
      {/* TAB 1: ACCOUNT DETAILS                                         */}
      {/* ============================================================== */}
      {activeTab === 'profile' && (
        <div className="grid md:grid-cols-12 gap-6">
          <div className="md:col-span-8 p-6 sm:p-8 rounded-3xl bg-[#061208]/90 border border-emerald-500/20 space-y-6">
            <div>
              <h2 className="text-lg font-bold text-white">Profile Information</h2>
              <p className="text-xs text-slate-400 mt-1">
                Update your account details and display name.
              </p>
            </div>

            {profileSuccess && (
              <div className="p-3.5 rounded-xl bg-emerald-950/40 border border-emerald-500/30 text-emerald-300 text-xs flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <span>{profileSuccess}</span>
              </div>
            )}
            {profileError && (
              <div className="p-3.5 rounded-xl bg-rose-950/40 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-rose-400" />
                <span>{profileError}</span>
              </div>
            )}

            <form onSubmit={handleProfileSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">
                  Full Name
                </label>
                <input
                  type="text"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="w-full bg-[#030804] border border-emerald-500/20 focus:border-emerald-400 rounded-xl px-4 py-2.5 text-sm text-white outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">
                  Email Address (Primary Identity)
                </label>
                <input
                  type="email"
                  disabled
                  value={user?.email || ''}
                  className="w-full bg-[#040e06]/60 border border-emerald-500/20 rounded-xl px-4 py-2.5 text-sm text-slate-400 cursor-not-allowed"
                />
                <p className="text-[11px] text-slate-500 mt-1">
                  Email was verified using a secure 6-digit HMAC-SHA256 one-time code.
                </p>
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={profileSaving}
                  className="px-6 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs shadow-md shadow-emerald-500/20 transition-all flex items-center gap-2 disabled:opacity-50 cursor-pointer"
                >
                  {profileSaving ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      <span>Saving Changes...</span>
                    </>
                  ) : (
                    <>
                      <span>Save Changes</span>
                      <Check className="w-3.5 h-3.5" />
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>

          <div className="md:col-span-4 space-y-6">
            <div className="p-6 rounded-3xl bg-[#061208]/90 border border-emerald-500/20 space-y-4">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Shield className="w-4 h-4 text-emerald-400" />
                Security Specifications
              </h3>
              <ul className="text-xs text-slate-400 space-y-2.5 font-mono">
                <li className="flex items-center justify-between border-b border-emerald-500/10 pb-2">
                  <span>Hash Algorithm:</span>
                  <span className="text-emerald-400 font-bold">Bcrypt (12 Rounds)</span>
                </li>
                <li className="flex items-center justify-between border-b border-emerald-500/10 pb-2">
                  <span>Session Token:</span>
                  <span className="text-emerald-400 font-bold">JWT (HMAC-SHA256)</span>
                </li>
                <li className="flex items-center justify-between border-b border-emerald-500/10 pb-2">
                  <span>Database:</span>
                  <span className="text-emerald-400 font-bold">PostgreSQL</span>
                </li>
                <li className="flex items-center justify-between">
                  <span>Key Storage:</span>
                  <span className="text-emerald-400 font-bold">Zero-Persistence</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* TAB 2: PASSWORD CHANGING                                       */}
      {/* ============================================================== */}
      {activeTab === 'password' && (
        <div className="grid md:grid-cols-12 gap-6">
          <div className="md:col-span-8 p-6 sm:p-8 rounded-3xl bg-[#061208]/90 border border-emerald-500/20 space-y-6">
            <div>
              <h2 className="text-lg font-bold text-white">Change Account Password</h2>
              <p className="text-xs text-slate-400 mt-1">
                Verify your current password and establish a new high-entropy credential.
              </p>
            </div>

            {passwordSuccess && (
              <div className="p-3.5 rounded-xl bg-emerald-950/40 border border-emerald-500/30 text-emerald-300 text-xs flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <span>{passwordSuccess}</span>
              </div>
            )}
            {passwordError && (
              <div className="p-3.5 rounded-xl bg-rose-950/40 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-rose-400" />
                <span>{passwordError}</span>
              </div>
            )}

            <form onSubmit={handlePasswordSubmit} className="space-y-4">
              {/* Current Password */}
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">
                  Current Password
                </label>
                <div className="relative">
                  <input
                    type={showCurrentPassword ? 'text' : 'password'}
                    required
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    placeholder="••••••••••••"
                    className="w-full bg-[#030804] border border-emerald-500/20 focus:border-emerald-400 rounded-xl px-4 py-2.5 pr-11 text-sm text-white font-mono outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                    className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-500 hover:text-emerald-400"
                  >
                    {showCurrentPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* New Password */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs font-medium text-slate-300">
                    New Password
                  </label>
                  {newPassword && (
                    <span className="text-[11px] font-mono font-semibold text-slate-400">
                      Strength: <span className="text-emerald-400">{strengthLabel}</span>
                    </span>
                  )}
                </div>
                <div className="relative">
                  <input
                    type={showNewPassword ? 'text' : 'password'}
                    required
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="••••••••••••"
                    className="w-full bg-[#030804] border border-emerald-500/20 focus:border-emerald-400 rounded-xl px-4 py-2.5 pr-11 text-sm text-white font-mono outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                    className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-500 hover:text-emerald-400"
                  >
                    {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>

                {/* Progress bar */}
                {newPassword && (
                  <div className="w-full h-1.5 bg-slate-800 rounded-full mt-2 overflow-hidden">
                    <div
                      className={`h-full ${strengthColor} transition-all duration-300`}
                      style={{ width: strengthPercent }}
                    />
                  </div>
                )}
              </div>

              {/* Confirm New Password */}
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">
                  Confirm New Password
                </label>
                <div className="relative">
                  <input
                    type={showConfirmNewPassword ? 'text' : 'password'}
                    required
                    value={confirmNewPassword}
                    onChange={(e) => setConfirmNewPassword(e.target.value)}
                    placeholder="••••••••••••"
                    className="w-full bg-[#030804] border border-emerald-500/20 focus:border-emerald-400 rounded-xl px-4 py-2.5 pr-11 text-sm text-white font-mono outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmNewPassword(!showConfirmNewPassword)}
                    className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-500 hover:text-emerald-400"
                  >
                    {showConfirmNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Requirements Checklist */}
              <div className="p-3.5 rounded-xl bg-[#030804] border border-emerald-500/15 space-y-1.5 text-[11px] font-mono">
                <p className="text-slate-400 font-semibold mb-1 text-[10px] uppercase tracking-wider">
                  Password Complexity Rules:
                </p>
                <div className="grid grid-cols-2 gap-1.5">
                  <div className={`flex items-center gap-1.5 ${hasMinLen ? 'text-emerald-400' : 'text-slate-500'}`}>
                    {hasMinLen ? <Check className="w-3 h-3 text-emerald-400" /> : <X className="w-3 h-3 text-slate-600" />}
                    <span>8+ Characters</span>
                  </div>
                  <div className={`flex items-center gap-1.5 ${hasUpper ? 'text-emerald-400' : 'text-slate-500'}`}>
                    {hasUpper ? <Check className="w-3 h-3 text-emerald-400" /> : <X className="w-3 h-3 text-slate-600" />}
                    <span>Uppercase (A-Z)</span>
                  </div>
                  <div className={`flex items-center gap-1.5 ${hasLower ? 'text-emerald-400' : 'text-slate-500'}`}>
                    {hasLower ? <Check className="w-3 h-3 text-emerald-400" /> : <X className="w-3 h-3 text-slate-600" />}
                    <span>Lowercase (a-z)</span>
                  </div>
                  <div className={`flex items-center gap-1.5 ${hasNumber ? 'text-emerald-400' : 'text-slate-500'}`}>
                    {hasNumber ? <Check className="w-3 h-3 text-emerald-400" /> : <X className="w-3 h-3 text-slate-600" />}
                    <span>Numeric Digit (0-9)</span>
                  </div>
                  <div className={`flex items-center gap-1.5 col-span-2 ${hasSpecial ? 'text-emerald-400' : 'text-slate-500'}`}>
                    {hasSpecial ? <Check className="w-3 h-3 text-emerald-400" /> : <X className="w-3 h-3 text-slate-600" />}
                    <span>Special Symbol (!@#$%^&*)</span>
                  </div>
                </div>
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={passwordSaving}
                  className="px-6 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs shadow-md shadow-emerald-500/20 transition-all flex items-center gap-2 disabled:opacity-50 cursor-pointer"
                >
                  {passwordSaving ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      <span>Updating Password...</span>
                    </>
                  ) : (
                    <>
                      <span>Update Password</span>
                      <Lock className="w-3.5 h-3.5" />
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>

          <div className="md:col-span-4 p-6 rounded-3xl bg-[#061208]/90 border border-emerald-500/20 space-y-4">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <KeyRound className="w-4 h-4 text-emerald-400" />
              Cryptographic Safeguards
            </h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              When changing your password, your plaintext input is hashed using random 12-round bcrypt salt before persisting to PostgreSQL. The current session remains valid.
            </p>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* TAB 3: NOTIFICATIONS CENTER                                    */}
      {/* ============================================================== */}
      {activeTab === 'notifications' && (
        <div className="grid md:grid-cols-12 gap-6">
          <div className="md:col-span-8 p-6 sm:p-8 rounded-3xl bg-[#061208]/90 border border-emerald-500/20 space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-bold text-white flex items-center gap-2">
                  <Bell className="w-5 h-5 text-emerald-400" />
                  Security & Activity Notifications
                </h2>
                <p className="text-xs text-slate-400 mt-1">
                  Real-time events and audit telemetry generated across SecureCipher.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={markAllAsRead}
                  className="px-3 py-1.5 rounded-lg bg-[#040e06] border border-emerald-500/20 text-[11px] font-mono text-slate-300 hover:text-white"
                >
                  Mark All Read
                </button>
                <button
                  onClick={clearAllNotifications}
                  className="px-3 py-1.5 rounded-lg bg-[#040e06] border border-emerald-500/20 text-[11px] font-mono text-rose-400 hover:text-rose-300"
                >
                  Clear All
                </button>
              </div>
            </div>

            {/* Notification Items List */}
            <div className="space-y-3">
              {notifications.length === 0 ? (
                <div className="p-8 text-center text-slate-500 text-xs font-mono">
                  No notifications recorded at this time.
                </div>
              ) : (
                notifications.map((notif) => (
                  <div
                    key={notif.id}
                    onClick={() => markAsRead(notif.id)}
                    className={`p-4 rounded-2xl border transition-all cursor-pointer ${
                      notif.read
                        ? 'bg-[#030804] border-emerald-500/10 text-slate-400'
                        : 'bg-emerald-950/20 border-emerald-500/30 text-white shadow-md'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span
                            className={`w-2 h-2 rounded-full ${
                              notif.type === 'success'
                                ? 'bg-emerald-400'
                                : notif.type === 'warning'
                                ? 'bg-amber-400'
                                : 'bg-blue-400'
                            }`}
                          />
                          <h4 className="text-xs font-bold text-white">{notif.title}</h4>
                          {!notif.read && (
                            <span className="text-[10px] font-mono uppercase px-1.5 py-0.2 rounded bg-emerald-500/20 text-emerald-300">
                              New
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-slate-300/90 leading-relaxed">
                          {notif.message}
                        </p>
                      </div>
                      <span className="text-[10px] font-mono text-slate-500 shrink-0">
                        {formatIndiaTime(notif.timestamp)}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Notification Preference Toggles */}
          <div className="md:col-span-4 p-6 rounded-3xl bg-[#061208]/90 border border-emerald-500/20 space-y-4">
            <h3 className="text-sm font-bold text-white">Alert Preferences</h3>
            <div className="space-y-3 text-xs">
              <label className="flex items-center justify-between p-3 rounded-xl bg-[#030804] border border-emerald-500/15 cursor-pointer">
                <span>Security & Login Alerts</span>
                <input
                  type="checkbox"
                  checked={notifSettings.securityAlerts}
                  onChange={(e) => updateSetting('securityAlerts', e.target.checked)}
                  className="w-4 h-4 text-emerald-500 rounded border-emerald-500/40 bg-[#040e06]"
                />
              </label>

              <label className="flex items-center justify-between p-3 rounded-xl bg-[#030804] border border-emerald-500/15 cursor-pointer">
                <span>Database Sync Events</span>
                <input
                  type="checkbox"
                  checked={notifSettings.auditLogs}
                  onChange={(e) => updateSetting('auditLogs', e.target.checked)}
                  className="w-4 h-4 text-emerald-500 rounded border-emerald-500/40 bg-[#040e06]"
                />
              </label>

              <label className="flex items-center justify-between p-3 rounded-xl bg-[#030804] border border-emerald-500/15 cursor-pointer">
                <span>Cryptographic Execution Warnings</span>
                <input
                  type="checkbox"
                  checked={notifSettings.executionAlerts}
                  onChange={(e) => updateSetting('executionAlerts', e.target.checked)}
                  className="w-4 h-4 text-emerald-500 rounded border-emerald-500/40 bg-[#040e06]"
                />
              </label>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
