import { useState, useRef, useEffect } from 'react';
import { Search, ShoppingBag, User as UserIcon, Bell, Crown, Settings, Wallet, LogOut, User, ShieldCheck, LogIn, Menu, X, Instagram, MessageCircle, Music2, Shirt, Car, Star, Gavel, Plus, ShieldAlert } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/src/lib/utils';
import { ViewType } from '@/src/App';
import { SiloType } from '@/src/components/SiloSwitcher';
import { motion, AnimatePresence } from 'motion/react';
import { auth, signInWithGoogle } from '@/src/lib/firebase';
import { signOut } from 'firebase/auth';
import Logo from '@/src/components/Logo';

interface NavigationProps {
  currentView: ViewType;
  onToggleView: (view: ViewType) => void;
  onComingSoon: (feature: string) => void;
  activeSilo: SiloType;
  onSiloChange: (silo: SiloType) => void;
  userRole?: string | null;
  isAdmin?: boolean;
  onOpenPostingModal?: () => void;
  cartCount?: number;
}

export default function Navigation({ currentView, onToggleView, onComingSoon, activeSilo, onSiloChange, userRole, isAdmin, onOpenPostingModal, cartCount = 0 }: NavigationProps) {
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const mobileMenuRef = useRef<HTMLDivElement>(null);
  const user = auth.currentUser;
  const isUserAdmin = isAdmin || userRole === 'admin' || user?.email?.toLowerCase() === 'itztahirismail@gmail.com';

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setShowProfileMenu(false);
      }
      if (mobileMenuRef.current && !mobileMenuRef.current.contains(event.target as Node)) {
        setShowMobileMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSignOut = async () => {
    try {
      await signOut(auth);
    } catch (e) {
      console.warn("Sign out error handled:", e);
    }
    localStorage.removeItem('local_backup_guest_user');
    setShowProfileMenu(false);
    setShowMobileMenu(false);
  };

  const handleAction = (feature: ViewType) => {
    onToggleView(feature);
    setShowProfileMenu(false);
    setShowMobileMenu(false);
  };

  const navLinks = [
    { label: 'Store', value: 'store' as ViewType },
    { label: 'Collection', value: 'collection' as ViewType },
    ...(!isUserAdmin ? [
      { label: 'Carts', value: 'orders' as ViewType },
    ] : []),
    ...(isUserAdmin ? [
      { label: 'Admin Control 🛡️', value: 'admin' as ViewType },
    ] : []),
    { label: 'Live Auction 🔨', value: 'bidding' as ViewType },
    { label: 'About Us', value: 'about' as ViewType },
  ];

  const socialLinks = [
    { icon: Instagram, label: 'Instagram Automobiles', href: 'https://instagram.com/uncleteeautomobiles', color: 'hover:text-pink-600' },
    { icon: Instagram, label: 'Instagram Official', href: 'https://instagram.com/uncleteeee.ng', color: 'hover:text-pink-600' },
    { icon: MessageCircle, label: 'WhatsApp', href: 'https://wa.me/2348138642942', color: 'hover:text-green-500' },
    { icon: Music2, label: 'TikTok', href: 'https://tiktok.com/@uncleteeautos', color: 'hover:text-slate-900' },
  ];

  return (
    <nav className="fixed top-0 w-full z-50 border-b border-slate-200 bg-white shadow-sm">
      <div className="max-w-7xl mx-auto px-4 md:px-8 h-16 flex items-center justify-between">
        <div className="flex items-center gap-4 md:gap-8">
          <button 
            onClick={() => setShowMobileMenu(!showMobileMenu)}
            className="p-2 -ml-2 md:hidden text-slate-500 hover:text-slate-900 transition-colors"
          >
            {showMobileMenu ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>

          <button 
            onClick={() => handleAction('store')}
            className="flex items-center"
          >
            <Logo className="hidden md:block" height={40} />
            <Logo className="md:hidden" height={32} />
          </button>
          
          <div className="hidden md:flex gap-6 text-sm font-semibold text-slate-500">
            {navLinks.map((link) => (
              <button 
                key={link.value}
                onClick={() => onToggleView(link.value)}
                className={cn(
                  "py-5 transition-colors border-b-2 hover:text-slate-800",
                  currentView === link.value ? "text-indigo-600 border-indigo-600" : "border-transparent"
                )}
              >
                {link.label}
              </button>
            ))}
          </div>
        </div>

        <div className="flex-1 max-w-sm mx-8 hidden lg:block">
          <div className="relative group">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-indigo-600 transition-colors" />
            <input 
              type="text" 
              placeholder="Search assets, VIN, or brands..." 
              className="w-full bg-slate-100 border-none rounded-md py-2 pl-10 pr-4 text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none transition-all"
            />
          </div>
        </div>

        <div className="flex items-center gap-1 md:gap-2">
          {isUserAdmin && onOpenPostingModal && (
            <button
              onClick={onOpenPostingModal}
              className="flex items-center gap-1.5 px-3 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-[10px] font-black uppercase tracking-widest transition-all shadow-sm font-sans"
              title="Post new asset as Admin"
            >
              <Plus className="w-3.5 h-3.5" /> <span className="hidden sm:inline">Post Asset</span>
            </button>
          )}

          {!isUserAdmin && (
            <Button 
              variant="ghost" 
              size="icon" 
              className="text-slate-700 hover:text-indigo-600 relative transition-colors hidden sm:flex"
              onClick={() => onToggleView('orders')}
              title="View My Cart & Requests"
            >
              <ShoppingBag className="w-5 h-5 text-indigo-600" />
              {cartCount > 0 && (
                <span className="absolute -top-1 -right-1 h-4 min-w-[16px] px-1 bg-indigo-600 text-white text-[9px] font-black rounded-full flex items-center justify-center shadow-sm">
                  {cartCount}
                </span>
              )}
            </Button>
          )}
          <div className="hidden sm:block w-px h-6 bg-slate-200 mx-2" />
          
          <div className="relative" ref={menuRef}>
            {user ? (
              <button 
                onClick={() => {
                  if (window.innerWidth < 768) {
                    setShowMobileMenu(true);
                  } else {
                    setShowProfileMenu(!showProfileMenu);
                  }
                }}
                className="flex items-center gap-2 md:gap-3 pl-2 group outline-none"
              >
                 <div className="h-8 w-8 rounded-full bg-slate-800 flex items-center justify-center text-white text-xs font-bold ring-2 ring-slate-100 group-hover:ring-indigo-100 transition-all">
                   {user.photoURL ? <img src={user.photoURL} alt="" className="w-full h-full rounded-full" referrerPolicy="no-referrer" /> : (user.displayName?.[0] || 'U')}
                 </div>
                 <div className="hidden sm:flex flex-col items-start leading-none">
                   <span className="text-[11px] font-black text-slate-900 uppercase tracking-tight">{user.displayName?.split(' ')[0] || 'User'}</span>
                   <span className={cn("text-[9px] font-bold uppercase tracking-widest", isUserAdmin ? "text-amber-600 font-black" : "text-indigo-600")}>
                     {isUserAdmin ? "Admin" : "Verified User"}
                   </span>
                 </div>
              </button>
            ) : (
              <button 
                onClick={() => signInWithGoogle()}
                className="flex items-center gap-1.5 px-3 py-2 bg-slate-900 text-white rounded-xl text-[9px] md:text-[10px] font-bold uppercase tracking-widest hover:bg-slate-800 transition-all shadow-sm"
                title="Google Authentication"
              >
                <LogIn className="w-3 h-3" /> <span className="hidden xs:inline">Connect Google</span><span className="xs:hidden">Google</span>
              </button>
            )}

            <AnimatePresence>
              {showProfileMenu && user && (
                <motion.div 
                  initial={{ opacity: 0, y: 10, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 10, scale: 0.95 }}
                  className="absolute right-0 mt-3 w-56 bg-white border border-slate-200 rounded-2xl shadow-2xl overflow-hidden z-[60]"
                >
                  <div className="p-4 bg-slate-50 border-b border-slate-200">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-full bg-indigo-600 flex items-center justify-center text-white font-bold text-sm">
                        {user.photoURL ? <img src={user.photoURL} alt="" className="w-full h-full rounded-full" referrerPolicy="no-referrer" /> : (user.displayName?.[0] || 'U')}
                      </div>
                      <div className="overflow-hidden">
                        <p className="text-sm font-black text-slate-900 tracking-tight truncate">{user.displayName || 'User'}</p>
                        <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">
                          {isUserAdmin ? 'Role: Admin' : 'Member'}
                        </p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="p-2">
                    {isUserAdmin && (
                      <button 
                        onClick={() => handleAction('admin')}
                        className="w-full flex items-center gap-3 px-3 py-2 text-xs font-black text-amber-700 bg-amber-50 hover:bg-amber-100 rounded-xl transition-all mb-1 group"
                      >
                        <ShieldAlert className="w-4 h-4 text-amber-600" />
                        Admin Dashboard
                      </button>
                    )}
                    {[
                      ...(!isUserAdmin ? [{ icon: ShoppingBag, label: 'My Cart / Active Requests', value: 'orders' as ViewType }] : []),
                      { icon: User, label: 'Profile Settings', value: 'profile' as ViewType },
                      { icon: Wallet, label: 'Transaction Hub', value: 'transactions' as ViewType }
                    ].map((item) => (
                      <button 
                        key={item.value}
                        onClick={() => handleAction(item.value)}
                        className="w-full flex items-center gap-3 px-3 py-2 text-xs font-bold text-slate-600 hover:bg-slate-50 hover:text-slate-900 rounded-xl transition-all group"
                      >
                        <item.icon className="w-4 h-4 text-slate-400 group-hover:text-indigo-600" />
                        {item.label}
                      </button>
                    ))}
                  </div>
                  
                  <div className="p-2 bg-slate-50">
                    <button 
                      onClick={handleSignOut}
                      className="w-full flex items-center gap-3 px-3 py-2 text-xs font-black text-red-500 hover:bg-red-50 rounded-xl transition-all"
                    >
                      <LogOut className="w-4 h-4" />
                      TERMINATE SESSION
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>

      {/* Mobile Menu Overlay */}
      <AnimatePresence>
        {showMobileMenu && (
          <>
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[55] md:hidden"
              onClick={() => setShowMobileMenu(false)}
            />
            <motion.div 
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed inset-y-0 left-0 w-72 bg-white z-[60] md:hidden shadow-2xl p-6"
              ref={mobileMenuRef}
            >
              <div className="flex flex-col h-full">
                <div className="flex items-center justify-between mb-8">
                  <h2 className="text-xl font-black text-slate-900 uppercase tracking-tighter">Menu</h2>
                  <button onClick={() => setShowMobileMenu(false)} className="p-2 text-slate-400 hover:text-slate-900 transition-colors">
                    <X className="w-6 h-6" />
                  </button>
                </div>

                <div className="space-y-4 flex-1 overflow-y-auto pr-2">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-4 mt-6">Product Silos</p>
                  <div className="grid grid-cols-1 gap-2">
                    {[
                      { icon: Shirt, label: 'Wardrobe', value: 'wardrobe' as SiloType },
                      { icon: Star, label: 'Jersey Studio', value: 'jersey' as SiloType },
                      { icon: Car, label: 'The Garage', value: 'garage' as SiloType },
                      { icon: Gavel, label: 'Live Auction', value: 'bidding' as SiloType },
                    ].map((silo) => (
                      <button
                        key={silo.value}
                        onClick={() => {
                          if (silo.value === 'bidding') {
                            onToggleView('bidding');
                          } else {
                            onSiloChange(silo.value);
                            onToggleView('store');
                          }
                          setShowMobileMenu(false);
                        }}
                        className={cn(
                          "w-full flex items-center gap-4 px-4 py-4 rounded-2xl text-sm font-black uppercase tracking-widest transition-all",
                          activeSilo === silo.value 
                            ? "bg-slate-900 text-white shadow-lg shadow-slate-200" 
                            : "text-slate-600 hover:bg-slate-50 border border-slate-100"
                        )}
                      >
                        <silo.icon className={cn("w-5 h-5", activeSilo === silo.value ? "text-indigo-400" : "text-slate-400")} />
                        {silo.label}
                      </button>
                    ))}
                  </div>

                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-4 mt-8">Navigation Hub</p>
                  {navLinks.map((link) => (
                    <button
                      key={link.value}
                      onClick={() => handleAction(link.value)}
                      className={cn(
                        "w-full flex items-center gap-4 px-4 py-4 rounded-2xl text-sm font-black uppercase tracking-widest transition-all",
                        currentView === link.value 
                          ? "bg-indigo-600 text-white shadow-lg shadow-indigo-200" 
                          : "text-slate-600 hover:bg-slate-50"
                      )}
                    >
                      {link.label}
                    </button>
                  ))}

                  {user ? (
                    <>
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-4 mt-8">Account Management</p>
                      <div className="grid grid-cols-1 gap-2">
                        {[
                          { icon: User, label: 'Profile Settings', value: 'profile' as ViewType },
                          { icon: Wallet, label: 'Transaction Hub', value: 'transactions' as ViewType }
                        ].map((item) => (
                          <button 
                            key={item.value}
                            onClick={() => handleAction(item.value)}
                            className={cn(
                              "w-full flex items-center gap-4 px-4 py-4 rounded-2xl text-sm font-black uppercase tracking-widest transition-all",
                              currentView === item.value 
                                ? "bg-indigo-600 text-white shadow-lg shadow-indigo-200" 
                                : "text-slate-600 hover:bg-slate-50"
                            )}
                          >
                            <item.icon className="w-5 h-5" />
                            {item.label}
                          </button>
                        ))}
                        <button 
                          onClick={handleSignOut}
                          className="w-full flex items-center gap-4 px-4 py-4 rounded-2xl text-sm font-black uppercase tracking-widest text-red-500 hover:bg-red-50 transition-all mt-4"
                        >
                          <LogOut className="w-5 h-5" />
                          Sign Out
                        </button>
                      </div>
                    </>
                  ) : (
                    <div className="mt-8">
                      <button 
                        onClick={() => {
                          signInWithGoogle();
                          setShowMobileMenu(false);
                        }}
                        className="w-full flex items-center justify-center gap-3 px-4 py-4 bg-slate-900 text-white rounded-2xl text-xs font-black uppercase tracking-widest hover:bg-slate-800 transition-all"
                      >
                        <LogIn className="w-5 h-5" /> Connect Google
                      </button>
                    </div>
                  )}
                </div>

                <div className="pt-8 mt-auto border-t border-slate-100">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-4">Connect with us</p>
                  
                  <div className="grid grid-cols-4 gap-2 mb-6">
                    {socialLinks.map((social) => (
                      <a 
                        key={social.label}
                        href={social.href}
                        target="_blank"
                        rel="noreferrer"
                        className={cn(
                          "flex items-center justify-center py-4 bg-slate-50 rounded-2xl transition-all active:scale-95 text-slate-400",
                          social.color
                        )}
                        title={social.label}
                      >
                        <social.icon className="w-5 h-5" />
                      </a>
                    ))}
                  </div>

                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-4">Support & Help</p>
                  <button className="w-full flex items-center gap-3 px-4 py-3 text-xs font-bold text-slate-600 hover:bg-slate-50 rounded-xl transition-all">
                    Contact Engineering
                  </button>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </nav>
  );
}

