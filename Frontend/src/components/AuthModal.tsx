import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  User, 
  ChevronLeft,
  Eye, 
  EyeOff, 
  AlertCircle
} from 'lucide-react';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (user: any, accessToken?: string) => void;
  pendingActionName?: string; // Optional context
}

const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL ?? '').replace(/\/$/, '')||"127.0.0.1:5000";

async function requestJson<T>(path: string, body: unknown): Promise<T> {
  // Keep all auth requests consistent and surface backend errors clearly.
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
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  
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

  const handleToggleMode = () => {
    setIsLogin(!isLogin);
    setError('');
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    try {
      const response = await requestJson<{ access_token: string; token_type: string; user: any }>(
        '/api/auth/login',
        {
          email: loginUsername.trim(),
          password: loginPassword,
        }
      );

      const normalizedUser = normalizeUser(response.user);
      onSuccess(normalizedUser, response.access_token);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not sign in');
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    try {
      const response = await requestJson<{ message: string; user: any }>(
        '/api/auth/signup',
        {
          name: name.trim(),
          email: email.trim(),
          password,
          telegramPhone,
          parentsNumber,
          whatsApp: whatsApp.trim() || undefined,
        }
      );

      const normalizedUser = normalizeUser(response.user);
      onSuccess(normalizedUser);
      setIsLogin(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not create account');
    }
  };

  return (
    <div className="fixed inset-0 z-[1000] flex bg-[#FFFEF2] overflow-hidden" id="auth-modal-screen">
      
      {/* 1. LEFT SIDEBAR: HIGH-END GREEN GLOW & SERIF QUOTE (DESKTOP ONLY - From Image 2) */}
      <div className="hidden md:flex md:w-[45%] lg:w-[48%] bg-[#1F3E2B] relative flex-col justify-between p-12 lg:p-16 text-left text-[#FFFEF2]">
        
        {/* Subtle patterned ivory overlay dots */}
        <div className="absolute inset-0 bg-[radial-gradient(rgba(255,254,242,0.06)_1.5px,transparent_1.5px)] bg-[size:24px_24px] pointer-events-none" />
        
        {/* Ambient top right glow */}
        <div className="absolute top-0 right-0 w-80 h-80 bg-brand-accent/25 rounded-full filter blur-[120px] pointer-events-none" />

        {/* Top Branding Block */}
        <div className="relative z-10">
          <span className="text-[10px] font-mono tracking-[0.3em] text-[#FFFEF2]/80 uppercase block">
            SARTORIAL COLLEGE GUILD
          </span>
          <h1 className="font-display font-light text-4xl lg:text-5xl text-white tracking-tight uppercase leading-[1.15] mt-3">
            KNOTIFY <br />EXCHANGE
          </h1>
          <div className="h-[1px] w-12 bg-brand-bg/40 mt-6" />
        </div>

        {/* Dynamic Context Message */}
        <div className="relative z-10 max-w-md my-auto">
          <p className="font-display italic text-2xl lg:text-3xl text-[#FFFEF2]/90 leading-relaxed font-light">
            "We pass on smart confidence. Dressing for chapel should be premium, rules-compliant, at affordable rates."
          </p>
          <div className="flex items-center gap-2 mt-4 text-[10px] font-mono uppercase tracking-wider text-[#FFFEF2]/65">
            <span>† CHAPTER II SEC 4</span>
            <span>•</span>
            <span>COVENANT LOBBY DELIVERY</span>
          </div>
        </div>

        {/* Footer Credit Tag */}
        <div className="relative z-10 flex items-center justify-between text-[9px] font-mono text-[#FFFEF2]/45 tracking-widest uppercase">
          <span>COVENANT UNIVERSITY</span>
          <span>© 2026 KNOTIFY CO.</span>
        </div>
      </div>

      {/* 2. RIGHT SIDEBAR: INTERACTIVE FORMS PANEL (With Ivory Background) */}
      <div className="w-full md:w-[55%] lg:w-[52%] h-full flex flex-col justify-center items-center px-6 sm:px-12 relative overflow-y-auto bg-[#FFFEF2]">
        
        {/* Decorative elements */}
        <div className="absolute top-6 left-6 z-20">
          <button
            onClick={onClose}
            className="inline-flex items-center gap-2 px-4 py-2 bg-brand-card hover:bg-brand-secondary hover:text-brand-bg text-xs text-brand-primary font-sans tracking-wide rounded border border-brand-border transition-all duration-300 cursor-pointer"
          >
            <ChevronLeft size={14} />
            Back to Catalog
          </button>
        </div>

        {/* Form Container */}
        <div className="w-full max-w-sm space-y-6 pt-16 pb-10">
          
          {/* Header Mobile Title */}
          <div className="md:hidden flex flex-col items-center gap-1 text-center pb-4 select-none">
            <span className="text-[9px] font-mono tracking-[0.25em] text-brand-secondary uppercase">
              COVENANT SARTORIAL EXCHANGE
            </span>
            <span className="font-display font-light text-3xl text-brand-primary uppercase">
              KNOTIFY
            </span>
          </div>

          {/* Dynamic Greeting */}
          <div className="text-center md:text-left space-y-2">
            <h2 className="font-display font-light text-3xl text-brand-primary uppercase tracking-tight">
              {isLogin ? 'SECURE LOGIN' : 'CREATE ACCOUNT'}
            </h2>
            <p className="text-xs text-neutral-500 font-sans">
              {isLogin ? 'New to Knotify? ' : 'Already knotted ties with us? '}
              <button
                onClick={handleToggleMode}
                className="text-brand-secondary hover:underline font-bold transition-all cursor-pointer inline-flex items-center gap-1"
              >
                {isLogin ? 'Register now for free' : 'Sign in here'}
              </button>
            </p>
          </div>

          {/* Errors Portal */}
          {error && (
            <div className="bg-brand-secondary/5 border border-brand-secondary/20 text-brand-secondary text-xs py-3 px-4 rounded flex items-center gap-2.5 text-left">
              <AlertCircle size={14} className="shrink-0 animate-bounce" />
              <span className="font-sans font-medium">{error}</span>
            </div>
          )}

          {/* Form switch with sleek motion animation */}
          <AnimatePresence mode="wait">
            {isLogin ? (
              /* LOGIN FORM */
              <motion.form
                key="login"
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 10 }}
                transition={{ duration: 0.2 }}
                onSubmit={handleLogin}
                className="space-y-4 text-left"
              >
                <div className="space-y-3">
                  <div>
                    <label className="block text-[8px] font-mono font-bold text-neutral-400 uppercase tracking-widest mb-1">
                      STUDENT USERNAME / EMAIL
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. daniel@student.covenant.edu.ng"
                      value={loginUsername}
                      onChange={(e) => setLoginUsername(e.target.value)}
                      className="w-full px-4 py-3 bg-brand-card border border-brand-border/40 focus:border-brand-secondary text-brand-primary font-sans text-xs rounded focus:outline-none transition-all placeholder:text-brand-primary/30"
                    />
                  </div>

                  <div>
                    <label className="block text-[8px] font-mono font-bold text-neutral-400 uppercase tracking-widest mb-1">
                      PASSWORD
                    </label>
                    <div className="relative">
                      <input
                        type={showPassword ? 'text' : 'password'}
                        required
                        placeholder="Your exchange password"
                        value={loginPassword}
                        onChange={(e) => setLoginPassword(e.target.value)}
                        className="w-full pl-4 pr-11 py-3 bg-brand-card border border-brand-border/40 focus:border-brand-secondary text-brand-primary font-sans text-xs rounded focus:outline-none transition-all placeholder:text-brand-primary/30"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-brand-secondary/60 hover:text-brand-secondary transition-colors cursor-pointer"
                      >
                        {showPassword ? <EyeOff size={14} /> : <Eye size={14} />}
                      </button>
                    </div>
                  </div>
                </div>

                <div className="pt-2">
                  <button
                    type="submit"
                    className="w-full py-4 bg-brand-secondary hover:bg-brand-primary text-white font-mono text-xs tracking-widest uppercase font-black rounded-sm transition-all duration-300 shadow hover:scale-[1.02] cursor-pointer"
                  >
                    SIGN IN TO ACCOUNT
                  </button>
                </div>
              </motion.form>
            ) : (
              /* REGISTRATION FORM */
              <motion.form
                key="register"
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                transition={{ duration: 0.2 }}
                onSubmit={handleRegister}
                className="space-y-3.5 text-left max-h-[380px] overflow-y-auto pr-1"
              >
                <div>
                  <label className="block text-[8px] font-mono font-bold text-neutral-400 uppercase tracking-widest mb-1">
                    FULL NAME *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Daniel Adebayo"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full px-4 py-2.5 bg-brand-card border border-brand-border/40 focus:border-brand-secondary text-brand-primary font-sans text-xs rounded focus:outline-none transition-all placeholder:text-brand-primary/30"
                  />
                </div>

                <div>
                  <label className="block text-[8px] font-mono font-bold text-neutral-400 uppercase tracking-widest mb-1">
                    EMAIL ADDRESS *
                  </label>
                  <input
                    type="email"
                    required
                    placeholder="e.g. daniel@student.covenant.edu.ng"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full px-4 py-2.5 bg-brand-card border border-brand-border/40 focus:border-brand-secondary text-brand-primary font-sans text-xs rounded focus:outline-none transition-all placeholder:text-brand-primary/30"
                  />
                </div>

                <div>
                  <label className="block text-[8px] font-mono font-bold text-neutral-400 uppercase tracking-widest mb-1">
                    SECURE PASSWORD *
                  </label>
                  <input
                    type="password"
                    required
                      placeholder="Min 6 characters"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full px-4 py-2.5 bg-brand-card border border-brand-border/40 focus:border-brand-secondary text-brand-primary font-sans text-xs rounded focus:outline-none transition-all placeholder:text-brand-primary/30"
                  />
                    <p className="mt-1 text-[9px] text-neutral-400 font-sans">
                      Set something strong you can remember.
                    </p>
                </div>

                <div>
                  <label className="block text-[8px] font-mono font-bold text-neutral-400 uppercase tracking-widest mb-1 flex justify-between">
                    <span>TELEGRAM PHONE *</span>
                    <span className="text-[7px] text-neutral-400 normal-case font-normal">for campus deliveries</span>
                  </label>
                  <input
                    type="tel"
                    required
                    placeholder="e.g. 08012345678"
                    value={telegramPhone}
                    onChange={(e) => setTelegramPhone(e.target.value)}
                    className="w-full px-4 py-2.5 bg-brand-card border border-brand-border/40 focus:border-brand-secondary text-brand-primary font-sans text-xs rounded focus:outline-none transition-all placeholder:text-brand-primary/30"
                  />
                </div>

                <div>
                  <label className="block text-[8px] font-mono font-bold text-neutral-400 uppercase tracking-widest mb-1">
                    WHATSAPP PHONE (OPTIONAL)
                  </label>
                  <input
                    type="tel"
                    placeholder="e.g. 08012345678"
                    value={whatsApp}
                    onChange={(e) => setWhatsApp(e.target.value)}
                    className="w-full px-4 py-2.5 bg-brand-card border border-brand-border/40 focus:border-brand-secondary text-brand-primary font-sans text-xs rounded focus:outline-none transition-all placeholder:text-brand-primary/30"
                  />
                </div>

                <div>
                  <label className="block text-[8px] font-mono font-bold text-neutral-400 uppercase tracking-widest mb-1">
                    PARENT'S CONTACT NUMBER *
                  </label>
                  <input
                    type="tel"
                    required
                    placeholder="e.g. 08023456789"
                    value={parentsNumber}
                    onChange={(e) => setParentsNumber(e.target.value)}
                    className="w-full px-4 py-2.5 bg-brand-card border border-brand-border/40 focus:border-brand-secondary text-brand-primary font-sans text-xs rounded focus:outline-none transition-all placeholder:text-brand-primary/30"
                  />
                </div>

                <div className="pt-2">
                  <button
                    type="submit"
                    className="w-full py-3.5 bg-brand-secondary hover:bg-brand-primary text-white font-mono text-xs tracking-widest uppercase font-black rounded-sm transition-all duration-300 flex items-center justify-center gap-2 cursor-pointer shadow"
                  >
                    <User size={12} />
                    CREATE STUDENT ACCOUNT
                  </button>
                </div>
              </motion.form>
            )}
          </AnimatePresence>

          {/* Disclaimer text */}
          <p className="text-[10px] text-neutral-400 max-w-xs mx-auto leading-relaxed font-sans pt-6 text-center">
            By signing in or registering, you agree to comply with Covenant University's{' '}
            <span className="underline hover:text-brand-secondary transition-colors cursor-pointer font-bold">Chapel Decorum Code</span> and our standard exchange guidelines.
          </p>

        </div>
      </div>
    </div>
  );
}
