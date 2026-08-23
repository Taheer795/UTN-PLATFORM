import React from 'react';
import { cn } from '@/src/lib/utils';

interface LogoProps {
  className?: string;
  variant?: 'full' | 'mark' | 'favicon' | 'stacked';
  height?: number | string;
  light?: boolean;
}

export default function Logo({ className, variant = 'full', height = 40, light = false }: LogoProps) {
  // Brand color: slate-900 / premium dark
  const primaryColor = '#0f172a';

  if (variant === 'favicon' || variant === 'mark') {
    return (
      <svg width={height} height={height} viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
        <rect width="100" height="100" rx="24" fill="#000000" />
        {/* Mathematically centered and elegant zoomed-out TU monogram (S=0.55) */}
        <g transform="translate(22.5, 23.875) scale(0.55)">
          <path d="M 37 25 L 37 55 A 20 20 0 0 0 77 55 L 77 25" stroke="white" strokeWidth="11" strokeLinecap="square" strokeLinejoin="miter" />
          <path d="M 23 37 L 57 37" stroke="white" strokeWidth="11" strokeLinecap="square" />
          <path d="M 57 37 L 57 57" stroke="white" strokeWidth="11" strokeLinecap="square" />
        </g>
      </svg>
    );
  }

  if (variant === 'stacked') {
    const textColor = light ? '#ffffff' : primaryColor;
    return (
      <svg width={height} height={height} viewBox="0 0 200 200" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
        {/* Monogram scaled down and perfectly centered (S=0.65) */}
        <g transform="translate(67.5, 25) scale(0.65)">
          <path d="M 37 20 L 37 50 A 20 20 0 0 0 77 50 L 77 20" stroke={textColor} strokeWidth="11" strokeLinecap="square" strokeLinejoin="miter" />
          <path d="M 23 32 L 57 32" stroke={textColor} strokeWidth="11" strokeLinecap="square" />
          <path d="M 57 32 L 57 52" stroke={textColor} strokeWidth="11" strokeLinecap="square" />
        </g>
        
        {/* Text "UNCLE TEE" */}
        <text x="100" y="132" fill={textColor} fontFamily="Inter, sans-serif" fontWeight="900" fontSize="24" letterSpacing="0.04em" textAnchor="middle">UNCLE TEE</text>
        
        {/* Text "— N I G E R I A —" */}
        <text x="100" y="162" fill={textColor} fontFamily="Inter, sans-serif" fontWeight="800" fontSize="10" letterSpacing="0.32em" textAnchor="middle">— NIGERIA —</text>
      </svg>
    );
  }

  // Horizontal variant (default: 'full')
  const textColor = light ? '#ffffff' : primaryColor;
  return (
    <div className={cn("flex items-center gap-2", className)} style={{ height }}>
      <svg height="100%" viewBox="0 0 420 100" fill="none" xmlns="http://www.w3.org/2000/svg">
        {/* Icon Mark Background */}
        <rect x="0" y="10" width="80" height="80" rx="20" fill="#000000" />
        
        {/* Stylized TU Monogram - perfectly centered and zoomed out (S=0.55) */}
        <g transform="translate(12.5, 25.25) scale(0.55)">
          <path d="M 37 20 L 37 50 A 20 20 0 0 0 77 50 L 77 20" stroke="white" strokeWidth="11" strokeLinecap="square" strokeLinejoin="miter" />
          <path d="M 23 32 L 57 32" stroke="white" strokeWidth="11" strokeLinecap="square" />
          <path d="M 57 32 L 57 52" stroke="white" strokeWidth="11" strokeLinecap="square" />
        </g>
        
        {/* Text "UNCLE TEE" - balanced vertical alignment */}
        <text x="104" y="51" fill={textColor} fontFamily="Inter, sans-serif" fontWeight="900" fontSize="38" letterSpacing="0.04em">UNCLE TEE</text>
        
        {/* Text "— N I G E R I A —" - centered with the main heading */}
        <text x="104" y="80" fill={textColor} fontFamily="Inter, sans-serif" fontWeight="800" fontSize="15" letterSpacing="0.32em">— NIGERIA —</text>
      </svg>
    </div>
  );
}
