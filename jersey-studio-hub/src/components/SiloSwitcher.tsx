import { Shirt, Car, Star, ChevronDown, Layers, Scissors, Footprints, Watch, Gavel } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '@/src/lib/utils';
import { CategoryType } from '@/src/types';

export type SiloType = 'wardrobe' | 'garage' | 'jersey' | 'bidding';

interface SiloSwitcherProps {
  activeSilo: SiloType;
  onSiloChange: (silo: SiloType) => void;
  activeCategory: CategoryType | 'all';
  onCategoryChange: (category: CategoryType | 'all') => void;
}

export default function SiloSwitcher({ 
  activeSilo, 
  onSiloChange, 
  activeCategory, 
  onCategoryChange 
}: SiloSwitcherProps) {
  const silos = [
    { id: 'wardrobe', label: 'WardrobeStyle', icon: Shirt, color: 'indigo' },
    { id: 'jersey', label: 'Jersey Studio', icon: Star, color: 'amber' },
    { id: 'garage', label: 'The Garage', icon: Car, color: 'indigo' },
    { id: 'bidding', label: 'Live Auction', icon: Gavel, color: 'red' },
  ] as const;

  return (
    <div className="w-full space-y-4">
      <div className="flex flex-col md:flex-col gap-2 md:gap-3 w-full">
        {/* Mobile Scrolling/Desktop Sidebar for Silos */}
        <div className="flex overflow-x-auto pb-2 -mx-4 px-4 scrollbar-none gap-2 md:block md:space-y-3 md:p-0 md:mx-0 md:overflow-visible">
          {silos.map((silo) => (
            <button
              key={silo.id}
              onClick={() => {
                onSiloChange(silo.id as SiloType);
                onCategoryChange('all');
              }}
              className={cn(
                "flex flex-col md:flex-row items-center justify-center md:justify-between p-2.5 md:p-3 rounded-xl md:rounded-lg transition-all duration-300 gap-1 md:gap-0 shrink-0 min-w-[85px] md:min-w-0 md:w-full",
                activeSilo === silo.id 
                  ? silo.color === 'amber' 
                    ? "bg-amber-600 text-white shadow-lg shadow-amber-200" 
                    : silo.color === 'red'
                      ? "bg-red-600 text-white shadow-lg shadow-red-250"
                      : "bg-slate-900 text-white shadow-lg shadow-slate-200"
                  : "bg-white text-slate-600 border border-slate-100 hover:bg-slate-50"
              )}
            >
              <div className="flex flex-col md:flex-row items-center gap-1 md:gap-3">
                <silo.icon className={cn("w-3.5 h-3.5 md:w-4 md:h-4", activeSilo === silo.id ? (silo.id === 'jersey' ? "text-amber-200" : silo.id === 'bidding' ? "text-red-100" : "text-indigo-400") : "text-slate-400")} />
                <span className="text-[9px] md:text-sm font-black md:font-semibold italic uppercase md:normal-case tracking-tighter md:tracking-normal whitespace-nowrap text-center md:text-left leading-none">
                  {silo.label.split(' ')[0]}
                  <span className="hidden md:inline"> {silo.label.split(' ').slice(1).join(' ')}</span>
                </span>
              </div>
              <div className="md:hidden text-[7px] font-black opacity-60 uppercase tracking-tighter leading-none">
                {silo.label.split(' ').slice(1).join(' ') || 'MODE'}
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

