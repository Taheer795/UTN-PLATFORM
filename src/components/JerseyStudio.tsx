import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { LEAGUES, TEAMS, CATEGORIES, League, Team, KitVariant, getLogoUrl } from '@/src/lib/jerseyData';
import JerseyVisual from './JerseyVisual';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { 
  ShoppingBag, 
  CheckCircle2, 
  ChevronLeft,
  Settings2,
  Trophy,
  Activity,
  Shield,
  Layers,
  Search,
  CreditCard,
  ArrowRightLeft,
  Hash,
  Truck
} from 'lucide-react';
import { cn } from '@/src/lib/utils';
import { useFlutterwave, closePaymentModal } from 'flutterwave-react-v3';

interface JerseyStudioProps {
  onAddToCart: (item: any) => void;
}

export default function JerseyStudio({ onAddToCart }: JerseyStudioProps) {
  const [step, setStep] = useState<'category' | 'league' | 'team' | 'kit' | 'customize' | 'delivery'>('category');
  const [activeCategory, setActiveCategory] = useState<string>('football');
  const [selectedLeague, setSelectedLeague] = useState<League | null>(null);
  const [selectedTeam, setSelectedTeam] = useState<Team | null>(null);
  const [selectedKit, setSelectedKit] = useState<KitVariant | null>(null);
  
  const [name, setName] = useState('');
  const [number, setNumber] = useState('');
  const [selectedSize, setSelectedSize] = useState<string>('L');
  const [selectedFont, setSelectedFont] = useState<string>('');
  
  // Delivery details
  const [deliveryInfo, setDeliveryInfo] = useState({
    fullName: '',
    address: '',
    phone: '',
    state: '',
    email: ''
  });

  const [view, setView] = useState<'front' | 'back'>('front');
  const [isAddingToCart, setIsAddingToCart] = useState(false);
  const [checkoutMode, setCheckoutMode] = useState<'cart' | 'instant' | null>(null);
  const [showPayment, setShowPayment] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<'card' | 'transfer' | 'ussd' | null>(null);
  const [orderComplete, setOrderComplete] = useState(false);
  const [isProcessingCard, setIsProcessingCard] = useState(false);

  const flutterConfig = useMemo(() => ({
    public_key: (import.meta as any).env.VITE_FLUTTERWAVE_PUBLIC_KEY || 'FLWPUBK_TEST-placeholder-key',
    tx_ref: (new Date()).getTime().toString(),
    amount: 25000,
    currency: 'NGN',
    payment_options: 'card,mobilemoney,ussd',
    customer: {
      email: deliveryInfo.email || "customer@example.com",
      phone_number: deliveryInfo.phone || "08000000000",
      name: deliveryInfo.fullName || "Customer",
    },
    customizations: {
      title: 'Jersey Studio Payment',
      description: 'Payment for custom jersey build',
      logo: 'https://st2.depositphotos.com/4403291/7418/v/450/depositphotos_74189661-stock-illustration-online-shop-logotype-template-design.jpg',
    },
  }), [deliveryInfo]);

  const handleFlutterPayment = useFlutterwave(flutterConfig);

  const ussdBanks = [
    { name: 'GTBank', code: '*737*1*25000*2019667940#' },
    { name: 'Zenith', code: '*966*25000*2019667940#' },
    { name: 'FirstBank', code: '*894*25000*2019667940#' },
    { name: 'UBA', code: '*919*3*2019667940*25000#' },
    { name: 'Access', code: '*901*2*25000*2019667940#' },
    { name: 'Kuda', code: 'Open Kuda App > Send Money' }
  ];

  const SIZES = ['S', 'M', 'L', 'XL', 'XXL'];
  const FONTS = [
    { name: 'Standard', family: 'Inter' },
    { name: 'Athletic', family: 'Oswald' },
    { name: 'Tech', family: 'JetBrains Mono' },
    { name: 'Modern', family: 'Montserrat' },
    { name: 'Classic', family: 'Playfair Display' }
  ];

  const filteredLeagues = useMemo(() => {
    return LEAGUES.filter(l => l.sport === activeCategory);
  }, [activeCategory]);

  const filteredTeams = useMemo(() => {
    return TEAMS.filter(t => t.leagueId === selectedLeague?.id);
  }, [selectedLeague]);

  const handleCategorySelect = (catId: string) => {
    setActiveCategory(catId);
    setStep('league');
  };

  const handleLeagueSelect = (league: League) => {
    setSelectedLeague(league);
    setStep('team');
  };

  const handleTeamSelect = (team: Team) => {
    setSelectedTeam(team);
    setStep('kit');
  };

  const handleKitSelect = (kit: KitVariant) => {
    setSelectedKit(kit);
    setStep('customize');
  };

  const handleAddToCartOnly = () => {
    if (!selectedTeam || !selectedKit) return;
    finalizeOrder(null);
  };

  const handleInstantPay = () => {
    if (!selectedTeam || !selectedKit) return;
    setCheckoutMode('instant');
    setStep('delivery');
  };

  const handleDeliverySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (checkoutMode === 'instant') {
      setShowPayment(true);
    } else {
      finalizeOrder(null);
    }
  };

  const finalizeOrder = (method: string | null) => {
    if (!selectedTeam || !selectedKit) return;
    setIsAddingToCart(true);

    const orderData = {
      id: Math.random().toString(36).substr(2, 9),
      title: `${selectedTeam.name} ${selectedKit.name} Kit`,
      team: selectedTeam,
      kit: selectedKit,
      price: 25000,
      siloType: 'jersey',
      customization: {
        name,
        number,
        size: selectedSize,
        font: selectedFont || selectedTeam.fontFamily,
      },
      deliveryDetails: deliveryInfo,
      paymentMethod: method,
      orderDate: new Date().toISOString(),
      expectedDelivery: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      status: method ? 'payment_submitted' : 'pending'
    };

    onAddToCart(orderData);

    setTimeout(() => {
      setIsAddingToCart(false);
      setShowPayment(false);
      // Only show order complete if it was a paid order
      if (method) {
        setOrderComplete(true);
      }
      
      // Reset if it was just add to cart
      if (!method) {
        setStep('category');
      }
      
      // Simulate sending notifications
      console.log(`Sending SMS to ${deliveryInfo.phone}: Your kit is estimated to arrive in 7 days.`);
      console.log(`Sending Email to ${deliveryInfo.email}: Your kit build has been authorized.`);
    }, 2000);
  };

  const handleConfirmPayment = () => {
    if (!paymentMethod) return;
    
    if (paymentMethod === 'card') {
      setIsProcessingCard(true);
      
      handleFlutterPayment({
        callback: (response) => {
          console.log("Payment response:", response);
          if (response.status === "successful" || response.status === "success") {
            // Immediately invoke the server-side /api/generate-email using customer email from details form
            const customerEmail = deliveryInfo.email || "customer@example.com";
            fetch('/api/generate-email', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                email: customerEmail,
                to: customerEmail,
                fullName: deliveryInfo.fullName || 'Valued Customer',
                subject: `Order Confirmed - Custom Kit`,
                title: `${selectedTeam?.name || ''} ${selectedKit?.name || 'Custom Kit'}`,
                html: `
                  <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; color: #1e293b; background-color: #ffffff; padding: 24px; border: 1px solid #e2e8f0; border-radius: 16px;">
                    <h2 style="font-size: 18px; font-weight: bold; color: #0f172a; margin-bottom: 16px;">Order Confirmed • Asset Secured</h2>
                    <p>Dear <strong>${deliveryInfo.fullName || 'Valued Client'}</strong>,</p>
                    <p>We have successfully verified your transaction for <strong>${selectedTeam?.name || ''} ${selectedKit?.name || 'Custom Kit'}</strong>. Your order has been securely registered and confirmed.</p>
                    <p>We are preparing your handcrafted item with absolute precision.</p>
                    <hr style="border: 0; border-top: 1px solid #e2e8f0; margin: 24px 0;" />
                    <p style="font-size: 12px; font-weight: bold; text-transform: uppercase; color: #64748b; margin-bottom: 12px; letter-spacing: 0.05em;">Post-Purchase Connections</p>
                    <ul style="list-style: none; padding: 0; margin: 0;">
                      <li style="margin-bottom: 12px;"><a href="https://instagram.com/uncleteeautomobiles" style="color: #c026d3; text-decoration: none; font-weight: bold; font-size: 14px;">📸 Instagram - Automobiles</a></li>
                      <li style="margin-bottom: 12px;"><a href="https://instagram.com/uncleteeee.ng" style="color: #db2777; text-decoration: none; font-weight: bold; font-size: 14px;">🛍️ Instagram - Official Store</a></li>
                      <li style="margin-bottom: 12px;"><a href="https://wa.me/2348138642942" style="color: #10b981; text-decoration: none; font-weight: bold; font-size: 14px;">💬 WhatsApp VIP Concierge</a></li>
                      <li style="margin-bottom: 12px;"><a href="https://tiktok.com/@uncleteeautos" style="color: #0f172a; text-decoration: none; font-weight: bold; font-size: 14px;">🎵 TikTok Collection Showcase</a></li>
                    </ul>
                  </div>
                `
              })
            }).catch(err => console.error("[GATEWAY CALLBACK ERR] Failed to send instant email:", err));

            finalizeOrder('card');
          }
          setIsProcessingCard(false);
          closePaymentModal();
        },
        onClose: () => {
          console.log("Payment modal closed");
          setIsProcessingCard(false);
        },
      });
      return;
    }

    finalizeOrder(paymentMethod);
  };

  const getCategoryIcon = (id: string) => {
    switch (id) {
      case 'football': return <Trophy className="w-5 h-5 sm:w-8 sm:h-8" />;
      case 'baseball': return <Activity className="w-5 h-5 sm:w-8 sm:h-8" />;
      case 'rugby': return <Shield className="w-5 h-5 sm:w-8 sm:h-8" />;
      default: return <Trophy className="w-5 h-5 sm:w-8 sm:h-8" />;
    }
  };

  return (
    <div className="w-full max-w-7xl mx-auto pb-20 px-4 relative">
      <AnimatePresence mode="wait">
        
        {/* STEP 1: CATEGORY */}
        {step === 'category' && (
          <motion.div 
            key="category"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="space-y-8 sm:space-y-12 py-10 sm:py-20"
          >
            <div className="text-center space-y-3 sm:space-y-4 max-w-2xl mx-auto">
              <h2 className="text-3xl sm:text-7xl font-black italic uppercase tracking-tighter text-slate-900 leading-none">Select Sport</h2>
              <p className="text-slate-400 text-[10px] sm:text-sm font-bold uppercase tracking-[0.4em]">Choose your discipline to begin</p>
            </div>
            <div className="grid grid-cols-3 gap-3 md:gap-8 max-w-6xl mx-auto">
              {CATEGORIES.map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => handleCategorySelect(cat.id)}
                  className="group relative overflow-hidden bg-white p-3 sm:p-12 rounded-2xl sm:rounded-[4rem] border-2 sm:border-4 border-slate-100 hover:border-slate-900 transition-all text-center flex flex-col items-center justify-center space-y-2 sm:space-y-8 shadow-[0_20px_40px_rgba(0,0,0,0.04)] sm:shadow-[0_40px_80px_rgba(0,0,0,0.06)] hover:shadow-2xl active:scale-[0.98]"
                >
                  <div className="w-10 h-10 sm:w-24 sm:h-24 bg-slate-50 rounded-xl sm:rounded-[2.5rem] flex items-center justify-center text-slate-300 group-hover:bg-slate-900 group-hover:text-white transition-all transform group-hover:scale-110">
                    {getCategoryIcon(cat.id)}
                  </div>
                  <div className="flex flex-col items-center">
                    <h3 className="text-[10px] sm:text-xl font-black uppercase italic tracking-tighter text-slate-900 leading-none">{cat.name}</h3>
                    <p className="hidden sm:block text-[10px] font-black text-slate-400 uppercase tracking-widest mt-4">{cat.id === 'football' ? '50+ CLUBS' : 'AUTHENTIC'}</p>
                  </div>
                </button>
              ))}
            </div>
          </motion.div>
        )}

        {/* STEP 2: LEAGUE */}
        {step === 'league' && (
          <motion.div 
            key="league"
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -50 }}
            className="space-y-8 md:space-y-12 py-10 md:py-20"
          >
            <div className="max-w-6xl mx-auto flex flex-col items-center gap-6 md:gap-8 md:flex-row md:justify-between">
              <button 
                onClick={() => setStep('category')} 
                className="flex items-center gap-2 bg-slate-900 text-white px-4 py-2 rounded-full shadow-lg hover:bg-slate-800 transition-all group shrink-0"
              >
                <ChevronLeft className="w-4 h-4 transition-transform group-hover:-translate-x-1" />
                <span className="text-[9px] font-black uppercase tracking-[0.2em]">Back</span>
              </button>
              <div className="text-center space-y-2">
                <h2 className="text-3xl md:text-5xl font-black italic uppercase tracking-tighter text-slate-900">Elite Competitions</h2>
                <p className="text-slate-400 text-[10px] font-bold uppercase tracking-[0.3em]">Official league partners</p>
              </div>
              <div className="hidden md:block w-40" /> {/* Balanced spacing */}
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-8 max-w-6xl mx-auto">
              {filteredLeagues.map(league => (
                <button
                  key={league.id}
                  onClick={() => handleLeagueSelect(league)}
                  className="bg-white p-3 sm:p-5 md:p-10 rounded-2xl sm:rounded-[2rem] md:rounded-[4rem] border-2 sm:border-4 border-slate-100 hover:border-slate-900 transition-all shadow-md sm:shadow-xl group flex flex-col items-center justify-center text-center space-y-3 sm:space-y-6 active:scale-[0.98]"
                >
                  <div className="w-14 h-14 sm:w-24 sm:h-24 bg-slate-50 rounded-xl sm:rounded-[2.5rem] p-3 sm:p-6 flex items-center justify-center group-hover:bg-white transition-colors">
                    <img 
                      src={getLogoUrl(league.logo)} 
                      alt="" 
                      className="w-full h-full object-contain" 
                      referrerPolicy="no-referrer" 
                      onError={(e) => {
                        const img = e.currentTarget;
                        if (img.src.includes('wsrv.nl/?url=') || img.src.includes('weserv.nl/?url=') || img.src.includes('/api/proxy-image')) {
                          try {
                            const urlObj = img.src.includes('http') ? new URL(img.src) : new URL(img.src, window.location.origin);
                            const directUrl = urlObj.searchParams.get('url');
                            if (directUrl) {
                              img.src = img.src.includes('/api/proxy-image')
                                ? `https://images.weserv.nl/?url=${encodeURIComponent(directUrl)}&w=400&h=400&fit=contain&output=webp`
                                : directUrl;
                            }
                          } catch (_) {}
                        }
                      }}
                    />
                  </div>
                  <span className="text-[10px] sm:text-[11px] font-black uppercase italic tracking-tighter text-slate-900 leading-tight">{league.name}</span>
                </button>
              ))}
            </div>
          </motion.div>
        )}

        {/* STEP 3: TEAM */}
        {step === 'team' && (
          <motion.div 
            key="team"
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -50 }}
            className="space-y-8 md:space-y-12 py-10 md:py-20"
          >
            <div className="max-w-6xl mx-auto flex flex-col items-center gap-6 md:gap-8 md:flex-row md:justify-between">
              <button 
                onClick={() => setStep('league')} 
                className="flex items-center gap-2 bg-slate-900 text-white px-4 py-2 rounded-full shadow-lg hover:bg-slate-800 transition-all group shrink-0"
              >
                <ChevronLeft className="w-4 h-4 transition-transform group-hover:-translate-x-1" />
                <span className="text-[9px] font-black uppercase tracking-[0.2em]">Back</span>
              </button>
              <div className="text-center space-y-2">
                <h2 className="text-3xl md:text-5xl font-black italic uppercase tracking-tighter text-slate-900">{selectedLeague?.name} Roster</h2>
                <p className="text-slate-400 text-[10px] font-bold uppercase tracking-[0.3em]">Select your club</p>
              </div>
              <div className="hidden md:block w-40" /> {/* Balanced spacing */}
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-3 sm:gap-6 max-w-6xl mx-auto">
              {filteredTeams.map(team => (
                <button
                  key={team.id}
                  onClick={() => handleTeamSelect(team)}
                  className="bg-white p-3 sm:p-6 rounded-2xl sm:rounded-[3rem] border-2 sm:border-4 border-slate-100 hover:border-slate-900 transition-all shadow-md sm:shadow-lg group flex flex-col items-center justify-center text-center space-y-2 sm:space-y-4 active:scale-[0.98]"
                >
                  <div className="w-12 h-12 sm:w-16 sm:h-16 bg-white rounded-xl sm:rounded-2xl p-2 sm:p-3 shadow-inner border border-slate-50 group-hover:scale-110 transition-transform">
                    <img 
                      src={getLogoUrl(team.logo)} 
                      alt="" 
                      className="w-full h-full object-contain" 
                      referrerPolicy="no-referrer" 
                      onError={(e) => {
                        const img = e.currentTarget;
                        if (img.src.includes('wsrv.nl/?url=') || img.src.includes('weserv.nl/?url=') || img.src.includes('/api/proxy-image')) {
                          try {
                            const urlObj = img.src.includes('http') ? new URL(img.src) : new URL(img.src, window.location.origin);
                            const directUrl = urlObj.searchParams.get('url');
                            if (directUrl) {
                              img.src = img.src.includes('/api/proxy-image')
                                ? `https://images.weserv.nl/?url=${encodeURIComponent(directUrl)}&w=400&h=400&fit=contain&output=webp`
                                : directUrl;
                            }
                          } catch (_) {}
                        }
                      }}
                    />
                  </div>
                  <span className="text-[9px] font-black uppercase tracking-widest text-slate-900 leading-tight">{team.name}</span>
                </button>
              ))}
            </div>
          </motion.div>
        )}

        {/* STEP 4: KIT SELECTION MODAL-STYLE */}
        {step === 'kit' && selectedTeam && (
          <motion.div 
            key="kit"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-slate-900/40 backdrop-blur-3xl flex items-center justify-center p-4 md:p-6"
          >
            <div className="w-full max-w-5xl max-h-[90vh] overflow-y-auto bg-white rounded-[1.5rem] sm:rounded-[4rem] shadow-2xl p-4 sm:p-16 text-center relative flex flex-col">
              <div className="flex justify-center mb-6 md:absolute md:top-10 md:left-10 md:mb-0 z-50">
                <button 
                  onClick={() => setStep('team')} 
                  className="flex items-center gap-2 bg-slate-900 text-white px-4 py-2 rounded-full shadow-xl hover:bg-slate-800 transition-all group"
                >
                  <ChevronLeft className="w-4 h-4 transition-transform group-hover:-translate-x-1" />
                  <span className="text-[9px] font-black uppercase tracking-[0.2em]">Back</span>
                </button>
              </div>
              <div className="space-y-3 mb-8 md:mb-16">
                <h3 className="text-xl sm:text-5xl font-black italic uppercase tracking-tighter text-slate-900 leading-none px-4">Select {selectedTeam.name} Edition</h3>
                <p className="text-slate-400 text-[10px] sm:text-xs font-bold uppercase tracking-[0.3em]">Choose your favorite kit layout</p>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-16 px-2 sm:px-12">
                {selectedTeam.kits.map(kit => (
                  <button
                    key={kit.id}
                    onClick={() => handleKitSelect(kit)}
                    className="group relative transition-all active:scale-[0.98] mx-auto w-full max-w-[280px] md:max-w-none"
                  >
                    <div className="aspect-square rounded-2xl sm:rounded-[4rem] bg-slate-100 border-4 sm:border-8 border-transparent group-hover:border-slate-900 transition-all overflow-hidden relative shadow-[0_20px_40px_rgba(0,0,0,0.05)] sm:shadow-[0_40px_80px_rgba(0,0,0,0.1)] group-hover:shadow-[0_60px_100px_rgba(0,0,0,0.2)]">
                      <JerseyVisual 
                        team={selectedTeam}
                        kit={kit}
                        name=""
                        number="10"
                        view="front"
                        sport={activeCategory as any}
                        className="w-full h-full transform scale-110"
                      />
                      <div className="absolute inset-0 bg-slate-900/0 group-hover:bg-slate-900/5 transition-colors" />
                    </div>
                    <div className="mt-4 md:mt-8 space-y-2">
                      <h4 className="text-lg md:text-2xl font-black italic uppercase tracking-tighter text-slate-900">{kit.name}</h4>
                      <div className="flex items-center justify-center gap-3">
                        <div className="w-4 h-4 rounded-full" style={{ backgroundColor: kit.primaryColor }} />
                        <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Authentic Spec</span>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
              <button onClick={() => setStep('team')} className="mt-8 md:mt-20 px-8 py-3 bg-slate-100 rounded-2xl text-[10px] font-black uppercase tracking-widest text-slate-400 hover:bg-slate-900 hover:text-white transition-all">
                Change Club
              </button>
            </div>
          </motion.div>
        )}

        {/* STEP 5: CUSTOMIZE STUDIO */}
        {step === 'customize' && selectedTeam && selectedKit && (
          <motion.div 
            key="customize"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-[1.5rem] sm:rounded-[4rem] shadow-[0_80px_160px_rgba(0,0,0,0.12)] border border-slate-100 p-4 sm:p-16 flex flex-col lg:flex-row items-center gap-6 sm:gap-16 relative overflow-hidden"
          >
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_#f8fafc_0%,_transparent_100%)] opacity-60" />
            
            {/* Top Navigation Bar */}
            <div className="absolute top-0 left-0 right-0 p-4 md:p-8 flex items-center z-[60]">
              <button 
                onClick={() => setStep('kit')} 
                className="flex items-center gap-2 bg-slate-900 text-white px-4 py-2 rounded-full shadow-2xl hover:bg-slate-800 transition-all hover:scale-105 group"
              >
                <ChevronLeft className="w-4 h-4 transition-transform group-hover:-translate-x-1" />
                <span className="text-[9px] font-black uppercase tracking-[0.2em]">Back</span>
              </button>
            </div>

            {/* Left: Interactive Preview */}
            <div className="w-full lg:w-1/2 min-h-[300px] sm:min-h-[400px] md:min-h-[600px] flex flex-col items-center justify-center relative z-10 pt-16 lg:pt-0">
              <AnimatePresence mode="wait">
                <motion.div 
                  key={`${selectedTeam.id}-${selectedKit.id}-${view}`}
                  initial={{ opacity: 0, scale: 0.9, y: 50 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 1, y: -50 }}
                  className="w-full max-w-[500px] flex flex-col items-center"
                >
                  <JerseyVisual 
                    team={selectedTeam}
                    kit={selectedKit}
                    name={name}
                    number={number}
                    fontFamily={selectedFont}
                    view={view}
                    sport={activeCategory as any}
                    className="w-full drop-shadow-[0_65px_100px_rgba(0,0,0,0.3)] filter contrast-[1.05]"
                  />
                  
                  <div className="flex gap-2 sm:gap-4 mt-6 sm:mt-20 bg-white/80 backdrop-blur-xl p-1.5 sm:p-3 rounded-xl sm:rounded-[2.5rem] border border-slate-100 shadow-2xl">
                    {['front', 'back'].map((v) => (
                      <button 
                        key={v}
                        onClick={() => setView(v as any)}
                        className={cn(
                          "px-4 sm:px-10 py-2 sm:py-4 rounded-lg sm:rounded-2xl text-[9px] md:text-[10px] font-black uppercase tracking-widest transition-all",
                          view === v 
                            ? "bg-slate-900 text-white shadow-lg" 
                            : "text-slate-400 hover:text-slate-900"
                        )}
                      >
                        {v} View
                      </button>
                    ))}
                  </div>
                </motion.div>
              </AnimatePresence>
            </div>

            {/* Right: Customization Controls */}
            <div className="w-full lg:w-1/2 space-y-6 sm:space-y-12 relative z-10">
              <div className="space-y-4">
                <div className="flex flex-col md:flex-row items-center gap-4 sm:gap-12 text-center md:text-left">
                    <div className="w-16 h-16 sm:w-32 sm:h-32 bg-white rounded-xl sm:rounded-[2.5rem] p-3 sm:p-6 shadow-2xl border border-slate-100 shrink-0">
                      <img 
                         src={getLogoUrl(selectedTeam.logo)} 
                         alt="" 
                         className="w-full h-full object-contain" 
                         referrerPolicy="no-referrer" 
                         onError={(e) => {
                           const img = e.currentTarget;
                           if (img.src.includes('wsrv.nl/?url=') || img.src.includes('weserv.nl/?url=') || img.src.includes('/api/proxy-image')) {
                             try {
                               const urlObj = img.src.includes('http') ? new URL(img.src) : new URL(img.src, window.location.origin);
                               const directUrl = urlObj.searchParams.get('url');
                               if (directUrl) {
                                 img.src = img.src.includes('/api/proxy-image')
                                   ? `https://images.weserv.nl/?url=${encodeURIComponent(directUrl)}&w=400&h=400&fit=contain&output=webp`
                                   : directUrl;
                               }
                             } catch (_) {}
                           }
                         }}
                       />
                    </div>
                   <div>
                     <h2 className="text-3xl sm:text-6xl font-black italic uppercase tracking-tighter text-slate-900 leading-[0.9]">
                       Elite <br className="hidden md:block" /> {selectedTeam.name}
                     </h2>
                     <p className="text-slate-400 text-[10px] font-bold uppercase tracking-[0.3em] mt-2 sm:mt-4">Authentic 2024/25 Specification</p>
                   </div>
                </div>
              </div>

              <div className="bg-slate-900 rounded-2xl sm:rounded-[3.5rem] p-5 sm:p-12 text-white shadow-2xl relative overflow-hidden">
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,_rgba(255,255,255,0.1)_0%,_transparent_50%)]" />
                
                <div className="space-y-8 md:space-y-10 relative z-10">
                  <div className="grid grid-cols-2 gap-4 md:gap-6">
                    <div className="space-y-3">
                      <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Name Stamping</Label>
                      <Input 
                        value={name}
                        onChange={(e) => { setName(e.target.value.toUpperCase()); setView('back'); }}
                        className="h-14 md:h-16 bg-white/10 border-white/20 focus:border-white focus:bg-white text-white focus:text-slate-900 rounded-xl md:rounded-2xl font-black px-4 md:px-6 uppercase tracking-widest text-xs md:text-sm"
                        placeholder="SURNAME"
                      />
                    </div>
                    <div className="space-y-3">
                      <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Squad Number</Label>
                      <Input 
                        type="number"
                        value={number}
                        onChange={(e) => { setNumber(e.target.value); setView('back'); }}
                        className="h-14 md:h-16 bg-white/10 border-white/20 focus:border-white focus:bg-white text-white focus:text-slate-900 rounded-xl md:rounded-2xl font-black px-4 md:px-6 uppercase tracking-widest text-xs md:text-sm"
                        placeholder="10"
                      />
                    </div>
                  </div>

                  <div className="space-y-4">
                    <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Select Size</Label>
                    <div className="grid grid-cols-5 gap-2 md:gap-4">
                      {SIZES.map((s) => (
                        <button
                          key={s}
                          onClick={() => setSelectedSize(s)}
                          className={cn(
                            "h-12 md:h-14 rounded-xl md:rounded-2xl border-2 font-black transition-all flex items-center justify-center text-xs md:text-sm shadow-lg active:scale-95",
                            selectedSize === s 
                              ? "bg-white border-white text-slate-900 scale-105" 
                              : "border-white/10 text-white/40 hover:border-white/30"
                          )}
                        >
                          {s}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-4">
                    <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Typography Style</Label>
                    <div className="grid grid-cols-5 gap-2 md:gap-4">
                      {FONTS.map((f) => (
                        <button
                          key={f.family}
                          onClick={() => { setSelectedFont(f.family); }}
                          className={cn(
                            "h-14 sm:h-20 flex flex-col items-center justify-center gap-0.5 sm:gap-2 rounded-xl md:rounded-2xl border-2 transition-all shadow-lg active:scale-95",
                            (selectedFont === f.family || (!selectedFont && f.family === (selectedTeam.fontFamily || 'Inter')))
                              ? "bg-white border-white text-slate-900 scale-105" 
                              : "border-white/10 text-white/40 hover:border-white/30"
                          )}
                        >
                          <span className="text-[11px] sm:text-sm font-black leading-none" style={{ fontFamily: f.family }}>10</span>
                          <span className="text-[7px] sm:text-[9px] font-bold uppercase tracking-tighter opacity-60 leading-none">{f.name}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="pt-6 border-t border-white/10 space-y-6">
                     <div className="flex items-center justify-between">
                        <span className="text-slate-400 text-[10px] font-black uppercase tracking-widest font-mono">Build ID: {selectedTeam.id.toUpperCase()}-{selectedKit.id.toUpperCase()}</span>
                        <div className="flex gap-2">
                           <div className="w-4 h-4 rounded-full" style={{ backgroundColor: selectedKit.primaryColor }} />
                           <div className="w-4 h-4 rounded-full border border-white/20" style={{ backgroundColor: selectedKit.secondaryColor }} />
                        </div>
                     </div>

                     <div className="flex flex-col sm:flex-row items-center justify-center gap-3 mt-4 w-full">
                        <Button 
                            onClick={handleAddToCartOnly}
                            disabled={isAddingToCart}
                            className="w-full sm:w-auto px-6 h-12 bg-white/10 border border-white/20 text-white hover:bg-white hover:text-slate-900 rounded-full font-black text-[10px] uppercase italic tracking-widest transition-all active:scale-[0.98]"
                        >
                            <ShoppingBag className="w-4 h-4 mr-2 inline-block" />
                            To Cart
                        </Button>
                        <Button 
                            onClick={handleInstantPay}
                            disabled={isAddingToCart}
                            className="w-full sm:flex-1 h-12 bg-white text-slate-900 hover:bg-slate-100 rounded-full font-black text-[10px] uppercase italic tracking-widest transition-all active:scale-[0.98] shadow-xl"
                        >
                            {isAddingToCart ? "PREPARING..." : `CHECKOUT NOW — ₦25,000`}
                        </Button>
                     </div>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        )}
        {/* STEP 6: DELIVERY DETAILS */}
        {step === 'delivery' && (
          <motion.div 
            key="delivery"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="w-full max-w-4xl mx-auto py-10 md:py-20"
          >
            <div className="bg-white rounded-[2.5rem] md:rounded-[4rem] shadow-[0_80px_160px_rgba(0,0,0,0.1)] p-8 md:p-16 border border-slate-100 overflow-hidden relative">
              <div className="absolute top-0 right-0 w-64 h-64 bg-slate-50 rounded-full -translate-y-1/2 translate-x-1/2 brightness-95" />
              
              <div className="relative z-10 space-y-12">
                <div className="flex flex-col md:flex-row items-center justify-between gap-6">
                  <div className="space-y-2 text-center md:text-left">
                    <h2 className="text-3xl md:text-5xl font-black italic uppercase tracking-tighter text-slate-900 leading-none">Shipping Logistics</h2>
                    <p className="text-slate-400 text-[10px] font-bold uppercase tracking-[0.3em]">Where should we send your authentic kit?</p>
                  </div>
                  <button 
                    onClick={() => setStep('customize')}
                    className="px-6 py-3 bg-slate-900 text-white rounded-full text-[10px] font-black uppercase tracking-widest hover:bg-slate-800 transition-all shadow-lg active:scale-95"
                  >
                    Modify Design
                  </button>
                </div>

                <form onSubmit={handleDeliverySubmit} className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="space-y-6">
                    <div className="space-y-3">
                      <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Full Name</Label>
                      <Input 
                        required
                        value={deliveryInfo.fullName}
                        onChange={(e) => setDeliveryInfo({...deliveryInfo, fullName: e.target.value})}
                        className="h-14 border-2 border-slate-100 focus:border-slate-900 rounded-2xl font-bold px-6 bg-slate-50/50"
                        placeholder="John Doe"
                      />
                    </div>
                    <div className="space-y-3">
                      <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Email Address</Label>
                      <Input 
                        required
                        type="email"
                        value={deliveryInfo.email}
                        onChange={(e) => setDeliveryInfo({...deliveryInfo, email: e.target.value})}
                        className="h-14 border-2 border-slate-100 focus:border-slate-900 rounded-2xl font-bold px-6 bg-slate-50/50"
                        placeholder="john@example.com"
                      />
                    </div>
                    <div className="space-y-3">
                      <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Phone Number</Label>
                      <Input 
                        required
                        type="tel"
                        value={deliveryInfo.phone}
                        onChange={(e) => setDeliveryInfo({...deliveryInfo, phone: e.target.value})}
                        className="h-14 border-2 border-slate-100 focus:border-slate-900 rounded-2xl font-bold px-6 bg-slate-50/50"
                        placeholder="+234..."
                      />
                    </div>
                  </div>

                  <div className="space-y-6">
                    <div className="space-y-3">
                      <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400">State / Region</Label>
                      <Input 
                        required
                        value={deliveryInfo.state}
                        onChange={(e) => setDeliveryInfo({...deliveryInfo, state: e.target.value})}
                        className="h-14 border-2 border-slate-100 focus:border-slate-900 rounded-2xl font-bold px-6 bg-slate-50/50"
                        placeholder="Lagos State"
                      />
                    </div>
                    <div className="space-y-3">
                      <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Full Delivery Address</Label>
                      <textarea 
                        required
                        value={deliveryInfo.address}
                        onChange={(e) => setDeliveryInfo({...deliveryInfo, address: e.target.value})}
                        className="w-full h-[124px] border-2 border-slate-100 focus:border-slate-900 rounded-2xl font-bold p-6 resize-none bg-slate-50/50"
                        placeholder="Street address, apartment, suite, etc."
                      />
                    </div>
                  </div>

                  <div className="md:col-span-2 pt-6">
                    <Button 
                      type="submit"
                      disabled={isAddingToCart}
                      className="w-full h-20 bg-slate-900 text-white rounded-[2rem] font-black text-xl uppercase italic tracking-tighter hover:bg-slate-800 transition-all shadow-2xl active:scale-[0.98]"
                    >
                      {isAddingToCart ? 'REGISTERING...' : (checkoutMode === 'instant' ? 'Proceed to Secure Payment' : 'Complete Registration')}
                    </Button>
                    <div className="flex items-center justify-center gap-3 mt-8 p-4 bg-slate-50 rounded-2xl">
                      <Truck className="w-5 h-5 text-slate-400" />
                      <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">
                        Authentic Build Timeline: At least 7 days for delivery
                      </p>
                    </div>
                  </div>
                </form>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* GLOBAL OVERLAYS (Payment & Success) */}
      <AnimatePresence>
        {showPayment && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[200] bg-slate-900 flex flex-col items-center justify-center p-4 md:p-12 text-center"
          >
            <div className="max-w-md w-full space-y-8 max-h-screen overflow-y-auto py-8">
              <div className="space-y-2">
                <h3 className="text-3xl md:text-4xl font-black italic uppercase tracking-tighter text-white">Payment Secure</h3>
                <p className="text-slate-400 text-[10px] md:text-xs font-bold uppercase tracking-[0.3em]">Select build authorization method</p>
              </div>

              <div className="grid grid-cols-1 gap-4">
                {[
                  { id: 'card', name: 'Debit/Credit Card', icon: CreditCard, subtitle: 'Pay securely via gateway' },
                  { id: 'transfer', name: 'Bank Transfer', icon: ArrowRightLeft, subtitle: 'Kuda Bank — Manual verification' },
                  { id: 'ussd', name: 'USSD Code', icon: Hash, subtitle: 'Dial on your mobile' }
                ].map((method) => (
                  <button
                    key={method.id}
                    onClick={() => setPaymentMethod(method.id as any)}
                    className={cn(
                      "w-full p-5 rounded-[1.5rem] border-2 transition-all flex items-center gap-4 text-left group",
                      paymentMethod === method.id 
                        ? "bg-white border-white text-slate-900" 
                        : "border-white/10 text-white hover:border-white/30"
                    )}
                  >
                    <div className={cn(
                      "w-12 h-12 rounded-xl flex items-center justify-center",
                      paymentMethod === method.id ? "bg-slate-100" : "bg-white/5"
                    )}>
                      <method.icon className="w-6 h-6" />
                    </div>
                    <div className="flex-1">
                      <div className="font-black uppercase tracking-tight text-sm italic">{method.name}</div>
                      <div className={cn(
                        "text-[9px] font-bold uppercase tracking-widest",
                        paymentMethod === method.id ? "text-slate-400" : "text-slate-500"
                      )}>{method.subtitle}</div>
                    </div>
                  </button>
                ))}
              </div>

              {paymentMethod === 'transfer' && (
                <motion.div 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-white/5 border border-white/10 p-6 rounded-2xl text-left"
                >
                    <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-4">Official Payment Details</h4>
                    <div className="space-y-4">
                      <div className="flex justify-between items-end">
                        <div>
                            <p className="text-[8px] font-bold text-slate-500 uppercase tracking-widest">Bank Name</p>
                            <p className="text-sm font-black text-white italic uppercase">Kuda Bank</p>
                        </div>
                        <div className="text-right">
                            <p className="text-[8px] font-bold text-slate-500 uppercase tracking-widest">Amount</p>
                            <p className="text-sm font-black text-green-400 italic">₦25,000</p>
                        </div>
                      </div>
                      <div>
                          <p className="text-[8px] font-bold text-slate-500 uppercase tracking-widest">Account Number</p>
                          <p className="text-xl font-black text-white italic tracking-widest">2019667940</p>
                      </div>
                      <div>
                          <p className="text-[8px] font-bold text-slate-500 uppercase tracking-widest">Account Name</p>
                          <p className="text-sm font-black text-white italic uppercase tracking-tighter">Uncle Tee Nigeria (Ismail Tahir)</p>
                      </div>
                    </div>
                </motion.div>
              )}

              {paymentMethod === 'ussd' && (
                <motion.div 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-white/5 border border-white/10 p-6 rounded-2xl text-left"
                >
                    <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-4">Direct Bank USSD Codes</h4>
                    <div className="grid grid-cols-2 gap-3">
                      {ussdBanks.map((bank) => (
                        <div key={bank.name} className="p-3 bg-white/5 rounded-xl border border-white/5">
                          <p className="text-[8px] font-bold text-slate-500 uppercase tracking-widest mb-1">{bank.name}</p>
                          <p className="text-[11px] font-black text-white tracking-widest select-all">{bank.code}</p>
                        </div>
                      ))}
                    </div>
                    <p className="text-[8px] font-medium text-slate-500 mt-4 uppercase text-center tracking-widest">Dial the code from your registered mobile</p>
                </motion.div>
              )}

              {paymentMethod === 'card' && (
                <motion.div 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-white/5 border border-white/10 p-8 rounded-2xl text-center space-y-4"
                >
                    <div className="w-16 h-16 bg-blue-500/20 rounded-full flex items-center justify-center mx-auto mb-2">
                      <CreditCard className="w-8 h-8 text-blue-400" />
                    </div>
                    <div>
                      <h4 className="text-sm font-black text-white uppercase italic">Flutterwave Secure Checkout</h4>
                      <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Instant Activation after successful charge</p>
                    </div>
                    <div className="flex justify-center gap-2">
                       <div className="w-8 h-5 bg-white/10 rounded-sm border border-white/10" />
                       <div className="w-8 h-5 bg-white/10 rounded-sm border border-white/10" />
                       <div className="w-8 h-5 bg-white/10 rounded-sm border border-white/10" />
                    </div>
                </motion.div>
              )}

              <div className="pt-4 space-y-4">
                <Button 
                  onClick={handleConfirmPayment}
                  disabled={!paymentMethod || isAddingToCart || isProcessingCard}
                  className="w-full h-16 bg-white text-slate-900 font-black uppercase text-sm rounded-[1.5rem] shadow-2xl active:scale-95 disabled:opacity-20 flex items-center justify-center gap-3"
                >
                    {(isAddingToCart || isProcessingCard) && (
                      <motion.div
                        animate={{ rotate: 360 }}
                        transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}
                        className="w-5 h-5 border-2 border-slate-900 border-t-transparent rounded-full"
                      />
                    )}
                    {isProcessingCard ? "CONNECTING GATEWAY..." : isAddingToCart ? "AUTHORIZING..." : "CONFIRM & PAY ₦25,000"}
                </Button>
                {isProcessingCard && (
                  <button 
                    onClick={() => {
                      setIsProcessingCard(false);
                      closePaymentModal();
                    }}
                    className="w-full text-[10px] font-black text-slate-500 uppercase tracking-widest hover:text-white transition-colors"
                  >
                    Trouble loading? Click to reset
                  </button>
                )}
                <button 
                  onClick={() => setShowPayment(false)}
                  disabled={isAddingToCart || isProcessingCard}
                  className="text-slate-500 text-[10px] font-black uppercase tracking-[0.4em] hover:text-white transition-colors disabled:opacity-20"
                >
                  Cancel & Back to Design
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {orderComplete && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[210] bg-slate-900 flex flex-col items-center justify-center p-8 text-center"
          >
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: 'spring', damping: 12 }}
              className="relative"
            >
              <div className="w-24 h-24 bg-green-500 rounded-full flex items-center justify-center mb-8">
                <CheckCircle2 className="w-12 h-12 text-white" />
              </div>
              <motion.div 
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.5 }}
                className="absolute -top-2 -right-2 w-10 h-10 bg-white rounded-full flex items-center justify-center shadow-xl text-slate-900"
              >
                <Truck className="w-5 h-5" />
              </motion.div>
            </motion.div>
            <h3 className="text-4xl md:text-5xl font-black italic uppercase tracking-tighter text-white mb-4 leading-none">Gear Stamped!</h3>
            <div className="space-y-6 mb-12">
                <div className="space-y-2">
                  <p className="text-amber-400 text-xs md:text-sm font-black uppercase tracking-[0.15em] max-w-sm mx-auto bg-amber-500/10 p-3 rounded-xl border border-amber-500/20">
                    We will approve order if payment is confirmed
                  </p>
                  <p className="text-slate-400 text-[10px] font-bold uppercase tracking-[0.2em] max-w-xs mx-auto">Order added to active requests for admin verification</p>
                </div>
                <div className="bg-white/5 border border-white/10 rounded-2xl p-4 inline-block">
                  <span className="text-[10px] font-black text-amber-400 uppercase tracking-widest block mb-1">Authentic Guarantee</span>
                  <span className="text-sm font-black text-white uppercase italic">7 Day Express Delivery</span>
                </div>
            </div>
            <Button 
              onClick={() => { setOrderComplete(false); setStep('category'); }}
              className="bg-white text-slate-900 rounded-full px-12 py-6 font-black uppercase tracking-widest text-xs shadow-2xl hover:scale-105 transition-transform"
            >
              Back to Studio
            </Button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
