import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  ChevronLeft,
  Mail,
  ShieldCheck,
  KeyRound,
  CheckCircle2,
  Eye,
  EyeOff,
  RotateCcw,
  AlertCircle,
  Clock,
  Send,
  LogIn,
} from 'lucide-react';

interface ForgotPasswordModalProps {
  onClose: () => void;
  onBackToLogin: () => void;
}

type Stage =
  | 'email'        // 1. Enter email
  | 'sending'      // 2. Sending code animation
  | 'code'         // 3. Enter OTP code (10-min timer)
  | 'expired'      // 4. Timer expired
  | 'wrong_code'   // 5. Wrong code entered
  | 'new_password' // 6. Enter new password
  | 'success';     // 7. Password changed confirmation

// TODO: Replace OTP verification with a real Supabase / backend API call
// e.g. supabase.auth.verifyOtp({ email, token: entered, type: 'email' })
const TIMER_DURATION = 10 * 60; // 10 minutes in seconds
const RESEND_COOLDOWN = 60;      // 1 minute resend cooldown in seconds

// ── STABLE SHARED COMPONENTS (defined outside to prevent remounting) ──────────
function Wrapper({ children }: { children: React.ReactNode }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -16 }}
      transition={{ duration: 0.28, ease: 'easeInOut' }}
      className="w-full max-w-sm space-y-6 text-left"
    >
      {children}
    </motion.div>
  );
}

function StageIndicator({ step }: { step: number }) {
  return (
    <div className="flex items-center gap-1.5 mb-1">
      {[1, 2, 3, 4].map((s) => (
        <div
          key={s}
          className={`h-1 rounded-full transition-all duration-500 ${
            s <= step ? 'bg-[#2D6A4F] flex-1' : 'bg-brand-border flex-1'
          }`}
        />
      ))}
    </div>
  );
}

