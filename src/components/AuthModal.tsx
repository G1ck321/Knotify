import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  User, 
  ChevronLeft,
  Eye, 
  EyeOff, 
  AlertCircle
} from 'lucide-react';
import ForgotPasswordModal from './ForgotPasswordModal';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (user: any) => void;
  pendingActionName?: string; // Optional context
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
  
  // Registration Form States
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [telegramPhone, setTelegramPhone] = useState('');
  const [whatsApp, setWhatsApp] = useState('');
  const [parentsNumber, setParentsNumber] = useState('');
  const [roomNumber, setRoomNumber] = useState('');
  const [isSellerAccount, setIsSellerAccount] = useState(false);

  // Login Form States
  const [loginUsername, setLoginUsername] = useState('');
  const [loginPassword, setLoginPassword] = useState('');

  if (!isOpen) return null;

  // Render the Forgot Password full-screen flow when triggered
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

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const nameToUse = loginUsername.trim() || 'Covenant Student';
    const mockUser = {
      id: `USR-${Math.floor(10000 + Math.random() * 90000)}`,
      name: nameToUse,
      email: nameToUse.toLowerCase().includes('@') ? nameToUse : `${nameToUse.replace(/\s+/g, '').toLowerCase()}@student.covenant.edu.ng`,
      telegramPhone: '08012345678',
      parentsNumber: '08023456789',
      roomNumber: 'Daniel Hall Room 101',
      isSeller: isSellerAccount,
      createdAt: new Date().toISOString()
    };

    localStorage.setItem('knotify_current_user', JSON.stringify(mockUser));
    onSuccess(mockUser);
  };

  const handleRegister = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const nameToUse = name.trim() || 'New Student';
    const emailToUse = email.trim() || 'newstudent@student.covenant.edu.ng';

    const newUser = {
      id: `USR-${Math.floor(10000 + Math.random() * 90000)}`,
      name: nameToUse,
      email: emailToUse,
      telegramPhone: telegramPhone || '08012345678',
      whatsApp: whatsApp || undefined,
      parentsNumber: parentsNumber || '08023456789',
      roomNumber: roomNumber || 'Daniel Hall Room 101',
      isSeller: isSellerAccount,
      createdAt: new Date().toISOString()
    };

    localStorage.setItem('knotify_current_user', JSON.stringify(newUser));
    onSuccess(newUser);
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
            "We pass on smart confidence. Dressing for chapel should be premium, rules-compliant, and passed down from student to student."
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
        <div className={`w-full ${isLogin ? 'max-w-sm' : 'max-w-xl'} space-y-6 pt-16 pb-10 transition-all duration-300`}>
          
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
              {isLogin ? 'New to the exchange? ' : 'Already listed ties with us? '}
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


                  <div className="text-right">
                    <button
                      type="button"
                      id="forgot-password-link"
                      onClick={() => setShowForgotPassword(true)}
                      className="text-[10px] font-mono text-[#2D6A4F] hover:text-[#1F3E2B] hover:underline transition-colors cursor-pointer tracking-wide uppercase font-bold"
                    >
                      Forgot password?
                    </button>
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
                className="space-y-5 text-left"
              >
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-4">
                  <div>
                    <label className="block text-[10px] font-mono font-bold text-neutral-400 uppercase tracking-widest mb-1.5">
                      FULL NAME *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Daniel Adebayo"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="w-full px-4 py-3 bg-brand-card border border-brand-border focus:border-brand-secondary text-brand-primary font-sans text-sm rounded focus:outline-none transition-all placeholder:text-brand-primary/35"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-mono font-bold text-neutral-400 uppercase tracking-widest mb-1.5">
                      COVENANT EMAIL ADDRESS *
                    </label>
                    <input
                      type="email"
                      required
                      placeholder="e.g. daniel@student.covenant.edu.ng"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full px-4 py-3 bg-brand-card border border-brand-border focus:border-brand-secondary text-brand-primary font-sans text-sm rounded focus:outline-none transition-all placeholder:text-brand-primary/35"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-mono font-bold text-neutral-400 uppercase tracking-widest mb-1.5">
                      SECURE PASSWORD *
                    </label>
                    <input
                      type="password"
                      required
                      placeholder="Min 6 characters"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full px-4 py-3 bg-brand-card border border-brand-border focus:border-brand-secondary text-brand-primary font-sans text-sm rounded focus:outline-none transition-all placeholder:text-brand-primary/35"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-mono font-bold text-neutral-400 uppercase tracking-widest mb-1.5 flex justify-between">
                      <span>TELEGRAM PHONE *</span>
                      <span className="text-[8px] text-neutral-400 normal-case font-normal">for campus deliveries</span>
                    </label>
                    <input
                      type="tel"
                      required
                      placeholder="e.g. 08012345678"
                      value={telegramPhone}
                      onChange={(e) => setTelegramPhone(e.target.value)}
                      className="w-full px-4 py-3 bg-brand-card border border-brand-border focus:border-brand-secondary text-brand-primary font-sans text-sm rounded focus:outline-none transition-all placeholder:text-brand-primary/35"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-mono font-bold text-neutral-400 uppercase tracking-widest mb-1.5">
                      WHATSAPP PHONE (OPTIONAL)
                    </label>
                    <input
                      type="tel"
                      placeholder="e.g. 08012345678"
                      value={whatsApp}
                      onChange={(e) => setWhatsApp(e.target.value)}
                      className="w-full px-4 py-3 bg-brand-card border border-brand-border focus:border-brand-secondary text-brand-primary font-sans text-sm rounded focus:outline-none transition-all placeholder:text-brand-primary/35"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-mono font-bold text-neutral-400 uppercase tracking-widest mb-1.5">
                      PARENT'S CONTACT NUMBER *
                    </label>
                    <input
                      type="tel"
                      required
                      placeholder="e.g. 08023456789"
                      value={parentsNumber}
                      onChange={(e) => setParentsNumber(e.target.value)}
                      className="w-full px-4 py-3 bg-brand-card border border-brand-border focus:border-brand-secondary text-brand-primary font-sans text-sm rounded focus:outline-none transition-all placeholder:text-brand-primary/35"
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block text-[10px] font-mono font-bold text-neutral-400 uppercase tracking-widest mb-1.5">
                      ROOM NUMBER *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Daniel Hall, Room 302"
                      value={roomNumber}
                      onChange={(e) => setRoomNumber(e.target.value)}
                      className="w-full px-4 py-3 bg-brand-card border border-brand-border focus:border-brand-secondary text-brand-primary font-sans text-sm rounded focus:outline-none transition-all placeholder:text-brand-primary/35"
                    />
                  </div>
                </div>

                <div className="pt-4">
                  <button
                    type="submit"
                    className="w-full py-4 bg-brand-secondary hover:bg-brand-primary text-white font-mono text-xs tracking-widest uppercase font-black rounded-sm transition-all duration-300 flex items-center justify-center gap-2 cursor-pointer shadow hover:scale-[1.01]"
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
