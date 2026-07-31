import React, { useState, useEffect } from 'react';
import { User, updateProfile, updatePassword, sendPasswordResetEmail, deleteUser, signOut } from 'firebase/auth';
import { doc, getDoc, setDoc, deleteDoc } from 'firebase/firestore';
import { db, auth, handleFirestoreError, OperationType } from '@/src/lib/firebase';
import { 
  User as UserIcon, 
  Globe, 
  Moon, 
  Sun, 
  Monitor, 
  Lock, 
  Trash2, 
  AlertTriangle, 
  CheckCircle, 
  ShieldCheck, 
  Calendar, 
  Phone, 
  Mail, 
  Save, 
  KeyRound,
  X
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface ProfileSettingsProps {
  user: User | null;
  onNotification: (notification: { message: string; type: 'success' | 'info' }) => void;
  onReturnToStore: () => void;
}

export default function ProfileSettings({ user, onNotification, onReturnToStore }: ProfileSettingsProps) {
  // Personal details state
  const [firstName, setFirstName] = useState('');
  const [surname, setSurname] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [dob, setDob] = useState('');
  const [gender, setGender] = useState<string>('Male');
  const [isSavingDetails, setIsSavingDetails] = useState(false);

  // Localization state
  const [language, setLanguage] = useState<string>(() => localStorage.getItem('app_language') || 'en');

  // Theme state
  const [theme, setTheme] = useState<'light' | 'dark' | 'system'>(() => 
    (localStorage.getItem('app_theme') as 'light' | 'dark' | 'system') || 'system'
  );

  // Password change state
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isUpdatingPassword, setIsUpdatingPassword] = useState(false);
  const [passwordSuccessMsg, setPasswordSuccessMsg] = useState('');
  const [passwordErrorMsg, setPasswordErrorMsg] = useState('');

  // Delete account state
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [isDeletingAccount, setIsDeletingAccount] = useState(false);

  // Load existing user profile from Firestore and Auth
  useEffect(() => {
    if (!user) return;

    // Split display name into first name and surname
    const parts = (user.displayName || '').trim().split(' ');
    setFirstName(parts[0] || '');
    setSurname(parts.slice(1).join(' ') || '');
    setEmail(user.email || '');

    const fetchProfile = async () => {
      try {
        const userDocRef = doc(db, 'users', user.uid);
        const userSnap = await getDoc(userDocRef);
        if (userSnap.exists()) {
          const data = userSnap.data();
          if (data.firstName) setFirstName(data.firstName);
          if (data.surname) setSurname(data.surname);
          if (data.phone) setPhone(data.phone);
          if (data.dob) setDob(data.dob);
          if (data.gender) setGender(data.gender);
          if (data.language) {
            setLanguage(data.language);
            localStorage.setItem('app_language', data.language);
          }
          if (data.theme) {
            setTheme(data.theme);
            localStorage.setItem('app_theme', data.theme);
          }
        }
      } catch (err) {
        console.error("Error fetching user profile:", err);
      }
    };

    fetchProfile();
  }, [user]);

  // Handle saving personal details
  const handleSavePersonalDetails = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setIsSavingDetails(true);

    try {
      const fullName = `${firstName.trim()} ${surname.trim()}`.trim();

      // Update Firebase Auth display name if changed
      if (fullName && fullName !== user.displayName) {
        await updateProfile(user, { displayName: fullName });
      }

      // Update Firestore document
      const userDocRef = doc(db, 'users', user.uid);
      await setDoc(userDocRef, {
        firstName: firstName.trim(),
        surname: surname.trim(),
        displayName: fullName,
        email: email.trim(),
        phone: phone.trim(),
        dob,
        gender,
        updatedAt: new Date().toISOString()
      }, { merge: true });

      onNotification({
        message: 'Personal details updated successfully!',
        type: 'success'
      });
    } catch (err: any) {
      console.error("Failed to save profile:", err);
      onNotification({
        message: err.message || 'Failed to update personal details',
        type: 'info'
      });
    } finally {
      setIsSavingDetails(false);
    }
  };

  // Handle Language selection change
  const handleLanguageChange = async (newLang: string) => {
    setLanguage(newLang);
    localStorage.setItem('app_language', newLang);

    if (user) {
      try {
        await setDoc(doc(db, 'users', user.uid), { language: newLang }, { merge: true });
      } catch (e) {
        console.error("Failed to save language pref:", e);
        handleFirestoreError(e, OperationType.UPDATE, `users/${user.uid}`);
      }
    }

    onNotification({
      message: `Language updated to ${newLang.toUpperCase()}`,
      type: 'success'
    });
  };

  // Handle Theme selection change
  const handleThemeChange = async (newTheme: 'light' | 'dark' | 'system') => {
    setTheme(newTheme);
    localStorage.setItem('app_theme', newTheme);

    if (newTheme === 'dark') {
      document.documentElement.classList.add('dark');
    } else if (newTheme === 'light') {
      document.documentElement.classList.remove('dark');
    } else {
      // System default
      if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
    }

    if (user) {
      try {
        await setDoc(doc(db, 'users', user.uid), { theme: newTheme }, { merge: true });
      } catch (e) {
        console.error("Failed to save theme pref:", e);
        handleFirestoreError(e, OperationType.UPDATE, `users/${user.uid}`);
      }
    }

    onNotification({
      message: `Theme updated to ${newTheme.toUpperCase()} mode`,
      type: 'success'
    });
  };

  // Handle Password update / reset
  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordErrorMsg('');
    setPasswordSuccessMsg('');

    if (!user) return;

    if (!newPassword || newPassword.length < 6) {
      setPasswordErrorMsg('Password must be at least 6 characters long.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setPasswordErrorMsg('Passwords do not match.');
      return;
    }

    setIsUpdatingPassword(true);

    try {
      if (user.email && user.providerData.some(p => p.providerId === 'password')) {
        await updatePassword(user, newPassword);
        setPasswordSuccessMsg('Password changed successfully!');
        setNewPassword('');
        setConfirmPassword('');
        onNotification({
          message: 'Password changed successfully!',
          type: 'success'
        });
      } else if (user.email) {
        // Send reset email if logged in via OAuth or custom token
        await sendPasswordResetEmail(auth, user.email);
        setPasswordSuccessMsg(`Password reset email sent to ${user.email}`);
        setNewPassword('');
        setConfirmPassword('');
        onNotification({
          message: `Password reset email dispatched to ${user.email}`,
          type: 'success'
        });
      }
    } catch (err: any) {
      console.error("Password change error:", err);
      if (err.code === 'auth/requires-recent-login' && user.email) {
        try {
          await sendPasswordResetEmail(auth, user.email);
          setPasswordSuccessMsg(`Security notice: Password reset link sent to ${user.email}`);
          onNotification({
            message: `Password reset link sent to ${user.email}`,
            type: 'info'
          });
        } catch (resetErr: any) {
          setPasswordErrorMsg('Failed to process password request. Please log out and sign back in.');
        }
      } else {
        setPasswordErrorMsg(err.message || 'Failed to update password');
      }
    } finally {
      setIsUpdatingPassword(false);
    }
  };

  // Handle Account Deletion
  const handleDeleteAccount = async () => {
    if (!user) return;
    setIsDeletingAccount(true);

    try {
      // 1. Delete user profile from Firestore
      await deleteDoc(doc(db, 'users', user.uid));

      // 2. Delete user account from Firebase Auth
      await deleteUser(user);

      onNotification({
        message: 'Your account has been permanently deleted.',
        type: 'info'
      });

      onReturnToStore();
    } catch (err: any) {
      console.error("Error deleting account:", err);
      if (err.code === 'auth/requires-recent-login') {
        // Sign out user if re-auth required
        await signOut(auth);
        onNotification({
          message: 'Profile removed. Please sign in again to finalize total auth deletion.',
          type: 'info'
        });
        onReturnToStore();
      } else {
        onNotification({
          message: err.message || 'Failed to delete account completely',
          type: 'info'
        });
      }
    } finally {
      setIsDeletingAccount(false);
      setShowDeleteModal(false);
    }
  };

  return (
    <div className="space-y-8 max-w-4xl mx-auto pb-16 font-sans">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-slate-200">
        <div>
          <h1 className="text-3xl md:text-4xl font-light text-slate-900 leading-tight italic tracking-tight">
            Profile & Account Management
          </h1>
          <p className="text-slate-500 text-xs font-bold uppercase tracking-widest mt-1">
            Personal Details, Localization, Theme & Security Controls
          </p>
        </div>
        <button
          onClick={onReturnToStore}
          className="px-5 py-2.5 bg-slate-900 text-white rounded-xl text-xs font-bold uppercase tracking-widest hover:bg-indigo-600 transition-all shadow-sm w-fit"
        >
          Return to Store
        </button>
      </div>

      {/* 1. Personal Details Section */}
      <section className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 md:p-8 space-y-6">
        <div className="flex items-center gap-3 pb-4 border-b border-slate-100">
          <div className="p-2.5 bg-indigo-50 rounded-2xl text-indigo-600">
            <UserIcon className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-lg font-black text-slate-900 tracking-tight">Personal Details</h2>
            <p className="text-xs text-slate-400 font-medium">Update your profile info and contact records</p>
          </div>
        </div>

        <form onSubmit={handleSavePersonalDetails} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase text-slate-500 tracking-widest block">First Name</label>
              <input
                type="text"
                placeholder="e.g. Uncle"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold text-slate-900 focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all"
                required
              />
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase text-slate-500 tracking-widest block">Surname (Last Name)</label>
              <input
                type="text"
                placeholder="e.g. Tee"
                value={surname}
                onChange={(e) => setSurname(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold text-slate-900 focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all"
                required
              />
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase text-slate-500 tracking-widest block flex items-center gap-1.5">
                <Mail className="w-3.5 h-3.5 text-slate-400" /> Email Address
              </label>
              <input
                type="email"
                placeholder="e.g. user@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold text-slate-900 focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all"
                required
              />
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase text-slate-500 tracking-widest block flex items-center gap-1.5">
                <Phone className="w-3.5 h-3.5 text-slate-400" /> Phone Number
              </label>
              <input
                type="tel"
                placeholder="e.g. +234 813 864 2942"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold text-slate-900 focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all"
              />
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase text-slate-500 tracking-widest block flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-slate-400" /> Date of Birth
              </label>
              <input
                type="date"
                value={dob}
                onChange={(e) => setDob(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold text-slate-900 focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all"
              />
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase text-slate-500 tracking-widest block">Gender</label>
              <select
                value={gender}
                onChange={(e) => setGender(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold text-slate-900 focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all cursor-pointer"
              >
                <option value="Male">Male</option>
                <option value="Female">Female</option>
                <option value="Prefer not to say">Prefer not to say</option>
                <option value="Other">Other</option>
              </select>
            </div>
          </div>

          <div className="pt-2 flex justify-end">
            <button
              type="submit"
              disabled={isSavingDetails}
              className="flex items-center gap-2 px-6 py-3 bg-slate-900 hover:bg-indigo-600 text-white font-bold text-xs uppercase tracking-widest rounded-xl transition-all shadow-md active:scale-95 disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              {isSavingDetails ? 'Saving...' : 'Save Personal Details'}
            </button>
          </div>
        </form>
      </section>

      {/* 2. Preferences & Localization Section */}
      <section className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 md:p-8 space-y-6">
        <div className="flex items-center gap-3 pb-4 border-b border-slate-100">
          <div className="p-2.5 bg-emerald-50 rounded-2xl text-emerald-600">
            <Globe className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-lg font-black text-slate-900 tracking-tight">Preferences & Localization</h2>
            <p className="text-xs text-slate-400 font-medium">Select your preferred system language</p>
          </div>
        </div>

        <div className="space-y-4">
          <label className="text-[10px] font-black uppercase text-slate-500 tracking-widest block">System Language</label>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {[
              { code: 'en', name: 'English', native: 'English' },
              { code: 'ar', name: 'Arabic', native: 'العربية' },
              { code: 'fr', name: 'French', native: 'Français' },
              { code: 'ur', name: 'Urdu', native: 'اردو' }
            ].map((lang) => (
              <button
                key={lang.code}
                type="button"
                onClick={() => handleLanguageChange(lang.code)}
                className={`p-4 rounded-2xl border text-left transition-all ${
                  language === lang.code
                    ? 'border-indigo-600 bg-indigo-50/70 text-indigo-950 ring-2 ring-indigo-600/20'
                    : 'border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-700'
                }`}
              >
                <p className="text-xs font-black uppercase tracking-wider">{lang.name}</p>
                <p className="text-sm font-medium text-slate-500 mt-1">{lang.native}</p>
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* 3. Theme Selector Section */}
      <section className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 md:p-8 space-y-6">
        <div className="flex items-center gap-3 pb-4 border-b border-slate-100">
          <div className="p-2.5 bg-amber-50 rounded-2xl text-amber-600">
            <Sun className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-lg font-black text-slate-900 tracking-tight">Appearance & Theme</h2>
            <p className="text-xs text-slate-400 font-medium">Customize interface theme for comfortable viewing</p>
          </div>
        </div>

        <div className="space-y-4">
          <label className="text-[10px] font-black uppercase text-slate-500 tracking-widest block">Theme Mode</label>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[
              { id: 'light', label: 'Light Mode', desc: 'Clean high-contrast light aesthetics', icon: Sun },
              { id: 'dark', label: 'Dark Mode', desc: 'Eye-friendly midnight dark layout', icon: Moon },
              { id: 'system', label: 'System Default', desc: 'Sync automatically with OS theme settings', icon: Monitor }
            ].map((item) => {
              const IconComp = item.icon;
              const isSelected = theme === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => handleThemeChange(item.id as 'light' | 'dark' | 'system')}
                  className={`p-5 rounded-2xl border text-left transition-all flex flex-col justify-between gap-4 ${
                    isSelected
                      ? 'border-indigo-600 bg-indigo-50/60 text-slate-900 ring-2 ring-indigo-600/20 shadow-sm'
                      : 'border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-700'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <IconComp className={`w-5 h-5 ${isSelected ? 'text-indigo-600' : 'text-slate-400'}`} />
                    {isSelected && <CheckCircle className="w-4 h-4 text-indigo-600" />}
                  </div>
                  <div>
                    <p className="text-xs font-black uppercase tracking-wider">{item.label}</p>
                    <p className="text-[11px] font-medium text-slate-500 mt-0.5">{item.desc}</p>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </section>

      {/* 4. Security & Account Controls Section */}
      <section className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 md:p-8 space-y-8">
        <div className="flex items-center gap-3 pb-4 border-b border-slate-100">
          <div className="p-2.5 bg-blue-50 rounded-2xl text-blue-600">
            <Lock className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-lg font-black text-slate-900 tracking-tight">Security & Account Controls</h2>
            <p className="text-xs text-slate-400 font-medium">Manage credentials & permanent account options</p>
          </div>
        </div>

        {/* Change Password Sub-section */}
        <div className="space-y-4">
          <h3 className="text-xs font-black uppercase tracking-widest text-slate-900 flex items-center gap-2">
            <KeyRound className="w-4 h-4 text-indigo-600" /> Change Password
          </h3>
          <p className="text-xs text-slate-500">
            Set a new secure password or send a password reset link to your registered email address.
          </p>

          {passwordSuccessMsg && (
            <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs font-bold flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{passwordSuccessMsg}</span>
            </div>
          )}

          {passwordErrorMsg && (
            <div className="p-4 bg-red-50 border border-red-200 text-red-800 rounded-xl text-xs font-bold flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-red-600 shrink-0" />
              <span>{passwordErrorMsg}</span>
            </div>
          )}

          <form onSubmit={handleUpdatePassword} className="space-y-4 max-w-lg">
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase text-slate-500 tracking-widest block">New Password</label>
              <input
                type="password"
                placeholder="Minimum 6 characters"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold text-slate-900 focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all"
              />
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase text-slate-500 tracking-widest block">Confirm New Password</label>
              <input
                type="password"
                placeholder="Re-enter new password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold text-slate-900 focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all"
              />
            </div>

            <button
              type="submit"
              disabled={isUpdatingPassword}
              className="px-6 py-3 bg-slate-900 hover:bg-indigo-600 text-white font-bold text-xs uppercase tracking-widest rounded-xl transition-all shadow-md active:scale-95 disabled:opacity-50"
            >
              {isUpdatingPassword ? 'Processing...' : 'Update Password / Send Reset Link'}
            </button>
          </form>
        </div>

        {/* Account Deletion Sub-section */}
        <div className="pt-6 border-t border-slate-100 space-y-4">
          <div className="p-6 bg-red-50/60 rounded-2xl border border-red-100 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h3 className="text-sm font-black uppercase text-red-900 tracking-wider flex items-center gap-2">
                <Trash2 className="w-4 h-4 text-red-600" /> Danger Zone: Delete Account Permanently
              </h3>
              <p className="text-xs text-red-700 mt-1 max-w-xl">
                Permanently erase your account records and custom profile preferences. This action cannot be undone.
              </p>
            </div>
            <button
              type="button"
              onClick={() => setShowDeleteModal(true)}
              className="px-5 py-3 bg-red-600 hover:bg-red-700 text-white font-black text-xs uppercase tracking-widest rounded-xl transition-all shadow-md shrink-0 active:scale-95"
            >
              Delete Account Permanently
            </button>
          </div>
        </div>
      </section>

      {/* Account Deletion Confirmation Modal */}
      <AnimatePresence>
        {showDeleteModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-3xl max-w-md w-full p-6 md:p-8 shadow-2xl border border-slate-100 space-y-6"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-red-100 rounded-2xl text-red-600">
                    <AlertTriangle className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="text-lg font-black text-slate-900 tracking-tight">Confirm Account Deletion</h3>
                    <p className="text-xs text-slate-400 font-medium">Irreversible security action</p>
                  </div>
                </div>
                <button
                  onClick={() => setShowDeleteModal(false)}
                  className="p-2 text-slate-400 hover:text-slate-600 rounded-xl hover:bg-slate-100 transition-all"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="p-4 bg-red-50 rounded-2xl border border-red-100 text-xs text-red-900 space-y-2">
                <p className="font-bold">Are you absolutely sure you want to delete your account?</p>
                <p>
                  This action will remove your account profile and credentials from Uncle Tee Automobiles. Saved cart items and previous order logs will remain in public archives for tax record keeping.
                </p>
              </div>

              <div className="flex items-center gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowDeleteModal(false)}
                  className="flex-1 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs uppercase tracking-widest rounded-xl transition-all"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleDeleteAccount}
                  disabled={isDeletingAccount}
                  className="flex-1 py-3 bg-red-600 hover:bg-red-700 text-white font-black text-xs uppercase tracking-widest rounded-xl transition-all shadow-lg shadow-red-200 active:scale-95 disabled:opacity-50"
                >
                  {isDeletingAccount ? 'Deleting...' : 'Confirm Permanent Deletion'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