export default function ForgotPasswordModal({ onClose, onBackToLogin }: ForgotPasswordModalProps) {
  const [stage, setStage] = useState<Stage>('email');
  const [email, setEmail] = useState('');
  const [emailError, setEmailError] = useState('');
  const [code, setCode] = useState(['', '', '', '', '', '']);
  const [codeError, setCodeError] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [passwordError, setPasswordError] = useState('');

  // Timer state
  const [timeLeft, setTimeLeft] = useState(TIMER_DURATION);
  const [resendCooldown, setResendCooldown] = useState(0);
  const [resendCount, setResendCount] = useState(0);

  // OTP input refs
  const otpRefs = useRef<(HTMLInputElement | null)[]>([]);

  // ── TIMERS ───────────────────────────────────────────────────────────────────
  useEffect(() => {
    if (stage !== 'code') return;
    if (timeLeft <= 0) {
      setStage('expired');
      return;
    }
    const tick = setInterval(() => setTimeLeft((t) => t - 1), 1000);
    return () => clearInterval(tick);
  }, [stage, timeLeft]);

  useEffect(() => {
    if (resendCooldown <= 0) return;
    const tick = setInterval(() => setResendCooldown((t) => t - 1), 1000);
    return () => clearInterval(tick);
  }, [resendCooldown]);

  // ── HELPERS ──────────────────────────────────────────────────────────────────
  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60).toString().padStart(2, '0');
    const s = (secs % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  const timerUrgent = timeLeft <= 60;

  const handleSendCode = () => {
    const trimmed = email.trim();
    if (!trimmed) { setEmailError('Please enter your email address.'); return; }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(trimmed)) { setEmailError('Please enter a valid email address.'); return; }
    setEmailError('');
    setStage('sending');
    // Simulate network delay
    setTimeout(() => {
      setTimeLeft(TIMER_DURATION);
      setResendCooldown(RESEND_COOLDOWN);
      setCode(['', '', '', '', '', '']);
      setCodeError('');
      setStage('code');
      setTimeout(() => otpRefs.current[0]?.focus(), 100);
    }, 2200);
  };

  const handleResendCode = () => {
    if (resendCooldown > 0) return;
    setResendCount((n) => n + 1);
    setStage('sending');
    setTimeout(() => {
      setTimeLeft(TIMER_DURATION);
      setResendCooldown(RESEND_COOLDOWN);
      setCode(['', '', '', '', '', '']);
      setCodeError('');
      setStage('code');
      setTimeout(() => otpRefs.current[0]?.focus(), 100);
    }, 2200);
  };

  const handleOtpChange = (index: number, value: string) => {
    if (!/^\d*$/.test(value)) return;
    const next = [...code];
    next[index] = value.slice(-1);
    setCode(next);
    setCodeError('');
    if (value && index < 5) {
      otpRefs.current[index + 1]?.focus();
    }
  };

  const handleOtpKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !code[index] && index > 0) {
      otpRefs.current[index - 1]?.focus();
    }
  };

  const handleVerifyCode = async () => {
    const entered = code.join('');
    if (entered.length < 6) { setCodeError('Please enter all 6 digits.'); return; }

    // TODO: Replace with real backend OTP verification
    // Example Supabase call:
    // const { error } = await supabase.auth.verifyOtp({ email, token: entered, type: 'email' });
    // if (error) { setStage('wrong_code'); return; }

    // For now, accept any valid 6-digit code — backend will validate
    setCodeError('');
    setStage('new_password');
  };

  const handleSetPassword = (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword.length < 6) { setPasswordError('Password must be at least 6 characters.'); return; }
    if (newPassword !== confirmPassword) { setPasswordError('Passwords do not match.'); return; }
    setPasswordError('');
    setStage('success');
  };

  // ── RENDER ───────────────────────────────────────────────────────────────────
  return (
    <div className="fixed inset-0 z-[1100] flex bg-[#FFFEF2] overflow-hidden" id="forgot-password-screen">

      {/* LEFT PANEL — decorative */}
      <div className="hidden md:flex md:w-[45%] lg:w-[48%] bg-[#1F3E2B] relative flex-col justify-between p-12 lg:p-16 text-left text-[#FFFEF2]">
        <div className="absolute inset-0 bg-[radial-gradient(rgba(255,254,242,0.06)_1.5px,transparent_1.5px)] bg-[size:24px_24px] pointer-events-none" />
        <div className="absolute top-0 right-0 w-80 h-80 bg-[#52B788]/25 rounded-full filter blur-[120px] pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-[#52B788]/10 rounded-full filter blur-[100px] pointer-events-none" />

        {/* Branding */}
        <div className="relative z-10">
          <span className="text-[10px] font-mono tracking-[0.3em] text-[#FFFEF2]/80 uppercase block">
            ACCOUNT RECOVERY
          </span>
          <h1 className="font-display font-light text-4xl lg:text-5xl text-white tracking-tight uppercase leading-[1.15] mt-3">
            KNOTIFY<br />EXCHANGE
          </h1>
          <div className="h-[1px] w-12 bg-[#FFFEF2]/40 mt-6" />
        </div>

        {/* Quote */}
        <div className="relative z-10 max-w-md my-auto">
          <div className="w-12 h-12 rounded-full bg-[#52B788]/20 border border-[#52B788]/30 flex items-center justify-center mb-6">
            <ShieldCheck size={22} className="text-[#52B788]" />
          </div>
          <p className="font-display italic text-2xl lg:text-3xl text-[#FFFEF2]/90 leading-relaxed font-light">
            "Your account is secured. We'll help you get back in quickly and safely."
          </p>
          <div className="flex items-center gap-2 mt-4 text-[10px] font-mono uppercase tracking-wider text-[#FFFEF2]/65">
            <span>† SECURE RECOVERY</span>
            <span>•</span>
            <span>COVENANT KNOTIFY</span>
          </div>
        </div>

        {/* Footer */}
        <div className="relative z-10 flex items-center justify-between text-[9px] font-mono text-[#FFFEF2]/45 tracking-widest uppercase">
          <span>COVENANT UNIVERSITY</span>
          <span>© 2026 KNOTIFY CO.</span>
        </div>
      </div>

      {/* RIGHT PANEL — interactive */}
      <div className="w-full md:w-[55%] lg:w-[52%] h-full flex flex-col justify-center items-center px-6 sm:px-12 relative overflow-y-auto bg-[#FFFEF2]">

        {/* Back button */}
        <div className="absolute top-6 left-6 z-20">
          <button
            onClick={stage === 'success' ? onBackToLogin : (stage === 'code' || stage === 'expired' || stage === 'wrong_code' || stage === 'new_password') ? () => setStage('email') : onBackToLogin}
            className="inline-flex items-center gap-2 px-4 py-2 bg-brand-card hover:bg-brand-secondary hover:text-brand-bg text-xs text-brand-primary font-sans tracking-wide rounded border border-brand-border transition-all duration-300 cursor-pointer"
          >
            <ChevronLeft size={14} />
            {stage === 'success' ? 'Back to Login' : 'Back'}
          </button>
        </div>

        <div className="w-full max-w-sm pt-16 pb-10">
          <AnimatePresence mode="wait">

            {/* ── STAGE 1: EMAIL ─────────────────────────────────────────── */}
            {stage === 'email' && (
              <Wrapper key="email">
                <StageIndicator step={1} />
                <div className="space-y-1">
                  <div className="flex items-center gap-2 mb-1">
                    <div className="w-8 h-8 rounded-lg bg-[#1F3E2B]/10 flex items-center justify-center">
                      <Mail size={15} className="text-[#1F3E2B]" />
                    </div>
                    <span className="text-[10px] font-mono tracking-[0.25em] text-brand-secondary uppercase">Step 1 of 4</span>
                  </div>
                  <h2 className="font-display font-light text-3xl text-brand-primary uppercase tracking-tight">
                    FORGOT<br />PASSWORD?
                  </h2>
                  <p className="text-xs text-neutral-500 font-sans leading-relaxed pt-1">
                    No worries. Enter your registered email and we'll send a 6-digit recovery code to your inbox.
                  </p>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-[8px] font-mono font-bold text-neutral-400 uppercase tracking-widest mb-1.5">
                      REGISTERED EMAIL ADDRESS
                    </label>
                    <input
                      id="forgot-email-input"
                      type="email"
                      autoFocus
                      placeholder="e.g. daniel@student.covenant.edu.ng"
                      value={email}
                      onChange={(e) => { setEmail(e.target.value); setEmailError(''); }}
                      onKeyDown={(e) => e.key === 'Enter' && handleSendCode()}
                      className="w-full px-4 py-3 bg-brand-card border border-brand-border/40 focus:border-[#2D6A4F] text-brand-primary font-sans text-xs rounded focus:outline-none transition-all placeholder:text-brand-primary/30"
                    />
                    {emailError && (
                      <p className="text-[10px] text-red-500 font-sans mt-1.5 flex items-center gap-1">
                        <AlertCircle size={10} /> {emailError}
                      </p>
                    )}
                  </div>

                  <button
                    id="forgot-send-code-btn"
                    onClick={handleSendCode}
                    className="w-full py-4 bg-[#1F3E2B] hover:bg-[#2D6A4F] text-white font-mono text-xs tracking-widest uppercase font-black rounded-sm transition-all duration-300 shadow hover:scale-[1.02] cursor-pointer flex items-center justify-center gap-2"
                  >
                    <Send size={13} />
                    SEND RECOVERY CODE
                  </button>

                  <button
                    onClick={onBackToLogin}
                    className="w-full text-center text-[10px] font-mono text-neutral-400 hover:text-brand-primary transition-colors cursor-pointer tracking-wide uppercase"
                  >
                    Remember your password? Sign in instead
                  </button>
                </div>
              </Wrapper>
            )}

            {/* ── STAGE 2: SENDING ──────────────────────────────────────── */}
            {stage === 'sending' && (
              <Wrapper key="sending">
                <div className="flex flex-col items-center justify-center py-12 gap-6 text-center">
                  <div className="relative">
                    <div className="w-20 h-20 rounded-full border-4 border-[#1F3E2B]/20 border-t-[#1F3E2B] animate-spin" />
                    <div className="absolute inset-0 flex items-center justify-center">
                      <Mail size={22} className="text-[#1F3E2B]" />
                    </div>
                  </div>
                  <div>
                    <h2 className="font-display font-light text-2xl text-brand-primary uppercase tracking-tight">
                      SENDING CODE
                    </h2>
                    <p className="text-xs text-neutral-500 font-sans mt-2">
                      Dispatching your recovery code to<br />
                      <span className="font-bold text-brand-primary">{email}</span>
                    </p>
                  </div>
                  <p className="text-[10px] font-mono text-neutral-400 tracking-wider uppercase animate-pulse">
                    Please wait...
                  </p>
                </div>
              </Wrapper>
            )}

            {/* ── STAGE 3: OTP CODE ─────────────────────────────────────── */}
            {stage === 'code' && (
              <Wrapper key="code">
                <StageIndicator step={2} />
                <div className="space-y-1">
                  <div className="flex items-center gap-2 mb-1">
                    <div className="w-8 h-8 rounded-lg bg-[#1F3E2B]/10 flex items-center justify-center">
                      <KeyRound size={15} className="text-[#1F3E2B]" />
                    </div>
                    <span className="text-[10px] font-mono tracking-[0.25em] text-brand-secondary uppercase">Step 2 of 4</span>
                  </div>
                  <h2 className="font-display font-light text-3xl text-brand-primary uppercase tracking-tight">
                    ENTER<br />YOUR CODE
                  </h2>
                  <p className="text-xs text-neutral-500 font-sans leading-relaxed pt-1">
                    A 6-digit code was sent to <span className="font-bold text-brand-primary">{email}</span>. Enter it below within 10 minutes.
                  </p>
                </div>

                {/* Timer */}
                <div className={`flex items-center gap-2 px-4 py-3 rounded-lg border transition-all duration-300 ${
                  timerUrgent
                    ? 'bg-red-50 border-red-200 text-red-600'
                    : 'bg-[#1F3E2B]/5 border-[#1F3E2B]/15 text-[#1F3E2B]'
                }`}>
                  <Clock size={14} className={timerUrgent ? 'animate-pulse' : ''} />
                  <span className="text-xs font-mono font-bold tracking-widest">
                    {formatTime(timeLeft)}
                  </span>
                  <span className="text-[10px] font-sans ml-auto opacity-70">
                    {timerUrgent ? 'Hurry! Code expiring soon' : 'Code valid for'}
                  </span>
                </div>

                {/* OTP Inputs */}
                <div className="space-y-3">
                  <div className="flex gap-2 justify-between">
                    {code.map((digit, i) => (
                      <input
                        key={i}
                        id={`otp-digit-${i}`}
                        ref={(el) => { otpRefs.current[i] = el; }}
                        type="text"
                        inputMode="numeric"
                        maxLength={1}
                        value={digit}
                        onChange={(e) => handleOtpChange(i, e.target.value)}
                        onKeyDown={(e) => handleOtpKeyDown(i, e)}
                        className={`w-full aspect-square text-center text-xl font-mono font-bold bg-brand-card border-2 rounded-lg focus:outline-none transition-all duration-200 cursor-text ${
                          digit
                            ? 'border-[#2D6A4F] bg-[#1F3E2B]/5 text-[#1F3E2B]'
                            : 'border-brand-border/40 text-brand-primary focus:border-[#2D6A4F]'
                        } ${codeError ? 'border-red-400 bg-red-50 shake-error' : ''}`}
                      />
                    ))}
                  </div>

                  {codeError && (
                    <p className="text-[11px] text-red-500 font-sans flex items-center gap-1.5">
                      <AlertCircle size={11} /> {codeError}
                    </p>
                  )}
                </div>

                <button
                  id="otp-verify-btn"
                  onClick={handleVerifyCode}
                  className="w-full py-4 bg-[#1F3E2B] hover:bg-[#2D6A4F] text-white font-mono text-xs tracking-widest uppercase font-black rounded-sm transition-all duration-300 shadow hover:scale-[1.02] cursor-pointer flex items-center justify-center gap-2"
                >
                  <ShieldCheck size={13} />
                  VERIFY CODE
                </button>

                {/* Resend */}
                <div className="text-center">
                  {resendCooldown > 0 ? (
                    <p className="text-[10px] font-mono text-neutral-400 tracking-wide uppercase">
                      Resend available in{' '}
                      <span className="text-brand-primary font-bold">{resendCooldown}s</span>
                    </p>
                  ) : (
                    <button
                      id="resend-code-btn"
                      onClick={handleResendCode}
                      className="text-[10px] font-mono text-[#2D6A4F] hover:text-[#1F3E2B] tracking-wide uppercase font-bold transition-colors cursor-pointer flex items-center gap-1 mx-auto"
                    >
                      <RotateCcw size={10} />
                      Resend Code{resendCount > 0 ? ` (${resendCount})` : ''}
                    </button>
                  )}
                </div>

                <p className="text-[9px] font-mono text-neutral-400 text-center tracking-wider uppercase">
                  Check your spam folder if you don't see the email
                </p>
              </Wrapper>
            )}

            {/* ── STAGE 4: EXPIRED ─────────────────────────────────────── */}
            {stage === 'expired' && (
              <Wrapper key="expired">
                <div className="flex flex-col items-center text-center gap-5 py-8">
                  <div className="w-20 h-20 rounded-full bg-red-50 border-2 border-red-200 flex items-center justify-center">
                    <Clock size={30} className="text-red-500" />
                  </div>
                  <div>
                    <h2 className="font-display font-light text-2xl text-brand-primary uppercase tracking-tight">
                      CODE EXPIRED
                    </h2>
                    <p className="text-xs text-neutral-500 font-sans mt-2 leading-relaxed">
                      Your 10-minute recovery code has expired.<br />Please request a new one to continue.
                    </p>
                  </div>
                  <div className="w-full space-y-3 pt-2">
                    <button
                      id="request-new-code-btn"
                      onClick={handleResendCode}
                      className="w-full py-4 bg-[#1F3E2B] hover:bg-[#2D6A4F] text-white font-mono text-xs tracking-widest uppercase font-black rounded-sm transition-all duration-300 shadow hover:scale-[1.02] cursor-pointer flex items-center justify-center gap-2"
                    >
                      <RotateCcw size={13} />
                      REQUEST NEW CODE
                    </button>
                    <button
                      onClick={() => setStage('email')}
                      className="w-full text-center text-[10px] font-mono text-neutral-400 hover:text-brand-primary transition-colors cursor-pointer tracking-wide uppercase"
                    >
                      Change email address
                    </button>
                  </div>
                </div>
              </Wrapper>
            )}

            {/* ── STAGE 5: WRONG CODE ──────────────────────────────────── */}
            {stage === 'wrong_code' && (
              <Wrapper key="wrong_code">
                <div className="flex flex-col items-center text-center gap-5 py-8">
                  <div className="w-20 h-20 rounded-full bg-amber-50 border-2 border-amber-200 flex items-center justify-center">
                    <AlertCircle size={30} className="text-amber-500" />
                  </div>
                  <div>
                    <h2 className="font-display font-light text-2xl text-brand-primary uppercase tracking-tight">
                      INCORRECT CODE
                    </h2>
                    <p className="text-xs text-neutral-500 font-sans mt-2 leading-relaxed">
                      The code you entered doesn't match. Please check and try again, or request a new code.
                    </p>
                  </div>
                  <div className="w-full space-y-3 pt-2">
                    <button
                      id="try-again-btn"
                      onClick={() => {
                        setCode(['', '', '', '', '', '']);
                        setCodeError('');
                        setStage('code');
                        setTimeout(() => otpRefs.current[0]?.focus(), 100);
                      }}
                      className="w-full py-4 bg-[#1F3E2B] hover:bg-[#2D6A4F] text-white font-mono text-xs tracking-widest uppercase font-black rounded-sm transition-all duration-300 shadow hover:scale-[1.02] cursor-pointer flex items-center justify-center gap-2"
                    >
                      <KeyRound size={13} />
                      TRY AGAIN
                    </button>
                    <button
                      id="wrong-code-resend-btn"
                      onClick={handleResendCode}
                      disabled={resendCooldown > 0}
                      className={`w-full text-center text-[10px] font-mono tracking-wide uppercase transition-colors cursor-pointer flex items-center justify-center gap-1 ${
                        resendCooldown > 0 ? 'text-neutral-300 cursor-not-allowed' : 'text-[#2D6A4F] hover:text-[#1F3E2B] font-bold'
                      }`}
                    >
                      <RotateCcw size={10} />
                      {resendCooldown > 0 ? `Resend in ${resendCooldown}s` : 'Send a new code instead'}
                    </button>
                  </div>
                </div>
              </Wrapper>
            )}

            {/* ── STAGE 6: NEW PASSWORD ─────────────────────────────────── */}
            {stage === 'new_password' && (
              <Wrapper key="new_password">
                <StageIndicator step={3} />
                <div className="space-y-1">
                  <div className="flex items-center gap-2 mb-1">
                    <div className="w-8 h-8 rounded-lg bg-[#1F3E2B]/10 flex items-center justify-center">
                      <KeyRound size={15} className="text-[#1F3E2B]" />
                    </div>
                    <span className="text-[10px] font-mono tracking-[0.25em] text-brand-secondary uppercase">Step 3 of 4</span>
                  </div>
                  <h2 className="font-display font-light text-3xl text-brand-primary uppercase tracking-tight">
                    SET NEW<br />PASSWORD
                  </h2>
                  <p className="text-xs text-neutral-500 font-sans leading-relaxed pt-1">
                    Create a strong new password for your Knotify account.
                  </p>
                </div>

                <form onSubmit={handleSetPassword} className="space-y-4">
                  <div>
                    <label className="block text-[8px] font-mono font-bold text-neutral-400 uppercase tracking-widest mb-1.5">
                      NEW PASSWORD
                    </label>
                    <div className="relative">
                      <input
                        id="new-password-input"
                        type={showNewPassword ? 'text' : 'password'}
                        required
                        placeholder="Min 6 characters"
                        value={newPassword}
                        onChange={(e) => { setNewPassword(e.target.value); setPasswordError(''); }}
                        className="w-full pl-4 pr-11 py-3 bg-brand-card border border-brand-border/40 focus:border-[#2D6A4F] text-brand-primary font-sans text-xs rounded focus:outline-none transition-all placeholder:text-brand-primary/30"
                      />
                      <button
                        type="button"
                        onClick={() => setShowNewPassword(!showNewPassword)}
                        className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-neutral-400 hover:text-brand-primary transition-colors cursor-pointer"
                      >
                        {showNewPassword ? <EyeOff size={14} /> : <Eye size={14} />}
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-[8px] font-mono font-bold text-neutral-400 uppercase tracking-widest mb-1.5">
                      CONFIRM NEW PASSWORD
                    </label>
                    <div className="relative">
                      <input
                        id="confirm-password-input"
                        type={showConfirmPassword ? 'text' : 'password'}
                        required
                        placeholder="Re-enter your password"
                        value={confirmPassword}
                        onChange={(e) => { setConfirmPassword(e.target.value); setPasswordError(''); }}
                        className="w-full pl-4 pr-11 py-3 bg-brand-card border border-brand-border/40 focus:border-[#2D6A4F] text-brand-primary font-sans text-xs rounded focus:outline-none transition-all placeholder:text-brand-primary/30"
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-neutral-400 hover:text-brand-primary transition-colors cursor-pointer"
                      >
                        {showConfirmPassword ? <EyeOff size={14} /> : <Eye size={14} />}
                      </button>
                    </div>
                  </div>

                  {passwordError && (
                    <p className="text-[10px] text-red-500 font-sans flex items-center gap-1.5">
                      <AlertCircle size={10} /> {passwordError}
                    </p>
                  )}

                  {/* Password strength indicator */}
                  {newPassword.length > 0 && (
                    <div className="space-y-1.5">
                      <div className="flex gap-1">
                        {[1, 2, 3, 4].map((level) => {
                          const strength = Math.min(4, Math.floor(newPassword.length / 3));
                          return (
                            <div
                              key={level}
                              className={`h-1 flex-1 rounded-full transition-all duration-300 ${
                                level <= strength
                                  ? strength <= 1 ? 'bg-red-400'
                                  : strength <= 2 ? 'bg-amber-400'
                                  : strength <= 3 ? 'bg-blue-400'
                                  : 'bg-[#2D6A4F]'
                                  : 'bg-brand-border'
                              }`}
                            />
                          );
                        })}
                      </div>
                      <p className="text-[9px] font-mono text-neutral-400 tracking-wide">
                        {newPassword.length < 4 ? 'Weak' : newPassword.length < 7 ? 'Fair' : newPassword.length < 10 ? 'Good' : 'Strong'} password
                      </p>
                    </div>
                  )}

                  <button
                    id="save-password-btn"
                    type="submit"
                    className="w-full py-4 bg-[#1F3E2B] hover:bg-[#2D6A4F] text-white font-mono text-xs tracking-widest uppercase font-black rounded-sm transition-all duration-300 shadow hover:scale-[1.02] cursor-pointer flex items-center justify-center gap-2 mt-2"
                  >
                    <ShieldCheck size={13} />
                    SAVE NEW PASSWORD
                  </button>
                </form>
              </Wrapper>
            )}

            {/* ── STAGE 7: SUCCESS ──────────────────────────────────────── */}
            {stage === 'success' && (
              <Wrapper key="success">
                <StageIndicator step={4} />
                <div className="flex flex-col items-center text-center gap-5 py-8">
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: 'spring', stiffness: 300, damping: 20, delay: 0.1 }}
                    className="w-24 h-24 rounded-full bg-[#1F3E2B]/10 border-2 border-[#2D6A4F]/30 flex items-center justify-center"
                  >
                    <CheckCircle2 size={44} className="text-[#2D6A4F]" />
                  </motion.div>

                  <div className="space-y-2">
                    <motion.span
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: 0.3 }}
                      className="text-[10px] font-mono tracking-[0.25em] text-[#2D6A4F] uppercase block"
                    >
                      ✓ PASSWORD UPDATED
                    </motion.span>
                    <motion.h2
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.4 }}
                      className="font-display font-light text-3xl text-brand-primary uppercase tracking-tight"
                    >
                      ALL DONE!
                    </motion.h2>
                    <motion.p
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: 0.5 }}
                      className="text-xs text-neutral-500 font-sans leading-relaxed"
                    >
                      Your password has been successfully changed. You can now log in with your new password.
                    </motion.p>
                  </div>

                  <motion.div
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.6 }}
                    className="w-full pt-2 space-y-3"
                  >
                    <button
                      id="go-to-login-btn"
                      onClick={onBackToLogin}
                      className="w-full py-4 bg-[#1F3E2B] hover:bg-[#2D6A4F] text-white font-mono text-xs tracking-widest uppercase font-black rounded-sm transition-all duration-300 shadow hover:scale-[1.02] cursor-pointer flex items-center justify-center gap-2"
                    >
                      <LogIn size={13} />
                      BACK TO LOGIN
                    </button>
                    <p className="text-[9px] font-mono text-neutral-400 tracking-wider uppercase text-center">
                      Knotify Exchange · Covenant University
                    </p>
                  </motion.div>
                </div>
              </Wrapper>
            )}

          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
