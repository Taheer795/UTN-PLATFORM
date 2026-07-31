import React, { useEffect, useRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Team, KitVariant, getLogoUrl } from '@/src/lib/jerseyData';
import { cn } from '@/src/lib/utils';

interface JerseyVisualProps {
  team?: Team;
  kit?: KitVariant;
  sport?: 'football' | 'baseball' | 'rugby';
  name: string;
  number: string;
  fontFamily?: string;
  view?: 'front' | 'back';
  className?: string;
}

export default function JerseyVisual({ 
  team, 
  kit, 
  sport = 'football',
  name, 
  number, 
  fontFamily,
  view, 
  className 
 }: JerseyVisualProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const resolvedConfig = useMemo(() => {
    return {
      primaryColor: kit?.primaryColor || '#1e293b',
      secondaryColor: kit?.secondaryColor || '#ffffff',
      logo: getLogoUrl(team?.logo || ''),
      fontFamily: fontFamily || team?.fontFamily || 'Inter',
      name: team?.name || 'CUSTOM'
    };
  }, [team, kit, fontFamily]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    const size = 1024;
    canvas.width = size * dpr;
    canvas.height = size * dpr;
    ctx.scale(dpr, dpr);

    ctx.clearRect(0, 0, size, size);

    if (view === 'front') {
      // 1. Jersey Base Tint
      ctx.save();
      ctx.globalCompositeOperation = 'multiply';
      ctx.fillStyle = resolvedConfig.primaryColor;
      ctx.fillRect(0, 0, size, size);
      ctx.restore();

      // 2. Branding Layouts
      const logoImg = new Image();
      logoImg.crossOrigin = "anonymous";
      logoImg.referrerPolicy = "no-referrer";
      
      let attempts = 0;
      
      const drawCrestPlaceholder = (x: number, y: number, dimension: number) => {
        if (!ctx) return;
        ctx.save();
        ctx.beginPath();
        ctx.arc(x + dimension / 2, y + dimension / 2, dimension / 2, 0, Math.PI * 2);
        ctx.fillStyle = resolvedConfig.secondaryColor;
        ctx.globalAlpha = 0.95;
        ctx.fill();
        
        ctx.strokeStyle = resolvedConfig.primaryColor;
        ctx.lineWidth = dimension * 0.08;
        ctx.stroke();

        ctx.fillStyle = resolvedConfig.primaryColor;
        const fontSize = Math.floor(dimension * 0.5);
        ctx.font = `bold ${fontSize}px ${resolvedConfig.fontFamily}, system-ui`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        
        const initial = (team?.name || 'C')[0].toUpperCase();
        ctx.fillText(initial, x + dimension / 2, y + dimension / 2);
        ctx.restore();
      };

      const onImageLoad = () => {
        if (!ctx) return;
        ctx.save();
        
        const isImageAvailable = logoImg.complete && logoImg.naturalWidth > 0;
        
        if (sport === 'baseball') {
          // Baseball: Arched Team Name
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillStyle = resolvedConfig.secondaryColor;
          ctx.font = `900 ${size * 0.08}px ${resolvedConfig.fontFamily}`;
          ctx.letterSpacing = '10px';
          
          const text = (team?.name || "YANKEES").toUpperCase();
          const centerX = size / 2;
          const centerY = size * 1.05; 
          const radius = size * 0.55;
          const anglePerChar = 0.12;
          const totalAngle = (text.length - 1) * anglePerChar;
          const startAngle = -Math.PI/2 - totalAngle/2;

          text.split('').forEach((char, i) => {
            ctx.save();
            const angle = startAngle + (i * anglePerChar);
            ctx.translate(centerX + Math.cos(angle) * radius, centerY + Math.sin(angle) * radius);
            ctx.rotate(angle + Math.PI/2);
            ctx.fillText(char, 0, 0);
            ctx.restore();
          });

          // Small logo on sleeve (elegant zoomed-out scale)
          const logoSize = size * 0.065;
          if (isImageAvailable) {
            ctx.drawImage(logoImg, size * 0.72, size * 0.38, logoSize, logoSize);
          } else {
            drawCrestPlaceholder(size * 0.72, size * 0.38, logoSize);
          }

        } else if (sport === 'rugby') {
          // Rugby: Centered Crest
          const crestSize = size * 0.12;
          if (isImageAvailable) {
            ctx.drawImage(logoImg, (size - crestSize) / 2, size * 0.35, crestSize, crestSize);
          } else {
            drawCrestPlaceholder((size - crestSize) / 2, size * 0.35, crestSize);
          }

          if (team?.sponsor) {
            ctx.textAlign = 'center';
            ctx.textBaseline = 'top';
            ctx.fillStyle = resolvedConfig.secondaryColor;
            ctx.font = `900 ${size * 0.09}px system-ui`;
            ctx.fillText(team.sponsor, size / 2, size * 0.52);
          }
        } else {
          // Football: Centered Crest
          const crestSize = size * 0.14;
          ctx.shadowColor = 'rgba(0,0,0,0.15)';
          ctx.shadowBlur = 10;
          if (isImageAvailable) {
            ctx.drawImage(logoImg, (size - crestSize) / 2, size * 0.34, crestSize, crestSize);
          } else {
            drawCrestPlaceholder((size - crestSize) / 2, size * 0.34, crestSize);
          }

          if (team?.sponsor) {
            ctx.textAlign = 'center';
            ctx.textBaseline = 'top';
            ctx.fillStyle = resolvedConfig.secondaryColor;
            ctx.font = `900 ${size * 0.08}px system-ui`;
            ctx.letterSpacing = '12px';
            ctx.fillText(team.sponsor, size / 2, size * 0.54);
          }
        }
        ctx.restore();
      };

      logoImg.onload = onImageLoad;
      logoImg.onerror = () => {
        if (attempts === 0) {
          attempts++;
          const currentSrc = logoImg.src;
          if (currentSrc.includes('wsrv.nl/?url=')) {
            try {
              const urlObj = new URL(currentSrc);
              const directUrl = urlObj.searchParams.get('url');
              if (directUrl) {
                console.log(`wsrv.nl failed to load logo, falling back to direct URL: ${directUrl}`);
                logoImg.removeAttribute('crossOrigin');
                logoImg.src = directUrl;
                return;
              }
            } catch (pErr) {
              console.warn("Failed to parse fallback URL from wsrv:", pErr);
            }
          } else if (currentSrc.includes('images.weserv.nl/?url=')) {
            try {
              const urlObj = new URL(currentSrc);
              const directUrl = urlObj.searchParams.get('url');
              if (directUrl) {
                console.log(`images.weserv.nl failed to load logo, falling back to direct URL: ${directUrl}`);
                logoImg.removeAttribute('crossOrigin');
                logoImg.src = directUrl;
                return;
              }
            } catch (pErr) {
              console.warn("Failed to parse fallback URL from weserv:", pErr);
            }
          } else if (currentSrc.includes('/api/proxy-image')) {
            try {
              // Parse using current origin for absolute conversion
              const urlObj = new URL(currentSrc, window.location.origin);
              const directUrl = urlObj.searchParams.get('url');
              if (directUrl) {
                console.log(`Internal proxy failed, falling back to images.weserv.nl: ${directUrl}`);
                logoImg.src = `https://images.weserv.nl/?url=${encodeURIComponent(directUrl)}&w=400&h=400&fit=contain&output=webp`;
                return;
              }
            } catch (pErr) {
              console.warn("Failed to parse fallback URL from internal proxy:", pErr);
            }
          }
        }
        console.warn("Could not load jersey crest logo after attempts. Running canvas drawing sequence with vector placeholder.", resolvedConfig.logo);
        onImageLoad();
      };

      logoImg.src = resolvedConfig.logo;

      // Handle cases where image might already be cached
      if (logoImg.complete && logoImg.naturalWidth > 0) {
        onImageLoad();
      }
    } else {
      // BACK VIEW
      ctx.save();
      ctx.globalCompositeOperation = 'multiply';
      ctx.fillStyle = resolvedConfig.primaryColor;
      ctx.fillRect(0, 0, size, size);
      ctx.restore();

      // 1. Number
      ctx.textAlign = 'center';
      ctx.fillStyle = resolvedConfig.secondaryColor;
      ctx.font = `900 ${size * 0.45}px ${resolvedConfig.fontFamily}, system-ui`;
      ctx.textBaseline = 'middle';
      ctx.fillText(number || '10', size / 2, size * 0.52);

      // 2. Arched Name
      if (name) {
        const text = name.toUpperCase();
        ctx.save();
        ctx.font = `900 ${size * 0.05}px ${resolvedConfig.fontFamily}, system-ui`;
        ctx.letterSpacing = '10px';
        ctx.fillStyle = resolvedConfig.secondaryColor;
        
        const centerX = size / 2;
        const centerY = size * 1.15; 
        const radius = size * 0.9;
        
        const anglePerChar = 0.08;
        const totalAngle = (text.length - 1) * anglePerChar;
        const startAngle = -Math.PI/2 - totalAngle/2;

        text.split('').forEach((char, i) => {
          ctx.save();
          const angle = startAngle + (i * anglePerChar);
          ctx.translate(centerX + Math.cos(angle) * radius, centerY + Math.sin(angle) * radius);
          ctx.rotate(angle + Math.PI/2);
          ctx.fillText(char, 0, 0);
          ctx.restore();
        });
        ctx.restore();
      }
    }
  }, [resolvedConfig, name, number, view, sport, team?.sponsor]);

  const baseImage = useMemo(() => {
    // We use the uploaded master template image
    return 'input_file_0.png';
  }, []);

  return (
    <div className={cn("relative overflow-hidden aspect-square rounded-[3rem] bg-slate-100 shadow-inner", className)}>
      {/* 1. STUDIO BACKGROUND */}
      <div className="absolute inset-0 bg-[#f0f0f0] pattern-grid-slate-200/50" />

      {/* 2. MANNEQUIN BASE */}
      <motion.div 
        key={baseImage}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="absolute inset-0 z-0 scale-[1.1] translate-y-[-2%]"
        style={{
          backgroundImage: `url(${baseImage})`,
          backgroundSize: 'contain',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat'
        }}
      />

      {/* 3. JERSEY COLOR TINT & CUSTOMIZATION CANVAS */}
      <AnimatePresence mode="wait">
        <motion.canvas
          key={view}
          ref={canvasRef}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.4 }}
          style={{ 
            width: '100%', 
            height: '100%',
            mixBlendMode: 'multiply', // This is key for the "pressed" into fabric look
          }}
          className="absolute inset-0 z-10 pointer-events-none scale-[1.1] translate-y-[-2%]"
        />
      </AnimatePresence>

      {/* 4. TEXTURE RECOVERY OVERLAY (Lighting & Creases) */}
      <div 
        className="absolute inset-0 z-20 pointer-events-none mix-blend-overlay opacity-60 scale-[1.1] translate-y-[-2%]"
        style={{
          backgroundImage: `url(${baseImage})`,
          backgroundSize: 'contain',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat',
        }}
      />

      {/* 5. MICRO-FABRIC TEXTURE (Mesh / Grain) */}
      <div 
        className="absolute inset-0 z-20 pointer-events-none opacity-[0.12] mix-blend-soft-light"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`,
          backgroundSize: '150px 150px'
        }}
      />

      {/* 6. FABRIC MESH PATTERN */}
      <div 
        className="absolute inset-0 z-20 pointer-events-none opacity-[0.05] mix-blend-multiply"
        style={{
          backgroundImage: `radial-gradient(#000 1px, transparent 0)`,
          backgroundSize: '4px 4px'
        }}
      />

      {/* 4. DYNAMIC BADGE */}
      <div className="absolute bottom-3 right-3 sm:bottom-8 sm:right-8 z-[30]">
        <motion.div 
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          className="px-3 py-1.5 sm:px-5 sm:py-2.5 bg-slate-900/90 backdrop-blur-xl rounded-xl sm:rounded-2xl border border-white/10 shadow-2xl flex items-center gap-2 sm:gap-4"
        >
          <div className="w-8 h-8 sm:w-10 sm:h-10 bg-white rounded-xl flex items-center justify-center p-2 sm:p-2.5 shadow-inner">
            <img 
              src={resolvedConfig.logo} 
              alt="" 
              className="w-full h-full object-contain" 
              referrerPolicy="no-referrer" 
              onError={(e) => {
                const img = e.currentTarget;
                if (img.src.includes('wsrv.nl/?url=') || img.src.includes('weserv.nl/?url=')) {
                  try {
                    const urlObj = new URL(img.src);
                    const directUrl = urlObj.searchParams.get('url');
                    if (directUrl) {
                      img.src = directUrl;
                    }
                  } catch (_) {}
                }
              }}
            />
          </div>
          <div className="flex flex-col text-left">
            <span className="text-[7px] sm:text-[9px] font-black text-white/40 uppercase tracking-[0.2em] leading-none mb-1">Authentic Gear</span>
            <span className="text-[10px] sm:text-xs font-black text-white uppercase tracking-tighter leading-none italic">
              {resolvedConfig.name}
            </span>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
