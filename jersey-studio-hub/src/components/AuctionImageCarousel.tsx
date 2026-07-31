import React, { useState, useRef } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface AuctionImageCarouselProps {
  imageUrls: string[];
  title: string;
}

export function AuctionImageCarousel({ imageUrls, title }: AuctionImageCarouselProps) {
  const [activeIdx, setActiveIdx] = useState(0);
  const [touchStartX, setTouchStartX] = useState<number | null>(null);
  const [touchEndX, setTouchEndX] = useState<number | null>(null);

  // Minimum swipe distance threshold in pixels
  const minSwipeDistance = 40;

  if (!imageUrls || imageUrls.length === 0) {
    return (
      <div className="w-full h-full bg-slate-900 flex items-center justify-center text-slate-500 font-mono text-xs">
        No Image Available
      </div>
    );
  }

  if (imageUrls.length === 1) {
    return (
      <img 
        src={imageUrls[0]} 
        alt={title} 
        className="w-full h-full object-cover group-hover:scale-105 duration-700 transition-all select-none" 
        referrerPolicy="no-referrer"
        draggable="false"
      />
    );
  }

  const handlePrev = (e?: React.MouseEvent) => {
    if (e) {
      e.stopPropagation();
      e.preventDefault();
    }
    setActiveIdx((prev) => (prev === 0 ? imageUrls.length - 1 : prev - 1));
  };

  const handleNext = (e?: React.MouseEvent) => {
    if (e) {
      e.stopPropagation();
      e.preventDefault();
    }
    setActiveIdx((prev) => (prev === imageUrls.length - 1 ? 0 : prev + 1));
  };

  const handleDotClick = (e: React.MouseEvent, idx: number) => {
    e.stopPropagation();
    e.preventDefault();
    setActiveIdx(idx);
  };

  // Touch handlers
  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchEndX(null);
    setTouchStartX(e.targetTouches[0].clientX);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    setTouchEndX(e.targetTouches[0].clientX);
  };

  const handleTouchEnd = () => {
    if (!touchStartX || !touchEndX) return;
    const distance = touchStartX - touchEndX;
    const isLeftSwipe = distance > minSwipeDistance;
    const isRightSwipe = distance < -minSwipeDistance;
    
    if (isLeftSwipe) {
      handleNext();
    } else if (isRightSwipe) {
      handlePrev();
    }
    setTouchStartX(null);
    setTouchEndX(null);
  };

  // Mouse drag fallback for desktop
  const handleMouseDown = (e: React.MouseEvent) => {
    setTouchEndX(null);
    setTouchStartX(e.clientX);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (touchStartX !== null) {
      setTouchEndX(e.clientX);
    }
  };

  const handleMouseUp = () => {
    if (!touchStartX || !touchEndX) {
      setTouchStartX(null);
      return;
    }
    const distance = touchStartX - touchEndX;
    const isLeftSwipe = distance > minSwipeDistance;
    const isRightSwipe = distance < -minSwipeDistance;

    if (isLeftSwipe) {
      handleNext();
    } else if (isRightSwipe) {
      handlePrev();
    }
    setTouchStartX(null);
    setTouchEndX(null);
  };

  const handleMouseLeave = () => {
    setTouchStartX(null);
    setTouchEndX(null);
  };

  return (
    <div 
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseLeave}
      className="w-full h-full relative group/carousel overflow-hidden cursor-grab active:cursor-grabbing touch-pan-y select-none"
    >
      <img 
        src={imageUrls[activeIdx]} 
        alt={`${title} - Photo ${activeIdx + 1}`} 
        className="w-full h-full object-cover group-hover:scale-102 duration-500 transition-all select-none" 
        referrerPolicy="no-referrer"
        draggable="false"
      />
      
      {/* Navigation arrows (only visible on hover) */}
      <button
        onClick={handlePrev}
        className="absolute left-3 top-1/2 -translate-y-1/2 bg-slate-900/45 hover:bg-slate-900/80 hover:scale-110 text-white p-1.5 rounded-full backdrop-blur-sm opacity-0 group-hover/carousel:opacity-100 transition-all duration-350 z-10 border border-white/10"
        aria-label="Previous image"
      >
        <ChevronLeft className="w-4 h-4" />
      </button>
      
      <button
        onClick={handleNext}
        className="absolute right-3 top-1/2 -translate-y-1/2 bg-slate-900/45 hover:bg-slate-900/80 hover:scale-110 text-white p-1.5 rounded-full backdrop-blur-sm opacity-0 group-hover/carousel:opacity-100 transition-all duration-350 z-10 border border-white/10"
        aria-label="Next image"
      >
        <ChevronRight className="w-4 h-4" />
      </button>

      {/* Position indicator dots */}
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-1 z-20 bg-slate-950/45 py-1 px-2 rounded-full backdrop-blur-xs border border-white/5">
        {imageUrls.map((_, idx) => (
          <button
            key={idx}
            onClick={(e) => handleDotClick(e, idx)}
            className={`w-1.5 h-1.5 rounded-full transition-all ${
              idx === activeIdx ? "bg-amber-400 w-3" : "bg-white/50 hover:bg-white"
            }`}
            aria-label={`Go to slide ${idx + 1}`}
          />
        ))}
      </div>
    </div>
  );
}
