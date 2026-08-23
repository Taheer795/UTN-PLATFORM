import { SiloType } from '@/src/components/SiloSwitcher';
import SiloSwitcher from '@/src/components/SiloSwitcher';
import { CategoryType } from '@/src/types';
import { Plus, MessageCircle, Instagram, Music2 } from 'lucide-react';
import { Dialog, DialogContent, DialogTrigger } from '@/components/ui/dialog';
import ListingForm from '@/src/components/ListingForm';
import { cn } from '@/src/lib/utils';

interface SidebarContentProps {
  activeSilo: SiloType;
  onSiloChange: (silo: SiloType) => void;
  activeCategory: CategoryType | 'all';
  onCategoryChange: (category: CategoryType | 'all') => void;
  activeFilter: 'all' | 'new' | 'premium';
  onFilterChange: (filter: 'all' | 'new' | 'premium') => void;
  isDialogOpen: boolean;
  setIsDialogOpen: (open: boolean) => void;
  handleAddAsset: (newAsset: any, category: 'wardrobe' | 'garage' | 'jersey') => void;
  currentView: string;
  initialData?: any;
  onOpenChange?: (open: boolean) => void;
  isAdmin?: boolean;
  userRole?: string | null;
}

export default function SidebarContent({
  activeSilo,
  onSiloChange,
  activeCategory,
  onCategoryChange,
  activeFilter,
  onFilterChange,
  isDialogOpen,
  setIsDialogOpen,
  handleAddAsset,
  currentView,
  initialData,
  onOpenChange,
  isAdmin,
  userRole
}: SidebarContentProps) {
  const isJerseySilo = activeSilo === 'jersey';
  const isUserAdmin = isAdmin || userRole === 'admin';

  return (
    <div className="flex flex-col gap-8">
      <section>
        <h3 className="sidebar-label">Product Categories</h3>
        <SiloSwitcher 
          activeSilo={activeSilo} 
          onSiloChange={(silo) => {
            onSiloChange(silo);
            onCategoryChange('all');
          }}
          activeCategory={activeCategory}
          onCategoryChange={onCategoryChange}
        />
      </section>

      <section>
        <h3 className="sidebar-label">Store Dashboard</h3>
        <div className="space-y-4">
          {!isJerseySilo && isUserAdmin && (
            <div className={cn("p-4 bg-white border border-slate-200 rounded-xl shadow-sm", currentView !== 'store' && "opacity-50 grayscale pointer-events-none")}>
              <label className="text-[10px] font-bold text-slate-400 block mb-3 uppercase tracking-widest font-mono">Management (Admin)</label>
              <Dialog open={isDialogOpen} onOpenChange={(open) => {
                setIsDialogOpen(open);
                if (onOpenChange) onOpenChange(open);
              }}>
                <DialogTrigger
                  render={
                    <button 
                      onClick={() => setIsDialogOpen(true)}
                      className="w-full bg-slate-900 text-white p-3 rounded-lg text-xs font-bold uppercase tracking-widest hover:bg-indigo-600 flex items-center justify-center gap-2 shadow-lg shadow-slate-200 transition-all duration-300"
                    >
                      <Plus className="w-4 h-4" /> Add Product
                    </button>
                  }
                />
                <DialogContent className="max-w-[95vw] md:max-w-5xl bg-transparent border-none shadow-none p-0 overflow-hidden outline-none">
                  <ListingForm onAddAsset={handleAddAsset} initialData={initialData} />
                </DialogContent>
              </Dialog>
            </div>
          )}
          
          <div className="p-4 bg-white border border-slate-200 rounded-xl shadow-sm">
            <label className="text-[10px] font-bold text-slate-400 block mb-3 uppercase tracking-widest">Store Filters</label>
            <div className="grid grid-cols-2 gap-2">
              <button 
                onClick={() => onFilterChange(activeFilter === 'new' ? 'all' : 'new')}
                className={cn(
                  "text-[9px] border py-2 rounded font-bold uppercase tracking-tight transition-all",
                  activeFilter === 'new' 
                    ? "border-indigo-600 bg-indigo-50 text-indigo-600 shadow-sm" 
                    : "border-slate-200 bg-slate-50 text-slate-600 hover:bg-slate-100"
                )}
              >
                New Arrivals
              </button>
              <button 
                onClick={() => onFilterChange(activeFilter === 'premium' ? 'all' : 'premium')}
                className={cn(
                  "text-[9px] border py-2 rounded font-bold uppercase tracking-tight transition-all",
                  activeFilter === 'premium' 
                    ? "border-indigo-600 bg-indigo-50 text-indigo-600 shadow-sm" 
                    : "border-slate-200 bg-slate-50 text-slate-600 hover:bg-slate-100"
                )}
              >
                Premium
              </button>
            </div>
          </div>

          <div className="p-4 bg-white border border-slate-200 rounded-xl shadow-sm">
            <label className="text-[10px] font-bold text-slate-400 block mb-4 uppercase tracking-widest">CONTACT US ON</label>
            <div className="flex items-center gap-3">
              <a 
                href="https://wa.me/2348138642942" 
                target="_blank" 
                rel="noreferrer" 
                className="w-10 h-10 flex items-center justify-center bg-slate-50 text-slate-400 border border-slate-100 rounded-lg hover:border-green-500 hover:text-green-500 hover:bg-green-50 transition-all shadow-sm"
                title="WhatsApp"
              >
                <MessageCircle className="w-5 h-5" />
              </a>
              <a 
                href="https://instagram.com/uncleteeautomobiles" 
                target="_blank" 
                rel="noreferrer" 
                className="w-10 h-10 flex items-center justify-center bg-slate-50 text-slate-400 border border-slate-100 rounded-lg hover:border-pink-500 hover:text-pink-500 hover:bg-pink-50 transition-all shadow-sm"
                title="Instagram - Autos (@uncleteeautomobiles)"
              >
                <Instagram className="w-5 h-5" />
              </a>
              <a 
                href="https://instagram.com/uncleteeee.ng" 
                target="_blank" 
                rel="noreferrer" 
                className="w-10 h-10 flex items-center justify-center bg-slate-50 text-slate-400 border border-slate-100 rounded-lg hover:border-blue-500 hover:text-blue-500 hover:bg-blue-50 transition-all shadow-sm"
                title="Instagram - Official"
              >
                <Instagram className="w-5 h-5" />
              </a>
              <a 
                href="https://tiktok.com/@uncleteeautos" 
                target="_blank" 
                rel="noreferrer" 
                className="w-10 h-10 flex items-center justify-center bg-slate-50 text-slate-400 border border-slate-100 rounded-lg hover:border-slate-900 hover:text-slate-900 hover:bg-slate-100 transition-all shadow-sm"
                title="TikTok"
              >
                <Music2 className="w-5 h-5" />
              </a>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
