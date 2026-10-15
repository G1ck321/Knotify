import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  User, 
  Mail,
  Lock,
  Phone,
  Eye, 
  EyeOff, 
  AlertCircle,
  X,
  Sparkles
} from 'lucide-react';
import ForgotPasswordModal from './ForgotPasswordModal';
import { persistAuthSession } from '../lib/authStorage';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (user: any) => void;
  pendingActionName?: string;
}

const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL ?? 'http://127.0.0.1:5500').replace(/\/$/, '');

async function requestJson<T>(path: string, body: unknown): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });

  const payload = await response.json().catch(() => null);

  if (!response.ok) {
    const message = payload?.detail || payload?.message || 'Authentication request failed';
    throw new Error(message);
  }

  return payload as T;
}

function normalizeUser(user: any) {
  if (!user) return user;
  const name = user.name ?? user.full_name ?? user.fullName ?? '';
  return {
    ...user,
    name,
    full_name: user.full_name ?? name,
  };
}

export default function AuthModal({
  isOpen,
  onClose,
  onSuccess,
}: AuthModalProps) {
  const [isLogin, setIsLogin] = useState(true);
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // Registration Form States
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [telegramPhone, setTelegramPhone] = useState('');
  const [whatsApp, setWhatsApp] = useState('');
  const [parentsNumber, setParentsNumber] = useState('');

  // Login Form States
  const [loginUsername, setLoginUsername] = useState('');
  const [loginPassword, setLoginPassword] = useState('');

  if (!isOpen) return null;

  if (showForgotPassword) {
    return (
      <ForgotPasswordModal
        onClose={() => setShowForgotPassword(false)}
        onBackToLogin={() => setShowForgotPassword(false)}
      />
    );
  }

  const handleToggleMode = () => {
    setIsLogin(!isLogin);
    setError('');
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await requestJson<{ access_token: string; token_type: string; user: any }>(
        '/api/auth/login',
        {
          email: loginUsername.trim(),
          password: loginPassword,
        }
      );

      const normalizedUser = normalizeUser(response.user);
      onSuccess(normalizedUser);
      setIsLogin(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Invalid student email or password');
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await requestJson<{ access_token: string; token_type: string; user: any }>(
        '/api/auth/register',
        {
          name: name.trim(),
          email: email.trim(),
          password,
          telegramPhone: telegramPhone.trim(),
          parentsNumber: parentsNumber.trim() || telegramPhone.trim(),
          whatsApp: whatsApp.trim() || undefined,
        }
      );

      const normalizedUser = normalizeUser(response.user);
      localStorage.setItem('knotify_current_user', JSON.stringify(normalizedUser));
      onSuccess(normalizedUser);
      setIsLogin(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not create account');
    } finally {
      setLoading(false);
    }
  };

  const handleUseSampleAccount = () => {
    const sampleUser = {
      id: 'sample-student-daniel',
      name: 'Daniel Adeleke',
      full_name: 'Daniel Adeleke',
      email: 'daniel.adeleke@student.covenant.edu.ng',
      telegramPhone: '08012345678',
      phone: '08012345678',
      whatsApp: '08012345678',
      parentsNumber: '08098765432',
      address: 'Daniel Hall',
      roomNumber: 'B204',
    };
    persistAuthSession(sampleUser, 'sample_jwt_token_for_daniel');
    onSuccess(sampleUser);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[1000] flex items-center justify-center p-3 sm:p-6 overflow-y-auto bg-black/40 backdrop-blur-sm">
      
      {/* Centered Modal Card Container */}
      <motion.div
        initial={{ opacity: 0, scale: 0.96, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.96, y: 15 }}
        transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
        className="w-full max-w-4xl bg-[#FFFEF2] rounded-3xl shadow-2xl border border-black/8 overflow-hidden relative flex flex-col md:flex-row my-auto"
        id="auth-modal-card"
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-30 w-8 h-8 rounded-full bg-black/5 hover:bg-black/10 flex items-center justify-center text-brand-primary/70 hover:text-brand-primary transition-colors cursor-pointer"
          aria-label="Close"
        >
          <X size={16} />
        </button>

        {/* ── LEFT COLUMN: MINIMAL FORM PANEL ── */}
        <div className="w-full md:w-[54%] p-6 sm:p-10 lg:p-12 flex flex-col justify-between text-left">
          
          <div>
            {/* Logo + Brand Pill */}
            <div className="flex items-center gap-2 mb-6 select-none">
              <img src="/logo-k.svg" alt="Knotify" className="h-6 w-auto" />
              <span className="font-serif font-bold text-sm tracking-tight text-brand-secondary">
                Knotify
              </span>
            </div>

            {/* Heading & Subtitle */}
            <div className="mb-5">
              <h2 className="font-display font-bold text-2xl sm:text-3xl text-brand-primary tracking-tight">
                {isLogin ? 'Welcome back!' : 'Create your account'}
              </h2>
              <p className="text-xs sm:text-sm text-brand-primary/60 font-sans mt-1">
                {isLogin 
                  ? 'Please enter your account details to continue.' 
                  : 'Join Covenant students getting chapel-ready ties without hassle.'}
              </p>
            </div>

            {/* Quick Sample Account Button for testing */}
            <div className="mb-4">
              <button
                type="button"
                onClick={handleUseSampleAccount}
                className="w-full py-2.5 px-3 bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 text-amber-900 rounded-xl font-sans text-xs font-semibold flex items-center justify-center gap-2 transition-colors cursor-pointer"
              >
                <Sparkles size={14} className="text-amber-600" />
                <span>⚡ Use Sample Account (Instant Sign In)</span>
              </button>
            </div>

            {/* Error Message Alert */}
            {error && (
              <div className="bg-rose-50 border border-rose-200 text-rose-800 text-xs py-2.5 px-3.5 rounded-xl flex items-center gap-2 mb-5">
                <AlertCircle size={15} className="shrink-0 text-rose-600" />
                <span className="font-sans font-medium">{error}</span>
              </div>
            )}

            {/* ── FORMS SWITCH ── */}
            <AnimatePresence mode="wait">
              {isLogin ? (
                /* ── LOGIN FORM ── */
                <motion.form
                  key="login"
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 8 }}
                  transition={{ duration: 0.2 }}
                  onSubmit={handleLogin}
                  className="space-y-4"
                >
                  <div>
                    <label className="block text-[11px] font-sans font-medium text-brand-primary/75 mb-1.5">
                      Student email
                    </label>
                    <div className="relative">
                      <input
                        type="email"
                        required
                        placeholder="e.g. name@student.covenant.edu.ng"
                        value={loginUsername}
                        onChange={(e) => setLoginUsername(e.target.value)}
                        className="w-full pl-3.5 pr-10 py-3 bg-[#F8F6EC]/60 border border-brand-border/30 focus:border-brand-secondary focus:bg-white text-brand-primary font-sans text-xs sm:text-sm rounded-xl focus:outline-none transition-all placeholder:text-brand-primary/30"
                      />
                      <Mail size={16} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-brand-primary/30 pointer-events-none" />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-sans font-medium text-brand-primary/75 mb-1.5">
                      Password
                    </label>
                    <div className="relative">
                      <input
                        type={showPassword ? 'text' : 'password'}
                        required
                        placeholder="••••••••••••"
                        value={loginPassword}
                        onChange={(e) => setLoginPassword(e.target.value)}
                        className="w-full pl-3.5 pr-10 py-3 bg-[#F8F6EC]/60 border border-brand-border/30 focus:border-brand-secondary focus:bg-white text-brand-primary font-sans text-xs sm:text-sm rounded-xl focus:outline-none transition-all placeholder:text-brand-primary/30"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3.5 top-1/2 -translate-y-1/2 text-brand-primary/40 hover:text-brand-primary cursor-pointer transition-colors"
                      >
                        {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                      </button>
                    </div>
                  </div>

                  <div className="flex justify-end pt-0.5">
                    <button
                      type="button"
                      onClick={() => setShowForgotPassword(true)}
                      className="text-xs font-sans text-brand-secondary/80 hover:text-brand-secondary hover:underline cursor-pointer"
                    >
                      Forgot password?
                    </button>
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full py-3.5 bg-brand-secondary hover:bg-brand-accent text-[#FFFEF2] font-sans font-semibold text-xs sm:text-sm rounded-full transition-all duration-200 shadow-sm hover:shadow cursor-pointer disabled:opacity-50 min-h-[44px] mt-2 active:scale-98"
                  >
                    {loading ? 'Signing in...' : 'Sign in'}
                  </button>
                </motion.form>
              ) : (
                /* ── REGISTER FORM ── */
                <motion.form
                  key="register"
                  initial={{ opacity: 0, x: 8 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -8 }}
                  transition={{ duration: 0.2 }}
                  onSubmit={handleRegister}
                  className="space-y-3.5"
                >
                  <div>
                    <label className="block text-[11px] font-sans font-medium text-brand-primary/75 mb-1">
                      Full name
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Daniel Adeleke"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-[#F8F6EC]/60 border border-brand-border/30 focus:border-brand-secondary focus:bg-white text-brand-primary font-sans text-xs sm:text-sm rounded-xl focus:outline-none transition-all"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-sans font-medium text-brand-primary/75 mb-1">
                      Student email
                    </label>
                    <input
                      type="email"
                      required
                      placeholder="e.g. daniel@student.covenant.edu.ng"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-[#F8F6EC]/60 border border-brand-border/30 focus:border-brand-secondary focus:bg-white text-brand-primary font-sans text-xs sm:text-sm rounded-xl focus:outline-none transition-all"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-sans font-medium text-brand-primary/75 mb-1">
                      Password
                    </label>
                    <input
                      type="password"
                      required
                      placeholder="••••••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-[#F8F6EC]/60 border border-brand-border/30 focus:border-brand-secondary focus:bg-white text-brand-primary font-sans text-xs sm:text-sm rounded-xl focus:outline-none transition-all"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-2.5">
                    <div>
                      <label className="block text-[11px] font-sans font-medium text-brand-primary/75 mb-1">
                        Phone / Telegram
                      </label>
                      <input
                        type="tel"
                        required
                        placeholder="08012345678"
                        value={telegramPhone}
                        onChange={(e) => setTelegramPhone(e.target.value)}
                        className="w-full px-3 py-2.5 bg-[#F8F6EC]/60 border border-brand-border/30 focus:border-brand-secondary focus:bg-white text-brand-primary font-sans text-xs rounded-xl focus:outline-none transition-all"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-sans font-medium text-brand-primary/75 mb-1">
                        WhatsApp (optional)
                      </label>
                      <input
                        type="tel"
                        placeholder="08012345678"
                        value={whatsApp}
                        onChange={(e) => setWhatsApp(e.target.value)}
                        className="w-full px-3 py-2.5 bg-[#F8F6EC]/60 border border-brand-border/30 focus:border-brand-secondary focus:bg-white text-brand-primary font-sans text-xs rounded-xl focus:outline-none transition-all"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full py-3.5 bg-brand-secondary hover:bg-brand-accent text-[#FFFEF2] font-sans font-semibold text-xs sm:text-sm rounded-full transition-all duration-200 shadow-sm hover:shadow cursor-pointer disabled:opacity-50 min-h-[44px] mt-2 active:scale-98"
                  >
                    {loading ? 'Creating account...' : 'Create account'}
                  </button>
                </motion.form>
              )}
            </AnimatePresence>

            {/* Toggle Sign In / Sign Up */}
            <div className="text-center mt-5 pt-3 border-t border-black/5">
              <p className="text-xs text-brand-primary/65 font-sans">
                {isLogin ? "Don't have an account? " : "Already have an account? "}
                <button
                  onClick={handleToggleMode}
                  className="text-brand-secondary font-semibold hover:underline cursor-pointer"
                >
                  {isLogin ? 'Sign up' : 'Sign in'}
                </button>
              </p>
            </div>
          </div>

          {/* Modal Footer Links */}
          <div className="flex items-center justify-between text-[10px] text-brand-primary/45 font-sans pt-6 border-t border-black/5 mt-4">
            <a 
              href="https://t.me/+go-lAiSrbJ5hNGVk" 
              target="_blank" 
              rel="noopener noreferrer" 
              className="hover:text-brand-secondary transition-colors"
            >
              Contact us
            </a>
            <span>•</span>
            <span>Covenant University</span>
            <span>•</span>
            <span>© 2026 Knotify</span>
          </div>

        </div>

        {/* ── RIGHT COLUMN: CREAM WHITE DESIGN PANEL WITH LOGO ── */}
        <div className="hidden md:flex md:w-[46%] bg-[#F8F6EC] p-8 lg:p-12 relative flex-col items-center justify-center text-center overflow-hidden border-l border-brand-secondary/10">
          
          {/* Subtle concentric ambient rings */}
          <div className="absolute w-[420px] h-[420px] rounded-full border border-brand-secondary/10 pointer-events-none" />
          <div className="absolute w-[300px] h-[300px] rounded-full border border-brand-secondary/8 pointer-events-none" />
          <div className="absolute w-[180px] h-[180px] rounded-full border border-brand-secondary/6 pointer-events-none" />

          {/* Centerpiece Vector Logo Presentation */}
          <div className="relative z-10 flex flex-col items-center">
            
            <div className="w-28 h-28 sm:w-32 sm:h-32 rounded-3xl bg-[#FFFEF2] border border-brand-secondary/15 shadow-lg flex items-center justify-center p-6 mb-6">
              <img
                src="/logo-k.svg"
                alt="Knotify Emblem"
                className="w-full h-full object-contain"
              />
            </div>

            <span className="text-[10px] font-mono tracking-[0.3em] uppercase text-brand-secondary/60 block mb-1">
              ESTABLISHED 2026
            </span>
            <h3 className="font-serif font-bold text-xl text-brand-secondary tracking-tight">
              Knotify Ties
            </h3>
            <p className="font-serif italic text-xs text-brand-primary/65 mt-2 max-w-xs leading-relaxed">
              "Dignitas et Elegantia in Omnia — The Covenant standard for effortless resumption neckwear."
            </p>
          </div>

        </div>

      </motion.div>
    </div>
  );
}
