import React from 'react';

interface TiePlaceholderProps {
  color?: string;
  category?: string;
  name?: string;
  className?: string;
}

export default function TiePlaceholder({
  color = 'Navy',
  category = 'Official Tie',
  name = 'Covenant Tie',
  className = 'w-full h-full'
}: TiePlaceholderProps) {
  // Determine color themes based on Covenant University standard guidelines
  const getThemeColors = () => {
    switch (color) {
      case 'Navy':
        return {
          bg: 'bg-gradient-to-b from-[#101F42] to-[#0A1329]',
          border: 'border-[#1E3A8A]/30',
          accent: '#3B82F6',
          tieColor: '#1E40AF',
          stripeColor: '#60A5FA',
          textColor: 'text-neutral-400'
        };
      case 'Crimson':
        return {
          bg: 'bg-gradient-to-b from-[#4A0E17] to-[#2D090E]',
          border: 'border-[#991B1B]/30',
          accent: '#EF4444',
          tieColor: '#991B1B',
          stripeColor: '#F87171',
          textColor: 'text-neutral-400'
        };
      case 'Gold':
        return {
          bg: 'bg-gradient-to-b from-[#785918] to-[#45320A]',
          border: 'border-[#F59E0B]/30',
          accent: '#FBBF24',
          tieColor: '#B45309',
          stripeColor: '#FCD34D',
          textColor: 'text-neutral-300'
        };
      case 'Forest Green':
        return {
          bg: 'bg-gradient-to-b from-[#0F3622] to-[#081F13]',
          border: 'border-[#065F46]/30',
          accent: '#10B981',
          tieColor: '#065F46',
          stripeColor: '#34D399',
          textColor: 'text-neutral-400'
        };
      case 'Black':
        return {
          bg: 'bg-gradient-to-b from-[#1F1F1F] to-[#121212]',
          border: 'border-neutral-800',
          accent: '#E5E5E5',
          tieColor: '#262626',
          stripeColor: '#737373',
          textColor: 'text-neutral-500'
        };
      case 'Stripes':
        return {
          bg: 'bg-gradient-to-b from-[#1E293B] to-[#0F172A]',
          border: 'border-slate-700',
          accent: '#F1F5F9',
          tieColor: '#334155',
          stripeColor: '#94A3B8',
          textColor: 'text-slate-400'
        };
      default:
        return {
          bg: 'bg-gradient-to-b from-[#2E2C28] to-[#1C1A17]',
          border: 'border-neutral-800',
          accent: '#D4D4D4',
          tieColor: '#404040',
          stripeColor: '#A3A3A3',
          textColor: 'text-neutral-500'
        };
    }
  };

  const theme = getThemeColors();

  // Pick elegant initials or brief label
  const displayLabel = name.split(' ').slice(0, 3).join(' ');

  return (
    <div 
      className={`relative flex flex-col items-center justify-between p-4 overflow-hidden select-none select-none text-center ${theme.bg} ${className}`}
      id="tie-placeholder-container"
    >
      {/* Background Micro Grid Pattern for Sartorial Texture */}
      <div className="absolute inset-0 opacity-[0.03] pointer-events-none bg-[radial-gradient(#fff_1px,transparent_1px)] [background-size:12px_12px]" />

      {/* Header Info */}
      <div className="relative z-10 w-full flex flex-col items-center">
        <span className="text-[7.5px] font-mono uppercase tracking-[0.25em] text-[#F5F2EB]/60">
          KNOTIFY. ARCHIVE
        </span>
        <div className="h-px w-6 bg-[#F5F2EB]/20 my-1" />
      </div>

      {/* Vector Tie Emblem Container */}
      <div className="relative z-10 w-full flex flex-col items-center justify-center flex-1 my-2">
        <svg 
          viewBox="0 0 100 160" 
          className="w-20 h-28 drop-shadow-[0_4px_12px_rgba(0,0,0,0.5)]"
          fill="none" 
          xmlns="http://www.w3.org/2000/svg"
        >
          {/* Collar Line / Hanger Accent */}
          <path d="M20 15 H80" stroke="#F5F2EB" strokeWidth="1" strokeOpacity="0.15" strokeDasharray="3 3" />
          
          {/* Subtle glow / shadow accent behind the tie */}
          <path 
            d="M 40 28 L 60 28 L 56 46 L 50 130 L 44 46 Z" 
            fill="black" 
            opacity="0.3"
          />

          {/* Knot of the Tie */}
          <path 
            d="M 38 28 L 62 28 L 57 48 L 43 48 Z" 
            fill={theme.tieColor} 
            stroke="#F5F2EB" 
            strokeWidth="1"
            strokeOpacity="0.25"
          />
          
          {/* Body of the Tie */}
          <path 
            d="M 43 48 L 57 48 L 62 120 L 50 136 L 38 120 Z" 
            fill={theme.tieColor} 
            stroke="#F5F2EB" 
            strokeWidth="1"
            strokeOpacity="0.25"
          />

          {/* Pattern Stripes on the Tie Body */}
          {color === 'Stripes' ? (
            <g opacity="0.35">
              <path d="M 41 60 L 55 52 M 40 80 L 58 70 M 39 100 L 61 88 M 42 120 L 58 111" stroke={theme.stripeColor} strokeWidth="2.5" strokeLinecap="round" />
            </g>
          ) : (
            /* Classic single diagonal stripe or crest for premium/official */
            <g opacity="0.2">
              <path d="M 43 65 L 57 57 M 42 85 L 58 77 M 40 105 L 60 97" stroke="#F5F2EB" strokeWidth="1.5" strokeLinecap="round" />
            </g>
          )}

          {/* Academic Laurel / Stars Indicator of Chapel Compliance */}
          <g transform="translate(42, 6) scale(0.8)" opacity="0.25">
            <circle cx="10" cy="10" r="2" fill="#F5F2EB" />
            <path d="M 5 10 C 5 7, 15 7, 15 10 C 15 13, 5 13, 5 10" stroke="#F5F2EB" strokeWidth="0.75" />
          </g>
        </svg>
      </div>

      {/* Footer Info / Custom Labeling */}
      <div className="relative z-10 w-full space-y-1">
        <p className="font-sans font-medium text-[10px] text-[#F5F2EB] tracking-tight line-clamp-1 opacity-90 uppercase">
          {displayLabel}
        </p>
        <div className="flex items-center justify-center gap-1.5 text-[7px] font-mono uppercase tracking-widest text-neutral-400">
          <span>{color}</span>
          <span>&bull;</span>
          <span>{category}</span>
        </div>
      </div>
    </div>
  );
}
