import React, { useRef } from 'react';
import { motion, useScroll, useTransform, useSpring } from 'motion/react';
import { CheckCircle2, Clock, MapPin, ArrowUpRight } from 'lucide-react';

// ─── Helper: Stat Block ──────────────────────────────────────────────────────

function StatBlock({
  value,
  label,
  large = false,
}: {
  value: string;
  label: string;
  large?: boolean;
}) {
  return (
    <div className="flex flex-col items-start">
      <span
        className={`font-display font-black leading-none tracking-tight text-[#FFFEF2] ${
          large ? 'text-7xl sm:text-8xl md:text-[96px]' : 'text-4xl sm:text-5xl'
        }`}
      >
        {value}
      </span>
      <span className="text-[10px] sm:text-xs font-mono tracking-[0.3em] uppercase text-[#FFFEF2]/55 mt-2">
        {label}
      </span>
    </div>
  );
}

// ─── Layer 1 — Who We Are ───────────────────────────────────────────────────

function LayerWhoWeAre() {
  return (
    <div className="absolute inset-0 flex items-center justify-center px-6 sm:px-10 lg:px-20">
      {/* Ambient bg glows */}
      <div className="absolute top-0 left-0 w-[600px] h-[600px] bg-brand-accent/20 rounded-full filter blur-[140px] pointer-events-none -translate-x-1/3 -translate-y-1/3" />
      <div className="absolute bottom-0 right-0 w-[500px] h-[500px] bg-brand-secondary/30 rounded-full filter blur-[120px] pointer-events-none translate-x-1/4 translate-y-1/4" />
      <div className="absolute inset-0 bg-[radial-gradient(rgba(255,254,242,0.035)_1.5px,transparent_1.5px)] bg-[size:28px_28px] pointer-events-none" />

      <div className="max-w-7xl w-full mx-auto relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 lg:gap-28 items-center">

          {/* Left — Headline */}
          <div className="space-y-8">
            <h2 className="font-display font-black text-6xl sm:text-7xl md:text-8xl text-[#FFFEF2] tracking-tight uppercase leading-[0.88]">
              WHO<br />
              <span className="font-serif italic font-light text-[#FFFEF2]/85 relative inline-block">
                WE ARE
                <span className="absolute -bottom-3 left-0 w-full h-[1px] bg-[#FFFEF2]/25" />
              </span>
            </h2>

            <p className="text-lg sm:text-xl text-[#FFFEF2]/80 leading-relaxed max-w-md font-display italic">
              Born inside Peter Hall, Knotify exists to solve the most frustrating morning problem on campus.
            </p>

            <div className="h-[1px] w-12 bg-[#FFFEF2]/20" />

            <p className="text-sm text-[#FFFEF2]/60 leading-relaxed max-w-sm font-sans">
              We are a peer-powered marketplace where graduating scholars sell their regulation-compliant neckwear directly to freshers and juniors — no middlemen, no overpriced stores, no morning panic.
            </p>
          </div>

          {/* Right — Stats + Quote */}
          <div className="space-y-5">
            {/* Big stat */}
            <div className="bg-[#FFFEF2]/[0.055] border border-[#FFFEF2]/[0.09] rounded-2xl p-8 sm:p-10 relative overflow-hidden">
              <div className="absolute -right-8 -bottom-8 w-40 h-40 bg-brand-accent/20 rounded-full filter blur-3xl pointer-events-none" />
              <StatBlock value="1,850+" label="Students serving capacity" large />
            </div>

            {/* Two smaller chips */}
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-[#FFFEF2]/[0.055] border border-[#FFFEF2]/[0.09] rounded-xl p-6">
                <StatBlock value="5 halls" label="Coverage across campus" />
              </div>
              <div className="bg-[#FFFEF2]/[0.055] border border-[#FFFEF2]/[0.09] rounded-xl p-6">
                <StatBlock value="2026" label="Founded by scholars" />
              </div>
            </div>

            {/* Origin story quote */}
            <div className="border-l-2 border-[#FFFEF2]/20 pl-5 py-1">
              <p className="text-sm italic text-[#FFFEF2]/65 leading-relaxed font-display">
                "Knotify was built from a place of helping students retain value and look good without breaking the bank,
                why shuld a student pay the price of a standard meal for a tie?"
              </p>
              <span className="text-[9px] font-mono text-[#FFFEF2]/40 tracking-[0.3em] uppercase mt-2 block">
                — The Founders, Peter Hall, 2026
              </span>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}

// ─── Layer 2 — Why Us ───────────────────────────────────────────────────────

function LayerWhyUs() {
  const reasons = [
    {
      number: '01',
      title: 'Chapel-Verified',
      body: 'Every tie is pre-screened against university dress-code standards before it ever reaches the platform.',
      tag: 'Standards-first',
    },
    {
      number: '02',
      title: 'Same-Hall Speed',
      body: 'Reserve in seconds, pick up in the lobby of your own residential hall within minutes — not days.',
      tag: 'Zero wait time',
    },
    {
      number: '03',
      title: 'Student Pricing',
      body: 'Peer-to-peer means no retail mark-ups. Premium ties at student-friendly prices, every single listing.',
      tag: 'Fair & direct',
    },
  ];

  return (
    <div className="absolute inset-0 flex items-center justify-center px-6 sm:px-10 lg:px-20">
      {/* Ambient glows */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[400px] bg-brand-accent/12 rounded-full filter blur-[160px] pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-[350px] h-[350px] bg-amber-900/15 rounded-full filter blur-[140px] pointer-events-none -translate-x-1/3 translate-y-1/3" />
      <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(255,254,242,0.012)_1px,transparent_1px),linear-gradient(rgba(255,254,242,0.012)_1px,transparent_1px)] bg-[size:64px_64px] pointer-events-none" />

      <div className="max-w-7xl w-full mx-auto relative z-10">
        {/* Header row */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-14 pb-8 border-b border-[#FFFEF2]/[0.08]">
          <h2 className="font-display font-black text-6xl sm:text-7xl md:text-8xl text-[#FFFEF2] tracking-tight uppercase leading-[0.88]">
            WHY<br />
            <span className="font-serif italic font-light text-[#FFFEF2]/85 relative inline-block">
              CHOOSE US
              <span className="absolute -bottom-3 left-0 w-full h-[1px] bg-[#FFFEF2]/25" />
            </span>
          </h2>
          <p className="text-sm text-[#FFFEF2]/50 max-w-[220px] leading-relaxed font-sans hidden sm:block self-end pb-1">
            Three pillars that set Knotify apart from every other option on campus.
          </p>
        </div>

        {/* Cards — icon-free, number-led design with rich hover */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-px bg-[#FFFEF2]/[0.07] rounded-2xl overflow-hidden">
          {reasons.map((r, i) => (
            <div
              key={r.number}
              className="group relative flex flex-col justify-between bg-[#1F3E2B] p-8 sm:p-10 overflow-hidden cursor-default"
              style={{ transition: 'background 0.45s ease, transform 0.35s cubic-bezier(0.22,1,0.36,1), box-shadow 0.35s ease' }}
              onMouseEnter={e => {
                (e.currentTarget as HTMLElement).style.transform = 'translateY(-6px)';
                (e.currentTarget as HTMLElement).style.boxShadow = '0 24px 48px rgba(0,0,0,0.35)';
                (e.currentTarget as HTMLElement).style.background = '#284835';
              }}
              onMouseLeave={e => {
                (e.currentTarget as HTMLElement).style.transform = '';
                (e.currentTarget as HTMLElement).style.boxShadow = '';
                (e.currentTarget as HTMLElement).style.background = '';
              }}
            >
              {/* Hover top-border accent — slides in from left */}
              <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-[#FFFEF2]/0 via-[#FFFEF2]/40 to-[#FFFEF2]/0 scale-x-0 group-hover:scale-x-100 transition-transform duration-500 origin-left" />

              {/* Ghost number — large background watermark */}
              <div className="absolute -right-2 -bottom-6 font-display font-black text-[130px] leading-none text-[#FFFEF2]/[0.035] select-none pointer-events-none group-hover:text-[#FFFEF2]/[0.08] transition-colors duration-500">
                {r.number}
              </div>

              {/* Top: number + tag */}
              <div className="space-y-3 relative z-10">
                <div className="flex items-center justify-between">
                  <span className="font-mono text-[10px] tracking-[0.35em] text-[#FFFEF2]/35 group-hover:text-[#FFFEF2]/60 uppercase font-bold transition-colors duration-400">
                    {r.number}
                  </span>
                  <span className="text-[8px] font-mono tracking-widest uppercase text-[#FFFEF2]/35 group-hover:text-[#FFFEF2]/65 border border-[#FFFEF2]/10 group-hover:border-[#FFFEF2]/30 px-2 py-0.5 rounded-full transition-all duration-400">
                    {r.tag}
                  </span>
                </div>
                <div className="h-[1px] w-full bg-[#FFFEF2]/[0.07] group-hover:bg-[#FFFEF2]/20 transition-colors duration-500" />
              </div>

              {/* Bottom: text */}
              <div className="mt-10 space-y-3 relative z-10">
                <h3 className="font-display font-black text-2xl sm:text-[28px] text-[#FFFEF2] group-hover:text-white uppercase tracking-tight leading-tight transition-colors duration-300">
                  {r.title}
                </h3>
                <p className="text-sm text-[#FFFEF2]/55 group-hover:text-[#FFFEF2]/80 leading-relaxed font-sans transition-colors duration-400">
                  {r.body}
                </p>
                <div className="pt-3 flex items-center gap-1.5 text-[#FFFEF2]/25 group-hover:text-[#FFFEF2]/70 transition-colors duration-300">
                  <ArrowUpRight size={13} className="group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform duration-300" />
                  <span className="text-[9px] font-mono tracking-widest uppercase">More detail</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── Layer 3 — How We Work ──────────────────────────────────────────────────

function LayerHowWeWork() {
  const steps = [
    {
      number: '01',
      title: 'Browse & Reserve',
      description: 'Search by color, pattern, or hall. Place a small reservation deposit to secure your tie.',
      timeHint: '< 2 min',
    },
    {
      number: '02',
      title: 'Seller Confirms',
      description: 'Your seller gets notified instantly and confirms the lobby handoff time.',
      timeHint: '~5 min',
    },
    {
      number: '03',
      title: 'Lobby Pickup',
      description: 'Inspect the tie in person at your hall lobby. Pay the balance only when satisfied.',
      timeHint: 'Same day',
    },
    {
      number: '04',
      title: 'Walk Outside',
      description: 'Head to class, chapel, or any formal setting looking sharp. Fully compliant, zero stress.',
      timeHint: 'Day 1 ready',
    },
  ];

  return (
    <div className="absolute inset-0 flex items-center justify-center px-6 sm:px-10 lg:px-20">
      {/* Ambient glows */}
      <div className="absolute top-0 right-1/4 w-[500px] h-[400px] bg-sky-900/12 rounded-full filter blur-[160px] pointer-events-none -translate-y-1/3" />
      <div className="absolute bottom-0 left-1/4 w-[500px] h-[400px] bg-brand-secondary/20 rounded-full filter blur-[140px] pointer-events-none translate-y-1/3" />
      <div className="absolute inset-0 bg-[linear-gradient(135deg,rgba(255,254,242,0.018)_1px,transparent_1px)] bg-[size:80px_80px] pointer-events-none" />

      <div className="max-w-7xl w-full mx-auto relative z-10">
        {/* Header */}
        <div className="mb-12 sm:mb-16">
          <h2 className="font-display font-black text-6xl sm:text-7xl md:text-8xl text-[#FFFEF2] tracking-tight uppercase leading-[0.88]">
            HOW WE<br />
            <span className="font-serif italic font-light text-[#FFFEF2]/85 relative inline-block">
              WORK
              <span className="absolute -bottom-3 left-0 w-full h-[1px] bg-[#FFFEF2]/25" />
            </span>
          </h2>
        </div>

        {/* Steps — clean numbered horizontal list */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 divide-y sm:divide-y-0 sm:divide-x divide-[#FFFEF2]/[0.07]">
          {steps.map((step, i) => {
            const isLast = i === steps.length - 1;
            return (
              <div key={step.number} className="group relative flex flex-col gap-6 px-0 sm:px-8 py-6 sm:py-0 first:pl-0 last:pr-0">

                {/* Step number — large and proud */}
                <div className="flex items-baseline gap-3">
                  <span className="font-display font-black text-[56px] sm:text-[64px] leading-none text-[#FFFEF2]/[0.12] group-hover:text-[#FFFEF2]/[0.22] transition-colors duration-500 select-none">
                    {step.number}
                  </span>
                </div>

                {/* Time badge */}
                <div className="inline-flex self-start items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#FFFEF2]/[0.06] border border-[#FFFEF2]/[0.09]">
                  <span className="w-1 h-1 rounded-full bg-emerald-400" />
                  <span className="text-[8px] font-mono tracking-widest uppercase text-[#FFFEF2]/55">
                    {step.timeHint}
                  </span>
                </div>

                {/* Text */}
                <div className="space-y-2.5">
                  <h3 className="font-display font-black text-xl sm:text-2xl text-[#FFFEF2] uppercase tracking-tight leading-tight">
                    {step.title}
                  </h3>
                  <p className="text-sm text-[#FFFEF2]/55 leading-relaxed font-sans">
                    {step.description}
                  </p>
                </div>

                {/* Expanding bottom line accent */}
                <div className="h-[1px] w-6 bg-[#FFFEF2]/15 group-hover:w-12 group-hover:bg-[#FFFEF2]/35 transition-all duration-500" />
              </div>
            );
          })}
        </div>

        {/* Bottom strip */}
        <div className="mt-14 pt-7 border-t border-[#FFFEF2]/[0.07] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <p className="text-sm text-[#FFFEF2]/45 font-display italic">
            From browse to fully dressed — the entire journey in under 30 minutes.
          </p>
          <span className="text-[9px] font-mono tracking-[0.35em] uppercase text-[#FFFEF2]/30">
            Zero shipping. Zero waiting.
          </span>
        </div>
      </div>
    </div>
  );
}

// ─── Main Export ─────────────────────────────────────────────────────────────

export default function AboutSection() {
  const containerRef = useRef<HTMLDivElement>(null);

  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ['start start', 'end end'],
  });

  // Smooth the raw scroll progress through a spring so the crossfades feel
  // organic rather than frame-locked to wheel ticks.
  const smooth = useSpring(scrollYProgress, {
    stiffness: 80,
    damping: 22,
    restDelta: 0.001,
  });

  // ── Layer 1: fully visible 0 → 30%, crossfades OUT over 30–40%
  const opacity1 = useTransform(smooth, [0, 0.02, 0.30, 0.40], [0, 1, 1, 0]);
  const y1       = useTransform(smooth, [0, 0.02, 0.30, 0.40], [24, 0, 0, -48]);
  const scale1   = useTransform(smooth, [0, 0.02, 0.30, 0.40], [0.97, 1, 1, 0.95]);

  // ── Layer 2: fades IN over 30–40%, fully visible 40 → 63%, crossfades OUT over 63–73%
  const opacity2 = useTransform(smooth, [0.30, 0.40, 0.63, 0.73], [0, 1, 1, 0]);
  const y2       = useTransform(smooth, [0.30, 0.40, 0.63, 0.73], [48, 0, 0, -48]);
  const scale2   = useTransform(smooth, [0.30, 0.40, 0.63, 0.73], [1.03, 1, 1, 0.95]);

  // ── Layer 3: fades IN over 63–73%, fully visible 73 → 100%
  const opacity3 = useTransform(smooth, [0.63, 0.73, 1], [0, 1, 1]);
  const y3       = useTransform(smooth, [0.63, 0.73], [48, 0]);
  const scale3   = useTransform(smooth, [0.63, 0.73], [1.03, 1]);

  return (
    <div
      ref={containerRef}
      className="relative"
      style={{ height: '400vh' }}
      id="about-scroll-section"
    >
      <div className="sticky top-0 h-screen overflow-hidden bg-brand-secondary">

        {/* ── LAYER 1: WHO WE ARE ── */}
        <motion.div
          className="absolute inset-0 will-change-transform"
          style={{ opacity: opacity1, y: y1, scale: scale1 }}
        >
          <LayerWhoWeAre />
        </motion.div>

        {/* ── LAYER 2: WHY US ── */}
        <motion.div
          className="absolute inset-0 will-change-transform"
          style={{ opacity: opacity2, y: y2, scale: scale2 }}
        >
          <LayerWhyUs />
        </motion.div>

        {/* ── LAYER 3: HOW WE WORK ── */}
        <motion.div
          className="absolute inset-0 will-change-transform"
          style={{ opacity: opacity3, y: y3, scale: scale3 }}
        >
          <LayerHowWeWork />
        </motion.div>

      </div>
    </div>
  );
}
