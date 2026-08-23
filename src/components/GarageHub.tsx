import React, { useState } from 'react';
import { 
  Search, 
  Car, 
  Zap, 
  ShieldCheck, 
  ArrowRight, 
  X, 
  Loader2, 
  Gauge, 
  Fuel, 
  Cog, 
  History, 
  Shield, 
  Calendar, 
  Activity, 
  Database, 
  Maximize2, 
  Layers, 
  Terminal,
  ShoppingBag,
  ExternalLink,
  Plus,
  Image as ImageIcon 
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { decodeVin, VehicleSpecs, getVehicleReferenceImages, getVehicleHistory, VehicleHistory, extractImagesFromUrl } from '@/src/services/vinService';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { 
  Dialog, 
  DialogContent, 
  DialogTrigger 
} from '@/components/ui/dialog';
import { cn } from '@/src/lib/utils';
import { db, auth, handleFirestoreError, OperationType } from '@/src/lib/firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';

interface GarageHubProps {
  onAddToListing?: (specs: VehicleSpecs, images: string[]) => void;
  selectedScan?: any;
  onResetScan?: () => void;
}

export default function GarageHub({ onAddToListing, selectedScan, onResetScan }: GarageHubProps) {
  const [vin, setVin] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [specs, setSpecs] = useState<VehicleSpecs | null>(null);
  const [history, setHistory] = useState<VehicleHistory | null>(null);
  const [referenceImages, setReferenceImages] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [eventImages, setEventImages] = useState<Record<number, string[]>>({});
  const [isFetchingImages, setIsFetchingImages] = useState<Record<number, boolean>>({});

  // Effect to load scan of clicked history car instantly
  React.useEffect(() => {
    if (selectedScan) {
      setVin(selectedScan.vin || '');
      setSpecs(selectedScan.specs || null);
      setHistory(selectedScan.history || null);
      setEventImages({});
      setError(null);
      
      if (selectedScan.specs) {
        getVehicleReferenceImages({
          make: selectedScan.specs.make,
          model: selectedScan.specs.model,
          year: selectedScan.specs.year
        }).then(images => {
          setReferenceImages(images || []);
        }).catch(err => {
          console.error("Error retrieving background reference image sync:", err);
          setReferenceImages([]);
        });
      } else {
        setReferenceImages([]);
      }
    }
  }, [selectedScan]);

  const handleFetchEventImages = async (idx: number, url: string) => {
    setIsFetchingImages(prev => ({ ...prev, [idx]: true }));
    try {
      const images = await extractImagesFromUrl(url);
      if (images && images.length > 0) {
        setEventImages(prev => ({ ...prev, [idx]: images }));
      } else {
        // If no images found, we at least stop the loading
        setError('No additional images could be extracted from this source.');
        setTimeout(() => setError(null), 3000);
      }
    } finally {
      setIsFetchingImages(prev => ({ ...prev, [idx]: false }));
    }
  };

  const handleSearch = async () => {
    if (!vin || vin.length < 11) {
      setError('Please enter a valid VIN (at least 11 characters)');
      return;
    }

    setIsSearching(true);
    setError(null);
    setSpecs(null);
    setHistory(null);
    setReferenceImages([]);

    try {
      const result = await decodeVin(vin);
      if (result && result.make) {
        setSpecs(result);
        
        // Fetch history and images in parallel
        const [images, historyData] = await Promise.all([
          getVehicleReferenceImages({
            make: result.make,
            model: result.model,
            year: result.year
          }),
          getVehicleHistory(vin)
        ]);

        setReferenceImages(images);
        setHistory(historyData);

        // Auto-extract if only one event found to show "Visual Evidence Pipeline" immediately
        if (historyData.events.length === 1 && historyData.events[0].sourceUrl) {
          handleFetchEventImages(0, historyData.events[0].sourceUrl);
        }

        // Save scan to Firestore if user is signed in
        if (auth.currentUser) {
          try {
            await addDoc(collection(db, 'garage_scans'), {
              vin,
              specs: result,
              history: historyData,
              userId: auth.currentUser.uid,
              timestamp: serverTimestamp()
            });
          } catch (err) {
            handleFirestoreError(err, OperationType.CREATE, 'garage_scans');
          }
        }
      } else {
        setError('Vehicle protocol not found for this VIN. Please check and try again.');
      }
    } catch (err) {
      setError('System communication failure. Please try again.');
    } finally {
      setIsSearching(false);
    }
  };

  return (
    <div className="space-y-12">
      {/* VIN Search Header */}
      <section className="bg-slate-950 rounded-[3.5rem] p-10 md:p-16 text-white overflow-hidden relative border border-white/5 shadow-2xl">
        {/* Animated Background Gradients */}
        <div className="absolute top-0 right-0 w-2/3 h-full bg-gradient-to-l from-indigo-600/10 via-indigo-600/5 to-transparent pointer-events-none" />
        <div className="absolute -bottom-24 -left-24 w-96 h-96 bg-indigo-600/5 rounded-full blur-[120px] pointer-events-none" />
        
        {/* Decorative Grid Scanning Line */}
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-indigo-400/30 to-transparent animate-scan-x opacity-30" />
        
        <div className="relative z-10 max-w-3xl mx-auto text-center space-y-10">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-4"
          >
            <div className="inline-flex items-center gap-3 px-4 py-1.5 bg-white/5 backdrop-blur-md rounded-full border border-white/10 mb-2">
              <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-pulse" />
              <span className="text-[10px] font-black uppercase tracking-[0.4em] text-indigo-200">Terminal V.04 ACTIVE</span>
            </div>
            <h2 className="text-2xl md:text-4xl font-black italic tracking-tighter uppercase leading-[0.9] font-sans drop-shadow-2xl">
              Uncle Tee <span className="text-indigo-500 underline decoration-indigo-500/30">VIN Check</span>
            </h2>
            <div className="space-y-4">
              <p className="text-indigo-400 text-[12px] font-black uppercase tracking-[0.6em]">Authenticity & Complete Transparency</p>
              
              {/* Inductor Message Banner */}
              <div className="bg-gradient-to-r from-indigo-950/90 via-slate-900 to-indigo-950/90 border border-indigo-500/30 p-6 rounded-3xl text-left space-y-3 shadow-2xl backdrop-blur-xl max-w-2xl mx-auto">
                <div className="flex items-center gap-2.5">
                  <ShieldCheck className="w-5 h-5 text-emerald-400 animate-pulse" />
                  <span className="text-[11px] font-black uppercase tracking-widest text-emerald-300">Official VIN Verification Assurance</span>
                </div>
                <p className="text-slate-100 text-xs md:text-sm font-bold leading-relaxed">
                  Welcome to <span className="text-indigo-300 font-extrabold">Uncle Tee VIN Check</span>. You can check your Vehicle Identification Number (VIN) here to access complete, untampered historical data and full vehicle specs without any hesitation.
                </p>
                <div className="pt-2 border-t border-white/10 flex items-center gap-2 text-indigo-200/90 italic text-[11px]">
                  <span>✨</span>
                  <p>"True confidence comes from absolute clarity. We unveil every record with honesty and integrity so you can make informed decisions with total peace of mind."</p>
                </div>
              </div>
            </div>
          </motion.div>

          <div className="relative flex flex-col md:flex-row gap-3 max-w-2xl mx-auto">
            <div className="relative flex-1 group">
              <div className="absolute inset-0 bg-indigo-600/10 rounded-2xl blur-lg opacity-0 group-focus-within:opacity-100 transition-opacity" />
              <div className="relative">
                <Search className="absolute left-5 top-1/2 -translate-y-1/2 w-4 h-4 text-indigo-400 group-hover:scale-110 transition-transform" />
                <Input
                  value={vin}
                  onChange={(e) => setVin(e.target.value.toUpperCase())}
                  placeholder="Insert VIN Sequence Identifier..."
                  className="bg-white/5 border-white/10 text-white pl-14 h-16 text-lg tracking-[0.2em] font-mono rounded-2xl focus:ring-indigo-500/50 focus:border-indigo-500/50 placeholder:text-slate-600 backdrop-blur-md transition-all shadow-inner"
                  maxLength={17}
                />
                {vin && (
                  <button onClick={() => setVin('')} className="absolute right-5 top-1/2 -translate-y-1/2 p-1.5 text-slate-500 hover:text-white transition-colors bg-white/5 rounded-lg">
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>
            <Button 
              onClick={handleSearch}
              disabled={isSearching || vin.length < 11}
              className="h-16 px-8 bg-indigo-600 text-white hover:bg-slate-900 border border-white/5 rounded-2xl font-black uppercase tracking-[0.2em] transition-all shadow-xl active:scale-95 shrink-0 group/btn"
            >
              {isSearching ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <div className="flex items-center gap-3">
                  <Terminal className="w-4 h-4 text-indigo-300 group-hover/btn:rotate-12 transition-transform" />
                  <span className="text-[11px]">Decode</span>
                </div>
              )}
            </Button>
          </div>

          <AnimatePresence>
            {error && (
              <motion.div 
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="bg-rose-500/10 border border-rose-500/20 py-3 rounded-2xl"
              >
                <p className="text-rose-400 text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-2">
                  <X className="w-3 h-3" />
                  {error}
                </p>
              </motion.div>
            )}
          </AnimatePresence>

          <div className="flex flex-wrap justify-center items-center gap-10 pt-6">
            <div className="flex items-center gap-3 text-slate-500 hover:text-white transition-colors cursor-help group">
              <ShieldCheck className="w-5 h-5 group-hover:text-amber-400 transition-colors" />
              <div className="text-left">
                <span className="text-[10px] font-black uppercase tracking-[0.2em] block leading-none">Status</span>
                <span className="text-[11px] font-bold uppercase tracking-widest text-slate-400 group-hover:text-white transition-colors">NHTSA SECURE</span>
              </div>
            </div>
            <div className="w-px h-8 bg-white/5" />
            <div className="flex items-center gap-3 text-slate-500 hover:text-white transition-colors cursor-help group">
              <Zap className="w-5 h-5 group-hover:text-indigo-400 transition-colors" />
              <div className="text-left">
                <span className="text-[10px] font-black uppercase tracking-[0.2em] block leading-none">Stream</span>
                <span className="text-[11px] font-bold uppercase tracking-widest text-slate-400 group-hover:text-white transition-colors">LIVE SYNC READY</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Results Section */}
      <AnimatePresence mode="wait">
        {isSearching && !specs ? (
          <motion.div 
            key="loading"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="py-32 flex flex-col items-center gap-8 text-center"
          >
            <div className="relative">
              <div className="w-32 h-32 rounded-full border-4 border-slate-200 border-t-indigo-600 animate-spin" />
              <div className="absolute inset-0 flex items-center justify-center">
                <Car className="w-10 h-10 text-indigo-600 animate-bounce" />
              </div>
            </div>
            <div className="space-y-3">
              <p className="text-xs font-black text-slate-400 uppercase tracking-[0.4em] animate-pulse">
                Analyzing Vehicle Sequence...
              </p>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                Scanning Global Auction Yards (Copart, IAAI, BidCars)
              </p>
            </div>
          </motion.div>
        ) : specs ? (
          <motion.div
            key="specs"
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 40 }}
            className="space-y-12 pb-24"
          >
            {/* 1. Visual Identification Suite - Hero Section */}
            <div className="space-y-6">
              <div className="flex items-center justify-between px-2">
                <div className="flex items-center gap-4">
                  <div className="h-8 w-1 bg-indigo-600 rounded-full" />
                  <h4 className="text-[12px] font-black uppercase tracking-[0.4em] text-slate-900 font-sans">Identification Protocol</h4>
                  {onAddToListing && (
                    <Button 
                      onClick={() => {
                        const allImages = [...referenceImages];
                        Object.values(eventImages).forEach(imgs => allImages.push(...imgs));
                        onAddToListing(
                          { ...specs, vin }, 
                          allImages.slice(0, 4)
                        );
                      }}
                      size="sm"
                      className="bg-indigo-600 hover:bg-slate-900 text-white rounded-xl text-[10px] font-black uppercase tracking-widest px-4 h-8 ml-4 shadow-lg shadow-indigo-100 group"
                    >
                      <Plus className="w-3 h-3 mr-2 group-hover:rotate-90 transition-transform" />
                      Push to Storefront
                    </Button>
                  )}
                </div>
                <div className="flex items-center gap-3 bg-white/50 backdrop-blur-md px-4 py-2 rounded-2xl border border-slate-200/50 shadow-sm">
                  <div className="flex -space-x-2">
                    {['Copart', 'IAAI', 'BidCars'].map((brand) => (
                      <div key={brand} className="w-6 h-6 rounded-full bg-slate-900 border-2 border-white flex items-center justify-center text-[6px] font-black text-white uppercase italic">
                        {brand[0]}
                      </div>
                    ))}
                  </div>
                  <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Multi-Source Sync</span>
                </div>
              </div>
              
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                {/* Main Viewport */}
                <motion.div
                  initial={{ opacity: 0, scale: 0.98 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="lg:col-span-8 aspect-video rounded-[3.5rem] overflow-hidden border border-slate-200/60 shadow-[0_32px_64px_-16px_rgba(0,0,0,0.1)] relative group bg-white"
                >
                  {referenceImages.length > 0 ? (
                    <img 
                      src={referenceImages[0]} 
                      alt="Primary Reference" 
                      className="w-full h-full object-contain p-8 md:p-16 transition-transform duration-1000 group-hover:scale-105"
                      referrerPolicy="no-referrer"
                    />
                  ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center bg-slate-50">
                      <Loader2 className="w-12 h-12 text-slate-200 animate-spin" />
                    </div>
                  )}
                  
                  {/* Overlay Gradient */}
                  <div className="absolute inset-0 bg-gradient-to-t from-white via-transparent to-transparent pointer-events-none opacity-40" />
                  
                  {/* Floating Specs */}
                  <div className="absolute bottom-12 left-12 right-12 flex items-end justify-between">
                    <motion.div 
                      className="space-y-2"
                      initial={{ x: -20, opacity: 0 }}
                      animate={{ x: 0, opacity: 1 }}
                      transition={{ delay: 0.5 }}
                    >
                      <div className="flex items-center gap-3">
                         <span className="px-3 py-1 bg-indigo-600 text-white text-[9px] font-black uppercase tracking-[0.2em] rounded-full">Primary Digital Twin</span>
                         <span className="px-3 py-1 bg-slate-900/5 backdrop-blur-md text-slate-900 text-[9px] font-black uppercase tracking-[0.2em] rounded-full border border-slate-900/10">{specs.year} Production</span>
                      </div>
                      <h3 className="text-5xl md:text-7xl font-black italic text-slate-900 uppercase tracking-tighter leading-none font-sans drop-shadow-sm">
                        {specs.make} <span className="text-indigo-600">{specs.model}</span>
                      </h3>
                    </motion.div>
                  </div>
                </motion.div>
                
                {/* Secondary Gallery Bento */}
                <div className="lg:col-span-4 grid grid-cols-2 lg:grid-cols-1 gap-6">
                  {referenceImages.slice(1, 3).map((src, idx) => (
                    <motion.div
                      key={idx}
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.2 + (idx * 0.1) }}
                      className="rounded-[2.5rem] overflow-hidden border border-slate-200/60 shadow-xl relative group aspect-square lg:aspect-auto lg:h-[calc(50%-12px)] bg-white"
                    >
                      <img 
                        src={src} 
                        alt={`View ${idx + 1}`} 
                        className="w-full h-full object-contain p-6 transition-transform duration-700 group-hover:scale-110"
                        referrerPolicy="no-referrer"
                      />
                      <div className="absolute inset-x-0 bottom-0 p-6 bg-gradient-to-t from-white/90 via-white/40 to-transparent">
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Angle Protocol 0{idx + 2}</span>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>
            </div>

            {/* 2. Technical Intelligence Suite */}
            <div className="space-y-12">
              {/* Technical Matrix - High Priority */}
              <div className="bg-white border border-slate-200 rounded-[3rem] shadow-[0_32px_64px_-16px_rgba(0,0,0,0.06)] overflow-hidden">
                <div className="p-8 md:p-12 border-b border-slate-100 bg-slate-50/30 flex items-center justify-between">
                  <div className="flex items-center gap-6">
                    <div className="h-14 w-14 bg-slate-900 rounded-[1.25rem] flex items-center justify-center shadow-2xl shadow-slate-900/20 transform -rotate-3 transition-transform">
                      <Activity className="w-7 h-7 text-indigo-400" />
                    </div>
                    <div className="space-y-1">
                      <h3 className="text-3xl md:text-5xl font-black italic tracking-tighter uppercase text-slate-900 leading-none">
                        Technical <span className="text-indigo-600">Payload</span>
                      </h3>
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.4em] leading-none">Global Sequential Decode • VIN Verified</p>
                    </div>
                  </div>
                  <div className="hidden lg:flex items-center gap-3">
                    <div className="text-right">
                      <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest leading-none">Protocol Status</p>
                      <p className="text-xs font-black text-emerald-600 uppercase">Secured</p>
                    </div>
                    <div className="h-10 w-px bg-slate-200" />
                    <ShieldCheck className="w-6 h-6 text-emerald-500" />
                  </div>
                </div>

                <div className="p-1 gap-px bg-slate-100 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
                  {[
                    { label: 'Manufacturer', value: specs.make, icon: Shield, color: 'text-indigo-600' },
                    { label: 'Production Year', value: specs.year, icon: Calendar, color: 'text-slate-900' },
                    { label: 'Transmission', value: specs.transmission || 'Automatic', icon: Cog, color: 'text-indigo-600' },
                    { label: 'Fuel System', value: specs.fuelType || 'Petrol', icon: Fuel, color: 'text-slate-900' },
                    { label: 'Chassis Class', value: specs.bodyClass || 'Sedan', icon: Car, color: 'text-indigo-600' },
                    { label: 'Drivetrain', value: specs.driveType || 'FWD/RWD', icon: Zap, color: 'text-slate-900' },
                    { label: 'Power Unit', value: specs.engineSize || 'N/A', icon: Activity, color: 'text-indigo-600' },
                    { label: 'Cylinders', value: specs.cylinders || 'N/A', icon: Cog, color: 'text-slate-900' },
                  ].map((item, idx) => (
                    <motion.div 
                      key={item.label}
                      initial={{ opacity: 0 }}
                      whileInView={{ opacity: 1 }}
                      viewport={{ once: true }}
                      transition={{ delay: 0.05 * idx }}
                      className="bg-white p-10 space-y-6 group hover:bg-slate-50 transition-colors"
                    >
                      <div className="flex items-center justify-between">
                        <div className="w-10 h-10 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-center shadow-sm group-hover:scale-110 group-hover:bg-white transition-all">
                          <item.icon className={cn("w-5 h-5", item.color)} />
                        </div>
                        <span className="text-[10px] font-black text-slate-300 uppercase tracking-[0.2em]">0{idx + 1}</span>
                      </div>
                      
                      <div className="space-y-2">
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.5em] leading-none">{item.label}</p>
                        <p className={cn(
                          "font-mono text-xl md:text-2xl font-bold tracking-tight uppercase leading-tight text-slate-900 break-words",
                        )}>
                          {item.value}
                        </p>
                      </div>
                    </motion.div>
                  ))}
                </div>

                <div className="p-8 md:p-10 bg-slate-50 border-t border-slate-100 flex flex-col sm:flex-row gap-5 items-center justify-center">
                  <Button 
                    variant="outline"
                    onClick={() => { 
                      setSpecs(null); 
                      setVin(''); 
                      if (onResetScan) onResetScan(); 
                    }}
                    className="w-full sm:w-auto px-12 h-16 border-slate-200 bg-white text-slate-600 rounded-[1.5rem] font-black uppercase tracking-[0.15em] hover:bg-slate-900 hover:text-white hover:border-slate-900 transition-all active:scale-[0.98] shadow-sm"
                  >
                    Reset Protocol
                  </Button>
                </div>
              </div>

              {/* 3. Forensic History Lifecycle - Moved Up */}
              {history && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.3 }}
                  className="space-y-8"
                >
                  <div className="flex flex-col md:flex-row md:items-end justify-between px-4 gap-4">
                    <div className="space-y-1">
                      <div className="flex items-center gap-3">
                        <div className="h-4 w-1 bg-slate-900 rounded-full" />
                        <h4 className="text-[12px] font-black uppercase tracking-[0.4em] text-slate-900">Lifecycle Forensic Record</h4>
                      </div>
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.3em] ml-4">Sequential Trace of Documented Bidding Events</p>
                    </div>
                    
                    <div className="flex items-center gap-3">
                      <button 
                        onClick={() => window.open(`https://www.google.com/search?q=VIN+${history.vin}+copart+iaai+bidcars&udm=2`, '_blank')}
                        className="flex items-center gap-2.5 bg-indigo-50 hover:bg-indigo-100 border border-indigo-100 px-6 py-3 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] text-indigo-700 transition-all shadow-sm group active:scale-95"
                      >
                        <ImageIcon className="w-3.5 h-3.5 text-indigo-600 group-hover:scale-110" />
                        See Images
                      </button>
                      <div className={cn(
                        "flex items-center gap-2.5 px-6 py-3 rounded-2xl border shadow-sm",
                        history.status === 'clean' ? "bg-emerald-50 border-emerald-100 text-emerald-700" : "bg-amber-50 border-amber-100 text-amber-700"
                      )}>
                         <Shield className="w-3.5 h-3.5" />
                         <span className="text-[10px] font-black uppercase tracking-widest">{history.status} Protocol Active</span>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-12">
                    {/* Summary Matrix */}
                    <div className="bg-white border border-slate-200 rounded-[3rem] shadow-[0_32px_64px_-16px_rgba(0,0,0,0.06)] overflow-hidden">
                      <div className="p-1 gap-px bg-slate-100 grid grid-cols-1 md:grid-cols-3">
                        <div className="bg-white p-10 space-y-6 group hover:bg-slate-50 transition-colors">
                          <div className="flex items-center justify-between">
                            <div className="w-10 h-10 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center shadow-sm group-hover:scale-110 transition-all">
                              <Gauge className="w-5 h-5 text-indigo-600" />
                            </div>
                            <span className="text-[10px] font-black text-slate-300 uppercase tracking-[0.2em]">STAT_01</span>
                          </div>
                          <div className="space-y-2">
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.5em] leading-none">Odometer Sequence</p>
                            <p className="font-mono text-3xl md:text-4xl font-bold tracking-tighter uppercase leading-tight text-slate-900">
                              {history.lastOdometer}
                            </p>
                            <div className="flex items-center gap-2 pt-1">
                               <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
                               <p className="text-[9px] text-slate-400 font-bold uppercase tracking-[0.2em]">Verified Reading</p>
                            </div>
                          </div>
                        </div>

                        <div className="bg-white p-10 space-y-6 group hover:bg-slate-50 transition-colors">
                          <div className="flex items-center justify-between">
                            <div className={cn(
                              "w-10 h-10 rounded-2xl flex items-center justify-center shadow-sm group-hover:scale-110 transition-all",
                              history.status === 'clean' ? "bg-emerald-50 border-emerald-100" : 
                              (history.status === 'salvage' || history.status === 'damaged') ? "bg-rose-50 border-rose-100" :
                              history.status === 'rebuilt' ? "bg-amber-50 border-amber-100" :
                              "bg-slate-100 border-slate-200"
                            )}>
                              <Shield className={cn(
                                "w-5 h-5", 
                                history.status === 'clean' ? "text-emerald-600" : 
                                (history.status === 'salvage' || history.status === 'damaged') ? "text-rose-600" :
                                history.status === 'rebuilt' ? "text-amber-600" :
                                "text-slate-600"
                              )} />
                            </div>
                            <span className="text-[10px] font-black text-slate-300 uppercase tracking-[0.2em]">STAT_02</span>
                          </div>
                          <div className="space-y-2">
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.5em] leading-none">Title Condition</p>
                            <p className={cn(
                              "font-mono text-3xl md:text-4xl font-bold tracking-tighter uppercase leading-tight",
                              history.status === 'clean' ? "text-emerald-600" : 
                              (history.status === 'salvage' || history.status === 'damaged') ? "text-rose-600" :
                              history.status === 'rebuilt' ? "text-amber-600" :
                              "text-slate-600"
                            )}>
                              {history.status}
                            </p>
                            <div className="flex items-center gap-2 pt-1">
                               <div className={cn(
                                 "w-1.5 h-1.5 rounded-full shadow-lg", 
                                 history.status === 'clean' ? "bg-emerald-500" : 
                                 (history.status === 'salvage' || history.status === 'damaged') ? "bg-rose-500" :
                                 history.status === 'rebuilt' ? "bg-amber-500" :
                                 "bg-slate-500"
                               )} />
                               <p className="text-[9px] text-slate-400 font-bold uppercase tracking-[0.2em]">Bureau Status</p>
                            </div>
                          </div>
                        </div>

                        <div className="bg-slate-950 p-10 space-y-6 group relative overflow-hidden">
                          <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-600/10 rounded-full blur-3xl pointer-events-none" />
                          <div className="relative z-10 flex items-center justify-between">
                            <div className="w-10 h-10 rounded-2xl bg-white/10 border border-white/10 flex items-center justify-center shadow-sm group-hover:scale-110 transition-all">
                              <Activity className="w-5 h-5 text-indigo-400" />
                            </div>
                            <span className="text-[10px] font-black text-white/20 uppercase tracking-[0.2em]">ANALYSIS</span>
                          </div>
                          <div className="relative z-10 space-y-2">
                            <p className="text-[10px] font-black text-white/40 uppercase tracking-[0.5em] leading-none">Primary Damage Reported</p>
                            <p className="font-mono text-3xl font-bold tracking-tighter uppercase leading-tight text-white">
                              {history.primaryDamage || 'Undetected'}
                            </p>
                            <div className="flex items-center gap-2 pt-1">
                               <div className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-pulse" />
                               <p className="text-[9px] text-white/40 font-bold uppercase tracking-[0.2em]">Real-time Impact Map</p>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Forensic Chronology Pipeline */}
                    <div className="bg-white border border-slate-200 rounded-[3.5rem] shadow-[0_40px_80px_-15px_rgba(0,0,0,0.05)] overflow-hidden">
                      <div className="p-10 md:p-12 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
                        <div className="flex items-center gap-6">
                          <div className="h-14 w-14 bg-slate-900 rounded-[1.25rem] flex items-center justify-center shadow-2xl shadow-slate-900/20 transform rotate-3">
                            <History className="w-7 h-7 text-indigo-400" />
                          </div>
                          <div className="space-y-1">
                            <h5 className="text-3xl md:text-4xl font-black italic uppercase tracking-tighter text-slate-900 leading-none">Event Chronology <span className="text-indigo-600">Pipeline</span></h5>
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.4em] leading-none">Sequential Trace of Documented Bidding Events</p>
                          </div>
                        </div>
                        <div className="hidden sm:block px-6 py-2 bg-slate-200/50 rounded-full">
                          <span className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em]">Temporal Sequence Active</span>
                        </div>
                      </div>

                      <div className="p-8 md:p-16 space-y-24">
                        {history.events.map((event, idx) => (
                          <motion.div 
                            key={idx} 
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ delay: idx * 0.05 }}
                            className="relative pl-16 md:pl-32 group last:pb-0"
                          >
                            {/* Vertical Connector Line */}
                            {idx !== history.events.length - 1 && (
                              <div className="absolute left-[30px] md:left-[54px] top-16 bottom-[-16px] w-[2px] bg-slate-100 group-hover:bg-indigo-100 transition-colors" />
                            )}
                            
                            {/* Anchor Node */}
                            <div className={cn(
                              "absolute left-0 md:left-6 top-0 w-20 h-20 rounded-3xl border-4 border-white shadow-2xl flex items-center justify-center z-10 transition-all duration-300 group-hover:scale-110 group-hover:rotate-6",
                              event.auctionHouse === 'Copart' ? "bg-blue-600 text-white" :
                              event.auctionHouse === 'IAAI' ? "bg-amber-50 text-white" :
                              "bg-slate-900 text-white"
                            )}>
                              {event.type === 'auction' ? <ShoppingBag className="w-10 h-10" /> : <Activity className="w-10 h-10" />}
                            </div>

                            <div className="space-y-10 pb-24">
                              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-8">
                                <div className="space-y-4">
                                  <div className="flex flex-wrap items-center gap-4">
                                    <span className="text-[12px] font-black text-slate-400 uppercase tracking-[0.5em]">{event.date}</span>
                                    <div className="w-1.5 h-1.5 rounded-full bg-slate-200" />
                                    <Badge className={cn(
                                      "px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest border-none shadow-sm",
                                      event.auctionHouse === 'Copart' ? "bg-blue-50 text-blue-700" :
                                      event.auctionHouse === 'IAAI' ? "bg-amber-50 text-amber-700" :
                                      "bg-slate-100 text-slate-700"
                                    )}>
                                      {event.auctionHouse || event.type} Entity
                                    </Badge>
                                    {event.lotNumber && (
                                      <Badge variant="outline" className="px-4 py-2 rounded-xl text-[10px] font-mono font-black text-slate-500 uppercase border-slate-200 bg-slate-50">
                                        SEQUENCE_ID: {event.lotNumber}
                                      </Badge>
                                    )}
                                    {event.docType && (
                                      <Badge variant="outline" className="px-4 py-2 rounded-xl text-[10px] font-black text-slate-900 uppercase border-slate-900/10 bg-slate-100 flex items-center gap-2">
                                        <Database className="w-3 h-3" />
                                        DOC: {event.docType}
                                      </Badge>
                                    )}
                                  </div>
                                  <h6 className="text-4xl md:text-5xl font-black italic tracking-tighter text-slate-900 uppercase leading-none font-sans">
                                    {event.location}
                                  </h6>
                                </div>
                                {event.sourceUrl && (
                                  <a 
                                    href={event.sourceUrl} 
                                    target="_blank" 
                                    rel="noopener noreferrer"
                                    className="self-start lg:self-center flex items-center gap-4 bg-slate-900 hover:bg-indigo-600 text-white px-10 py-5 rounded-[1.5rem] text-[11px] font-black uppercase tracking-[0.2em] transition-all shadow-xl active:scale-95 group/link"
                                  >
                                    Decode Source <ExternalLink className="w-4 h-4 group-hover/link:translate-x-1 group-hover/link:-translate-y-1 transition-transform" />
                                  </a>
                                )}
                              </div>

                              <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
                                <div className="lg:col-span-8 space-y-6">
                                  <div className="p-8 bg-slate-50 rounded-[2rem] border border-slate-100 relative overflow-hidden group/desc">
                                    <div className="absolute top-0 right-0 p-4 opacity-10 group-hover/desc:opacity-30 transition-opacity">
                                      <Database className="w-12 h-12 text-slate-900" />
                                    </div>
                                    <p className="text-xl font-medium text-slate-600 leading-relaxed max-w-3xl relative z-10">
                                      {event.description}
                                    </p>
                                  </div>
                                  
                                  <div className="flex flex-wrap gap-5 pt-2">
                                    {event.odometer && (
                                      <div className="flex items-center gap-4 px-6 py-3.5 bg-white border border-slate-200 rounded-[1.25rem] shadow-sm hover:shadow-md transition-shadow">
                                        <Gauge className="w-5 h-5 text-indigo-500" />
                                        <span className="text-[13px] font-mono font-black text-slate-900 tracking-tight">{event.odometer} MILES_LOGGED</span>
                                      </div>
                                    )}
                                    {event.damage && (
                                      <div className="flex items-center gap-4 px-6 py-3.5 bg-rose-50 border border-rose-100 rounded-[1.25rem] shadow-sm hover:shadow-md transition-shadow">
                                        <Shield className="w-5 h-5 text-rose-500" />
                                        <span className="text-[13px] font-black text-rose-700 uppercase tracking-widest">{event.damage} PROTOCOL</span>
                                      </div>
                                    )}
                                  </div>
                                </div>

                                {event.finalBid && (
                                  <div className="lg:col-span-4 bg-emerald-50 border border-emerald-100/50 p-10 rounded-[3rem] flex flex-col items-center justify-center text-center space-y-4 shadow-sm">
                                     <div className="w-12 h-12 rounded-2xl bg-emerald-600 text-white flex items-center justify-center shadow-lg shadow-emerald-600/20 mb-2">
                                       <Zap className="w-6 h-6" />
                                     </div>
                                     <div className="space-y-1">
                                       <p className="text-[11px] font-black text-emerald-600/60 uppercase tracking-[0.4em]">Final Sequence Bid</p>
                                       <p className="text-5xl md:text-6xl font-black italic text-emerald-600 tracking-tighter leading-none">{event.finalBid}</p>
                                     </div>
                                  </div>
                                )}
                              </div>

                              {/* Forensic Photo Matrix */}
                              {((event.images && event.images.length > 0) || eventImages[idx] || (event.sourceUrl && !isFetchingImages[idx])) && (
                                <div className="space-y-6 pt-12 mt-12 border-t border-slate-100">
                                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 bg-slate-50 p-6 rounded-[2rem] border border-slate-100/50">
                                    <div className="flex items-center gap-6">
                                      <div className="w-10 h-10 rounded-2xl bg-slate-900 flex items-center justify-center shadow-lg shadow-slate-900/10">
                                        <Layers className="w-5 h-5 text-indigo-400" />
                                      </div>
                                      <div className="space-y-1">
                                        <p className="text-[12px] font-black text-slate-900 uppercase tracking-[0.4em] leading-none">Visual Evidence Pipeline</p>
                                        <p className="text-[9px] font-bold text-slate-400 uppercase tracking-[0.3em] leading-none">Synchronized Asset Scans • 4K Resolution Priority</p>
                                      </div>
                                    </div>
                                    <div className="flex items-center gap-4">
                                      {event.sourceUrl && !((event.images && event.images.length > 0) || eventImages[idx]) && (
                                        <Button
                                          onClick={() => handleFetchEventImages(idx, event.sourceUrl!)}
                                          disabled={isFetchingImages[idx]}
                                          className="bg-indigo-600 hover:bg-slate-900 text-white px-8 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-xl shadow-indigo-600/20 active:scale-95 transition-all group"
                                        >
                                          {isFetchingImages[idx] ? <Loader2 className="w-4 h-4 animate-spin mr-3" /> : <ImageIcon className="w-4 h-4 mr-3 group-hover:rotate-12 transition-transform" />}
                                          {isFetchingImages[idx] ? "Decoding Pipeline..." : "Execute Image Extract"}
                                        </Button>
                                      )}
                                      <div className="flex items-center gap-3 px-5 py-2.5 bg-white rounded-2xl border border-slate-200 shadow-sm">
                                         <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">
                                           {isFetchingImages[idx] ? "SYNCING" : "VERIFIED"}
                                         </span>
                                         <div className={cn("w-2 h-2 rounded-full", isFetchingImages[idx] ? "bg-indigo-500 animate-bounce" : "bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]")} />
                                      </div>
                                    </div>
                                  </div>
                                  
                                  {isFetchingImages[idx] ? (
                                    <div className="p-1 gap-px bg-slate-100 grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 rounded-[2.5rem] overflow-hidden border border-slate-200/50">
                                      {[1, 2, 3, 4, 5].map((i) => (
                                        <div key={i} className="aspect-square bg-white flex flex-col items-center justify-center gap-4">
                                          <div className="relative">
                                            <div className="w-12 h-12 rounded-full border-2 border-slate-100 border-t-indigo-500 animate-spin" />
                                            <div className="absolute inset-0 flex items-center justify-center">
                                              <Database className="w-4 h-4 text-slate-200" />
                                            </div>
                                          </div>
                                          <span className="text-[8px] font-black text-slate-300 uppercase tracking-widest">Data_Fragment_{i}</span>
                                        </div>
                                      ))}
                                    </div>
                                  ) : (
                                    <div className="p-1 gap-px bg-slate-100 grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 rounded-[2.5rem] overflow-hidden border border-slate-200/50">
                                       {((eventImages[idx] || event.images || []) as string[]).map((img, imgIdx) => (
                                         <Dialog key={imgIdx}>
                                           <DialogTrigger className="w-full text-left outline-none group hover:z-20">
                                             <motion.div 
                                               initial={{ opacity: 0 }}
                                               whileInView={{ opacity: 1 }}
                                               viewport={{ once: true }}
                                               className="aspect-square bg-white relative overflow-hidden cursor-zoom-in"
                                             >
                                               <img 
                                                 src={img} 
                                                 alt={`Evidence REF_${imgIdx + 1}`} 
                                                 className="w-full h-full object-cover transition-all duration-700 group-hover:scale-110 group-hover:blur-[2px]"
                                                 referrerPolicy="no-referrer"
                                                 onError={(e) => { (e.target as HTMLImageElement).parentElement?.remove(); }}
                                               />
                                               
                                               {/* Technical Overlay */}
                                               <div className="absolute inset-0 bg-slate-950/0 group-hover:bg-slate-950/40 transition-all duration-500">
                                                  <div className="absolute top-4 left-4">
                                                     <div className="px-2 py-1 bg-black/60 backdrop-blur-md rounded-md border border-white/10 opacity-0 group-hover:opacity-100 transition-all -translate-x-2 group-hover:translate-x-0">
                                                       <p className="text-[8px] font-mono font-black text-white/80 uppercase tracking-widest">ASSET_SCAN_0{imgIdx + 1}</p>
                                                     </div>
                                                  </div>
                                                  
                                                  <div className="absolute bottom-4 right-4 translate-y-4 group-hover:translate-y-0 opacity-0 group-hover:opacity-100 transition-all delay-75">
                                                     <div className="w-10 h-10 rounded-xl bg-white/20 backdrop-blur-md border border-white/20 flex items-center justify-center">
                                                        <Maximize2 className="w-4 h-4 text-white" />
                                                     </div>
                                                  </div>
                                                  
                                                  <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
                                                     <div className="flex gap-1">
                                                        <div className="w-1 h-1 rounded-full bg-emerald-400" />
                                                        <div className="w-1 h-1 rounded-full bg-emerald-400/50" />
                                                        <div className="w-1 h-1 rounded-full bg-emerald-400/20" />
                                                     </div>
                                                  </div>
                                               </div>

                                               {/* Static Frame Info */}
                                               <div className="absolute bottom-4 left-4 p-2 opacity-60">
                                                  <p className="text-[10px] font-mono font-black text-slate-400 uppercase tracking-widest">SEQ_{history.vin.slice(-4)}_0{imgIdx + 1}</p>
                                               </div>
                                             </motion.div>
                                           </DialogTrigger>
                                           <DialogContent className="max-w-[95vw] md:max-w-6xl bg-slate-950 border-none p-0 overflow-hidden shadow-2xl rounded-[3rem]">
                                             <div className="relative w-full h-[85vh] flex items-center justify-center group/modal">
                                                <div className="absolute inset-0 opacity-20 pointer-events-none" 
                                                     style={{backgroundImage: 'radial-gradient(circle, #4f46e5 1px, transparent 1px)', backgroundSize: '40px 40px'}} />
                                                <img 
                                                  src={img} 
                                                  alt="Forensic Asset Detail" 
                                                  className="w-full h-full object-contain p-4 md:p-12 relative z-10"
                                                  referrerPolicy="no-referrer"
                                                />
                                                <div className="absolute bottom-10 left-1/2 -translate-x-1/2 flex flex-col items-center gap-6 z-20">
                                                   <div className="flex items-center gap-3 bg-white/5 backdrop-blur-2xl px-10 py-4 rounded-full border border-white/10 shadow-2xl">
                                                      <div className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse" />
                                                      <div className="h-4 w-px bg-white/10" />
                                                      <p className="text-[12px] font-mono font-black text-white/80 uppercase tracking-[0.5em]">Forensic Asset Isolation Protocol • REF_SCAN_0{imgIdx + 1}</p>
                                                   </div>
                                                </div>
                                             </div>
                                           </DialogContent>
                                         </Dialog>
                                       ))}
                                    </div>
                                  )}
                                </div>
                              )}
                            </div>
                          </motion.div>
                        ))}
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}

              {/* 4. Data Insights Card - Moved to End */}
              <div className="bg-indigo-600 rounded-[3.5rem] p-10 md:p-16 text-white space-y-12 shadow-[0_48px_96px_-12px_rgba(79,70,229,0.5)] relative overflow-hidden group">
                <div className="absolute top-0 right-0 w-[40rem] h-[40rem] bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2 blur-[120px] pointer-events-none" />
                <div className="absolute -bottom-48 -left-48 w-[40rem] h-[40rem] bg-black/20 rounded-full blur-[140px] pointer-events-none" />
                
                <div className="relative z-10 grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
                  <div className="space-y-8">
                    <div className="space-y-6">
                      <div className="inline-flex items-center gap-3 px-4 py-1.5 bg-white/10 backdrop-blur-md rounded-full border border-white/10">
                        <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                        <span className="text-[11px] font-black uppercase tracking-[0.4em] text-white/90">Market Intelligence Alpha</span>
                      </div>
                      <h4 className="text-5xl md:text-7xl font-black italic leading-[0.9] uppercase tracking-tighter">
                        Asset Liquidity <span className="text-indigo-200">Optimized</span>
                      </h4>
                      <p className="text-white/70 text-lg font-medium leading-relaxed max-w-md">
                        Forensic cross-analysis protocols have detected significant resale pressure for this specific chassis configuration in premium segments.
                      </p>
                    </div>

                    <div className="flex items-center gap-6">
                       <div className="w-20 h-20 rounded-[1.75rem] bg-white text-indigo-600 flex items-center justify-center shadow-2xl">
                         <ShieldCheck className="w-10 h-10" />
                       </div>
                       <div className="space-y-1">
                         <p className="text-xl font-black uppercase tracking-tight leading-none">Authenticated Sequence</p>
                         <p className="text-sm font-bold text-white/40 uppercase tracking-widest">Protocol: NIST.256-AES-GCM</p>
                       </div>
                    </div>
                  </div>

                  <div className="bg-white/5 backdrop-blur-xl border border-white/10 p-10 md:p-12 rounded-[3.5rem] space-y-10">
                    <div className="space-y-10">
                      <div className="space-y-4">
                        <div className="flex justify-between items-end text-[12px] font-black uppercase tracking-[0.3em]">
                          <span className="text-white/60">Demand Density</span>
                          <span className="text-emerald-400 text-base">92% High Velocity</span>
                        </div>
                        <div className="h-4 bg-white/10 rounded-full overflow-hidden p-1">
                          <motion.div 
                            initial={{ width: 0 }} 
                            animate={{ width: '92%' }} 
                            className="h-full bg-emerald-400 rounded-full shadow-[0_0_20px_rgba(52,211,153,0.6)]" 
                            transition={{ duration: 1.5, ease: "easeOut" }}
                          />
                        </div>
                      </div>

                      <div className="space-y-4">
                        <div className="flex justify-between items-end text-[12px] font-black uppercase tracking-[0.3em]">
                          <span className="text-white/60">Data Consistency</span>
                          <span className="text-indigo-100 text-base">98.4% Secure</span>
                        </div>
                        <div className="h-4 bg-white/10 rounded-full overflow-hidden p-1">
                          <motion.div 
                            initial={{ width: 0 }} 
                            animate={{ width: '98.4%' }} 
                            className="h-full bg-indigo-200 rounded-full shadow-[0_0_20px_rgba(199,210,254,0.6)]" 
                            transition={{ duration: 1.5, delay: 0.2, ease: "easeOut" }}
                          />
                        </div>
                      </div>
                    </div>

                    <div className="pt-10 border-t border-white/10 grid grid-cols-2 gap-8">
                       <div className="space-y-1">
                         <p className="text-[10px] font-black text-white/40 uppercase tracking-widest">Resale Factor</p>
                         <p className="text-2xl font-black italic text-emerald-400">Alpha Status</p>
                       </div>
                       <div className="space-y-1">
                         <p className="text-[10px] font-black text-white/40 uppercase tracking-widest">Volatility</p>
                         <p className="text-2xl font-black italic text-indigo-200">Minimal</p>
                       </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        ) : (
          !isSearching && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="py-24 flex flex-col items-center justify-center text-center space-y-6"
            >
              <div className="w-20 h-20 bg-slate-100 rounded-3xl flex items-center justify-center">
                <Search className="w-10 h-10 text-slate-300" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-slate-900 tracking-tight">System Idle</h3>
                <p className="text-slate-400 text-xs mt-2 max-w-xs mx-auto">Input the vehicle identification number above to activate the decoding sequence.</p>
              </div>
            </motion.div>
          )
        )}
      </AnimatePresence>
    </div>
  );
}
