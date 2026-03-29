import React from 'react';

interface VerifiedBadgeProps {
  size?: number;
  className?: string;
}

const VerifiedBadge: React.FC<VerifiedBadgeProps> = ({ size = 20, className = '' }) => {
  return (
    <span className={`verified-celestial-wrap ${className}`} style={{ width: size, height: size }}>
      <svg width={size} height={size} viewBox="0 0 100 100" className="verified-rosette">
        <defs>
          <radialGradient id="celestialGradient" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#3b82f6" />
            <stop offset="100%" stopColor="#1e3a8a" />
          </radialGradient>
          <filter id="glow">
            <feGaussianBlur stdDeviation="2.5" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>
        </defs>
        <path 
          d="M50 2 L61 14 L77 10 L82 25 L97 28 L92 43 L98 58 L84 68 L80 83 L64 87 L50 98 L36 87 L20 83 L16 68 L2 58 L8 43 L3 28 L18 25 L23 10 L39 14 Z" 
          fill="url(#celestialGradient)" 
          filter="url(#glow)"
        />
        <path d="M32 52 L45 65 L72 38" fill="none" stroke="white" strokeWidth="10" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </span>
  );
};

export default VerifiedBadge;
