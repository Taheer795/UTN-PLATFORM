import { useState, useEffect, useRef } from 'react';
import { Listing, CategoryType, MediaAsset } from '@/src/types';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Heart, ShieldCheck, Gauge, MoreHorizontal, Trash2, Edit, SlidersHorizontal, Star, Scissors, Watch, Footprints, Layers, Ruler, Maximize2, ShoppingBag, PhoneCall, Handshake, Video, Play, Pause, Volume2, VolumeX, Copy, Check } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn, getUtnTag } from '@/src/lib/utils';
import JerseyVisual from './JerseyVisual';
import { Dialog, DialogContent, DialogTrigger } from '@/components/ui/dialog';
import { db, auth } from '@/src/lib/firebase';
import { addDoc, collection, serverTimestamp, doc, updateDoc } from 'firebase/firestore';
import { onAuthStateChanged, User } from 'firebase/auth';

interface ListingCardProps {
  listing: Partial<Listing>;
  type: 'wardrobe' | 'garage' | 'jersey';
  onDelete?: () => void;
  onEdit?: () => void;
  onAction?: (customization?: any) => void;
  onOrder?: (customization?: any) => void;
}

const VideoPlayer = ({ src, poster, priority = false }: { src: string, poster?: string, priority?: boolean }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(true);
  const [inView, setInView] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        setInView(entry.isIntersecting);
      },
      { threshold: 0.6 }
    );

    if (videoRef.current) {
      observer.observe(videoRef.current);
    }

    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (videoRef.current) {
      if (inView) {
        videoRef.current.play().catch(() => setIsPlaying(false));
        setIsPlaying(true);
      } else {
        videoRef.current.pause();
        setIsPlaying(false);
      }
    }
  }, [inView]);

  return (
    <div className="relative w-full h-full group/video">
      <video
        ref={videoRef}
        src={src}
        poster={poster}
        muted={isMuted}
        loop
        playsInline
        preload={priority ? "auto" : "metadata"}
        className="w-full h-full object-cover"
      />
      
      <div className="absolute inset-0 bg-black/10 flex flex-col items-center justify-center opacity-0 group-hover/video:opacity-100 transition-opacity">
        <button 
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            if (videoRef.current) {
              if (isPlaying) videoRef.current.pause();
              else videoRef.current.play();
              setIsPlaying(!isPlaying);
            }
          }}
          className="p-3 bg-white/20 backdrop-blur-md rounded-full text-white hover:scale-110 transition-transform"
        >
          {isPlaying ? <Pause className="w-6 h-6" /> : <Play className="w-6 h-6" />}
        </button>
      </div>

      <button 
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          setIsMuted(!isMuted);
        }}
        className="absolute bottom-2 right-2 p-1.5 bg-black/40 backdrop-blur-sm rounded text-white z-20"
      >
        {isMuted ? <VolumeX className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5" />}
      </button>
      
      <div className="absolute top-2 right-2 px-1.5 py-0.5 bg-black/60 backdrop-blur-sm text-[8px] font-black text-white uppercase tracking-widest rounded flex items-center gap-1">
        <div className="w-1 h-1 bg-red-500 rounded-full animate-pulse" />
        Video
      </div>
    </div>
  );
};

export default function ListingCard({ listing, type, onDelete, onEdit, onAction, onOrder }: ListingCardProps) {
  const [copiedVin, setCopiedVin] = useState(false);
  const isAuto = type === 'garage' || listing.siloType === 'garage' || listing.categoryType === CategoryType.AUTOMOBILE || (listing as any).category === CategoryType.AUTOMOBILE || !!listing.autoDetails;
  const isJersey = type === 'jersey' || listing.siloType === 'jersey' || listing.categoryType === CategoryType.JERSEY || (listing as any).category === CategoryType.JERSEY || !!listing.jerseyDetails;
  const isActuallyFabrics = listing.categoryType === CategoryType.FABRICS || (listing as any).category === CategoryType.FABRICS || !!listing.fabricDetails;
  const images = (listing.images || []) as MediaAsset[];
  const hasMultipleImages = images.length > 1;
  const categoryType = listing.categoryType || (isAuto ? CategoryType.AUTOMOBILE : isJersey ? CategoryType.JERSEY : isActuallyFabrics ? CategoryType.FABRICS : CategoryType.APPAREL);
  const carVin = listing.autoDetails?.vin || (listing as any).vin;

  const handleCopyVin = (vinToCopy: string, e?: React.MouseEvent) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    if (!vinToCopy) return;
    navigator.clipboard.writeText(vinToCopy);
    setCopiedVin(true);
    setTimeout(() => setCopiedVin(false), 2500);
  };
  
  const renderActionButtons = (isEnlarged = false) => {
    if (listing.status === 'sold') {
      return (
        <div className="w-full">
          <button 
            disabled
            className="w-full py-3 text-[10px] font-black uppercase tracking-widest rounded-xl bg-slate-100 text-slate-400 cursor-not-allowed border border-slate-200 text-center"
          >
            Sold Out
          </button>
        </div>
      );
    }
    
    if (isAuto) {
      return (
        <div className="flex flex-col gap-2 w-full">
          <div className="grid grid-cols-2 gap-2">
            <button 
              onClick={(e) => {
                if (isEnlarged) e.stopPropagation();
                setBidStatusText('');
                setShowBidModal(true);
              }}
              className={cn(
                "flex-1 px-4 py-3 text-[10px] font-black uppercase tracking-widest transition-all rounded-xl border flex items-center justify-center gap-1.5 active:scale-95",
                isEnlarged 
                  ? "border-indigo-400 text-indigo-300 bg-white/5 hover:bg-white/10" 
                  : "border-indigo-500 text-indigo-600 bg-white hover:bg-slate-50"
              )}
            >
              <Handshake className="w-3.5 h-3.5" />
              Make an Offer
            </button>
            <button 
              onClick={(e) => {
                if (isEnlarged) e.stopPropagation();
                setRevealCallDetails(true);
              }}
              className="flex-1 px-4 py-3 text-[10px] font-black uppercase tracking-widest transition-all rounded-xl shadow-md active:scale-95 flex items-center justify-center gap-1.5 bg-indigo-600 text-white hover:bg-indigo-700 shadow-indigo-100"
            >
              <PhoneCall className="w-3.5 h-3.5" />
              Call
            </button>
          </div>
          
          {revealCallDetails && (
            <motion.div 
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              className={cn(
                "border rounded-xl p-3 mt-1 flex flex-col gap-2 text-center",
                isEnlarged 
                  ? "bg-slate-900 border-slate-700 text-white" 
                  : "bg-slate-50 border-slate-200"
              )}
            >
              <p className="text-[10px] font-extrabold text-slate-500 uppercase">Contact Seller Directly</p>
              <p className="text-lg font-mono font-black text-indigo-400 tracking-wider">08138642942</p>
              <p className="text-[10px] uppercase tracking-tight text-slate-400">Owner: Uncle Tee Automobiles</p>
              
              <button
                onClick={(e) => {
                  if (isEnlarged) e.stopPropagation();
                  handleRequestCallback();
                }}
                disabled={callbackRequested}
                className={cn(
                  "mt-1 w-full text-[9px] font-black uppercase tracking-widest py-2 rounded-lg transition-all",
                  callbackRequested 
                    ? "bg-emerald-950/20 text-emerald-400 border border-emerald-900/30 cursor-not-allowed" 
                    : "bg-emerald-600 text-white hover:bg-emerald-700"
                )}
              >
                {callbackRequested ? (callbackStatusText || 'Callback Requested!') : 'No Response? Request Uncle Tee Call Back'}
              </button>
            </motion.div>
          )}
        </div>
      );
    }

    return (
      <div className="grid grid-cols-2 gap-2 w-full">
        <button 
          onClick={(e) => {
            if (isEnlarged) e.stopPropagation();
            onAction?.({
              ...(isJersey ? { name: customName, number: customNumber } : undefined),
              ...(!isAuto ? { selectedUtnTag: getUtnTag(listing, currentIndex) } : undefined)
            });
          }}
          className={cn(
            "flex-1 px-4 py-3 text-[10px] font-black uppercase tracking-widest transition-all rounded-xl border active:scale-95",
            isEnlarged 
              ? "border-slate-700 text-slate-300 hover:bg-slate-800" 
              : "border-slate-200 text-slate-600 hover:bg-slate-50"
          )}
        >
          {categoryType === CategoryType.SEWING_SERVICES ? "Details" : "Add to Cart"}
        </button>
        <button 
          onClick={(e) => {
            if (isEnlarged) e.stopPropagation();
            onOrder?.({
              ...(isJersey ? { name: customName, number: customNumber } : undefined),
              ...(!isAuto ? { selectedUtnTag: getUtnTag(listing, currentIndex) } : undefined)
            });
          }}
          className={cn(
            "flex-1 px-4 py-3 text-[10px] font-black uppercase tracking-widest transition-all rounded-xl shadow-lg active:scale-95 flex items-center justify-center gap-2 text-white shadow-indigo-900/20",
            isEnlarged 
              ? "bg-indigo-600 hover:bg-indigo-700" 
              : "bg-slate-900 hover:bg-indigo-600"
          )}
        >
          <ShoppingBag className="w-3.5 h-3.5" />
          Place Order Now
        </button>
      </div>
    );
  };

  const [currentIndex, setCurrentIndex] = useState(0);
  const displaySku = getUtnTag(listing, currentIndex);
  const [isActivelyViewable, setIsActivelyViewable] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);

  const [currentUser, setCurrentUser] = useState<User | null>(auth.currentUser);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (usr) => {
      setCurrentUser(usr);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined' || !('IntersectionObserver' in window)) {
      setIsActivelyViewable(true);
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsActivelyViewable(true);
          observer.disconnect();
        }
      },
      {
        rootMargin: '120px', // Pre-fetch high quality before it comes into screen
        threshold: 0.01
      }
    );

    if (cardRef.current) {
      observer.observe(cardRef.current);
    }

    return () => observer.disconnect();
  }, []);
  const [customName, setCustomName] = useState('');
  const [customNumber, setCustomNumber] = useState('');

  const [showBidModal, setShowBidModal] = useState(false);
  const [activeBid, setActiveBid] = useState('');
  const [isBidSending, setIsBidSending] = useState(false);
  const [bidStatusText, setBidStatusText] = useState('');
  const [revealCallDetails, setRevealCallDetails] = useState(false);
  const [callbackRequested, setCallbackRequested] = useState(false);
  const [callbackStatusText, setCallbackStatusText] = useState('');

  const handleSendOffer = async () => {
    if (!auth.currentUser) {
      setBidStatusText('Please sign in to place a bid!');
      return;
    }
    const currentBidVal = parseFloat(activeBid);
    if (!currentBidVal || currentBidVal <= 0) {
      setBidStatusText('Please enter a valid bid amount!');
      return;
    }

    setIsBidSending(true);
    setBidStatusText('');
    
    try {
      const orderId = `bid-${Math.random().toString(36).substring(2, 11)}`;
      const user = auth.currentUser;
      const parsedPrice = parseFloat(activeBid) || 0;
      
      const newRequest = {
        orderId,
        listingId: listing.id || 'studio-custom',
        userId: user.uid,
        title: listing.title || 'Vehicle Direct Offer',
        price: parsedPrice,
        siloType: 'garage',
        status: 'bid_placed',
        customization: {
          bidAmount: parsedPrice,
          offerNaira: parsedPrice,
          notes: `User made a pricing offer of ₦${parsedPrice?.toLocaleString()} for this vehicle.`
        },
        deliveryDetails: {
          fullName: user.displayName || user.email?.substring(0, user.email?.indexOf('@')) || (user.isAnonymous ? 'Demo Account' : 'Authorized Client'),
          email: user.email || 'demo@garage.ng',
          phone: user.phoneNumber || '08138642942'
        },
        orderDate: new Date().toISOString(),
        createdAt: serverTimestamp()
      };

      await addDoc(collection(db, 'requests'), newRequest);
      setBidStatusText('Bid successfully transmitted to Uncle Tee!');
      setTimeout(() => {
        setShowBidModal(false);
        setActiveBid('');
        setBidStatusText('');
      }, 2500);
    } catch (err) {
      console.error(err);
      setBidStatusText('Error transmitting bid. Please try again!');
    } finally {
      setIsBidSending(false);
    }
  };

  const handleRequestCallback = async () => {
    if (!auth.currentUser) {
      setCallbackStatusText('Sign in to submit callback request!');
      setCallbackRequested(true);
      setTimeout(() => setCallbackRequested(false), 3000);
      return;
    }
    
    setCallbackRequested(true);
    setCallbackStatusText('Requesting Call...');
    
    try {
      const orderId = `callback-${Math.random().toString(36).substring(2, 11)}`;
      const user = auth.currentUser;
      
      const newRequest = {
        orderId,
        listingId: listing.id || 'studio-custom',
        userId: user.uid,
        title: listing.title || 'Callback Requested',
        price: listing.price || 0,
        siloType: 'garage',
        status: 'callback_request',
        customization: {
          notes: `User requested Uncle Tee to call them back immediately on listing: ${listing.title}.`
        },
        deliveryDetails: {
          fullName: user.displayName || user.email?.substring(0, user.email?.indexOf('@')) || (user.isAnonymous ? 'Demo Account' : 'Authorized Client'),
          email: user.email || 'demo@garage.ng',
          phone: user.phoneNumber || '08138642942'
        },
        orderDate: new Date().toISOString(),
        createdAt: serverTimestamp()
      };

      await addDoc(collection(db, 'requests'), newRequest);
      setCallbackStatusText('Request Placed! Uncle Tee gets notified.');
    } catch (err) {
      console.error(err);
      setCallbackStatusText('Callback error. Pin details direct!');
    }
  };

  const defaultImage = isJersey
    ? "https://images.unsplash.com/photo-1580087433295-ab2600c1030e?auto=format&fit=crop&q=80&w=800"
    : isActuallyFabrics
    ? "https://images.unsplash.com/photo-1620799140408-edc6dcb6d633?auto=format&fit=crop&q=80&w=800"
    : isAuto
    ? "https://images.unsplash.com/photo-1503376780353-7e6692767b70?auto=format&fit=crop&q=80&w=800"
    : "https://images.unsplash.com/photo-1539109132332-945739ef1f31?auto=format&fit=crop&q=80&w=800";

  const [currentMedia, setCurrentMedia] = useState<MediaAsset>(images[0] || { url: defaultImage, type: 'image' });

  useEffect(() => {
    if (images.length > 0) {
      setCurrentMedia(images[currentIndex]);
    } else {
      setCurrentMedia({ url: defaultImage, type: 'image' });
    }
  }, [currentIndex, images, defaultImage]);

  const nextImage = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrentIndex((prev) => (prev + 1) % images.length);
  };

  const prevImage = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrentIndex((prev) => (prev - 1 + images.length) % images.length);
  };

  const renderSpecifications = () => {
    switch (categoryType) {
      case CategoryType.AUTOMOBILE:
        return (
          <>
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Odometer</p>
              <p className="text-xs font-mono font-bold text-slate-800">{listing.autoDetails?.mileage ? `${listing.autoDetails.mileage.toLocaleString()} km` : "N/A"}</p>
            </div>
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Condition</p>
              <p className="text-xs font-mono font-bold text-slate-800 uppercase leading-snug truncate" title={listing.autoDetails?.condition}>{listing.autoDetails?.condition || "Tokunbo"}</p>
            </div>
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Transmission</p>
              <p className="text-xs font-mono font-bold text-indigo-600 uppercase">{listing.autoDetails?.transmission || "Automatic"}</p>
            </div>
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Registration</p>
              <p className="text-xs font-mono font-bold text-indigo-600 uppercase leading-snug">{listing.autoDetails?.isRegistered || "Registered"}</p>
            </div>
            {carVin && (
              <div className="col-span-2 bg-slate-50 p-2.5 rounded-xl border border-slate-100 flex items-center justify-between gap-2">
                <div className="overflow-hidden">
                  <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Chassis/VIN Number</p>
                  <p className="text-xs font-mono font-extrabold text-slate-700 uppercase tracking-wider truncate" title={carVin}>{carVin}</p>
                </div>
                <button
                  type="button"
                  onClick={(e) => handleCopyVin(carVin, e)}
                  className="px-2.5 py-1.5 bg-indigo-600 hover:bg-slate-900 text-white rounded-lg text-[9px] font-black uppercase flex items-center gap-1 shrink-0 transition-all active:scale-95 shadow-sm"
                  title="Copy VIN for VIN Check Machine"
                >
                  {copiedVin ? <Check className="w-3 h-3 text-emerald-300" /> : <Copy className="w-3 h-3 text-indigo-200" />}
                  <span>{copiedVin ? 'Copied!' : 'Copy VIN'}</span>
                </button>
              </div>
            )}
          </>
        );
      case CategoryType.JERSEY:
        return (
          <>
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Sport</p>
              <p className="text-sm font-mono font-bold text-slate-800 uppercase flex items-center gap-1.5">
                {listing.jerseyDetails?.sport || "Football"}
              </p>
            </div>
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Team</p>
              <p className="text-sm font-mono font-bold text-slate-800 uppercase">{listing.jerseyDetails?.team || "Classic"}</p>
            </div>
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Season</p>
              <p className="text-sm font-mono font-bold text-slate-800 uppercase">{listing.jerseyDetails?.season || "24/25"}</p>
            </div>
          </>
        );
      case CategoryType.FABRICS:
        return (
          <>
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Category</p>
              <p className="text-sm font-mono font-bold text-slate-800 uppercase">{listing.fabricDetails?.type || "Fabric"}</p>
            </div>
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Length</p>
              <p className="text-sm font-mono font-bold text-slate-800 uppercase">{listing.fabricDetails?.yards || "5 Yards"}</p>
            </div>
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Status</p>
              <p className="text-sm font-mono font-bold text-indigo-600 uppercase">In Stock</p>
            </div>
          </>
        );
      case CategoryType.APPAREL:
        return (
          <>
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Size</p>
              <p className="text-sm font-mono font-bold text-slate-800 uppercase">{listing.apparelDetails?.size || "N/A"}</p>
            </div>
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Brand</p>
              <p className="text-sm font-mono font-bold text-slate-800 uppercase">{listing.apparelDetails?.brand || "N/A"}</p>
            </div>
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Condition</p>
              <p className="text-sm font-mono font-bold text-indigo-600 uppercase">{listing.apparelDetails?.condition || "Mint"}</p>
            </div>
          </>
        );
      case CategoryType.ACCESSORIES:
        return (
          <>
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Type</p>
              <p className="text-sm font-mono font-bold text-slate-800 uppercase">{listing.accessoryDetails?.type || "Accessory"}</p>
            </div>
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Brand</p>
              <p className="text-sm font-mono font-bold text-slate-800 uppercase">{listing.accessoryDetails?.brand || "Premium"}</p>
            </div>
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Status</p>
              <p className="text-sm font-mono font-bold text-indigo-600 uppercase">AVAIL</p>
            </div>
          </>
        );
      case CategoryType.FOOTWEAR:
        return (
          <>
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Size</p>
              <p className="text-sm font-mono font-bold text-slate-800 uppercase">{listing.footwearDetails?.size || "N/A"}</p>
            </div>
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Type</p>
              <p className="text-sm font-mono font-bold text-slate-800 uppercase">{listing.footwearDetails?.type || "Shoes"}</p>
            </div>
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Status</p>
              <p className="text-sm font-mono font-bold text-indigo-600 uppercase">In Stock</p>
            </div>
          </>
        );
      case CategoryType.SEWING_SERVICES:
        return (
          <>
            <div className="col-span-2">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Service For</p>
              <p className="text-sm font-mono font-bold text-slate-800 uppercase">{listing.sewingDetails?.serviceType === 'MEN' ? "Gents / Men's Custom" : "Ladies / Women's Custom"}</p>
            </div>
            <div className="col-span-1">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Styles</p>
              <p className="text-sm font-mono font-bold text-indigo-600 uppercase">View All</p>
            </div>
          </>
        );
      default:
        return null;
    }
  };

  return (
    <motion.div
      ref={cardRef}
      whileHover={{ y: -4 }}
      className="group"
    >
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm group relative">
        <div className="relative aspect-video bg-slate-100 overflow-hidden">
          <Dialog>
            <DialogTrigger className="w-full h-full cursor-zoom-in">
              <div className="w-full h-full relative">
                <AnimatePresence mode="wait">
                  {isJersey && currentMedia.url === defaultImage ? (
                    <div key="mockup" className="w-full h-full flex items-center justify-center p-6 bg-slate-50">
                      <JerseyVisual 
                        sport={listing.jerseyDetails?.sport || 'football'}
                        kit={{ 
                          primaryColor: listing.jerseyDetails?.baseColor || '#4f46e5',
                          secondaryColor: '#ffffff',
                          accentColor: '#ffffff',
                          id: 'preview',
                          name: 'Preview',
                          baseImage: ''
                         }}
                        name={customName || "NAME"}
                        number={customNumber || "00"}
                        className="aspect-square h-full w-auto max-h-[160px] mx-auto"
                      />
                    </div>
                  ) : currentMedia.type === 'video' ? (
                    <div key="video" className="w-full h-full">
                      <VideoPlayer src={currentMedia.url} poster={currentMedia.thumbnailUrl} />
                    </div>
                  ) : (
                    <motion.img 
                      key={`${listing.id}-${currentIndex}`}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      src={isActivelyViewable ? currentMedia.url : (currentMedia.thumbnailUrl || currentMedia.url)} 
                      alt={listing.title}
                      loading="lazy"
                      className="object-cover w-full h-full group-hover:scale-105 transition-transform duration-500"
                      referrerPolicy="no-referrer"
                      onError={() => {
                        setCurrentMedia({ url: defaultImage, type: 'image' });
                      }}
                    />
                  )}
                </AnimatePresence>
                
                {/* Overlay Maximize Icon on Hover */}
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100 pointer-events-none">
                  <Maximize2 className="text-white w-8 h-8 drop-shadow-lg" />
                </div>
              </div>
            </DialogTrigger>
            <DialogContent className="max-w-4xl bg-slate-950 border border-slate-800 p-0 overflow-hidden rounded-[2rem] shadow-2xl flex flex-col max-h-[90vh]">
              <div className="relative flex-grow w-full flex items-center justify-center p-4 bg-black/40 min-h-0">
                {isJersey && currentMedia.url === defaultImage ? (
                  <div className="w-full h-full flex items-center justify-center p-6 bg-black/20">
                    <JerseyVisual 
                      sport={listing.jerseyDetails?.sport || 'football'}
                      kit={{ 
                        primaryColor: listing.jerseyDetails?.baseColor || '#4f46e5',
                        secondaryColor: '#ffffff',
                        accentColor: '#ffffff',
                        id: 'preview',
                        name: 'Preview',
                        baseImage: ''
                       }}
                      name={customName || "NAME"}
                      number={customNumber || "00"}
                      className="aspect-square h-full w-auto max-h-[280px] md:max-h-[400px] mx-auto"
                    />
                  </div>
                ) : currentMedia.type === 'video' ? (
                  <video src={currentMedia.url} controls autoPlay className="w-full h-full max-h-[48vh] rounded-lg" />
                ) : (
                  <img 
                    src={currentMedia.url} 
                    alt={listing.title}
                    className="w-full h-full object-contain max-h-[48vh] rounded-lg"
                    referrerPolicy="no-referrer"
                  />
                )}
                
                {hasMultipleImages && (
                  <div className="absolute inset-x-4 flex items-center justify-between pointer-events-none z-10">
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        prevImage(e);
                      }}
                      className="p-3 rounded-full bg-white/10 backdrop-blur-md hover:bg-white text-white hover:text-slate-900 transition-all pointer-events-auto shadow-lg"
                    >
                      <MoreHorizontal className="w-6 h-6 rotate-180" />
                    </button>
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        nextImage(e);
                      }}
                      className="p-3 rounded-full bg-white/10 backdrop-blur-md hover:bg-white text-white hover:text-slate-900 transition-all pointer-events-auto shadow-lg"
                    >
                      <MoreHorizontal className="w-6 h-6" />
                    </button>
                  </div>
                )}
                
                <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2 z-10">
                   {images.map((_, i) => (
                    <div 
                      key={`dialog-dot-${listing.id}-${i}`} 
                      className={cn(
                        "w-2 h-2 rounded-full transition-all",
                        i === currentIndex ? "bg-white w-6" : "bg-white/40"
                      )}
                    />
                  ))}
                </div>

                {/* Top overlay bars with title on left and dynamic picture identifier on right */}
                <div className="absolute top-4 left-4 right-4 flex items-start justify-between pointer-events-none z-10">
                  <div className="text-white bg-black/60 px-4 py-2 rounded-xl backdrop-blur-sm border border-slate-800/50 pointer-events-auto">
                    <h2 className="text-sm font-black tracking-tight">{listing.title}</h2>
                    <p className="text-xs font-mono font-black text-indigo-400">₦{listing.price?.toLocaleString()}</p>
                  </div>
                  {!isAuto && (
                    <div className="bg-gradient-to-r from-indigo-600 to-indigo-700 text-white text-[10px] font-mono px-3 py-1.5 rounded-xl font-bold pointer-events-auto shadow-lg tracking-widest border border-indigo-500/30 uppercase flex items-center gap-1.5 animate-pulse">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 inline-block" />
                      {getUtnTag(listing, currentIndex)}
                    </div>
                  )}
                </div>
              </div>

              {/* Bottom glass panel with UTN Tag and reused action buttons */}
              <div className="w-full px-6 py-4 bg-slate-900/90 border-t border-slate-800 backdrop-blur-md flex flex-col sm:flex-row items-center justify-between gap-4 z-20">
                {!isAuto ? (
                  <div className="flex items-center gap-3">
                    <div className="flex flex-col gap-1">
                      <span className="text-[9px] font-black uppercase text-indigo-400 tracking-widest block font-sans">
                        Item Unique identifier
                      </span>
                      <div className="text-lg font-mono font-black text-white tracking-widest bg-slate-950/80 px-3 py-1.5 rounded-xl border border-slate-800 flex items-center gap-2">
                        <span>{getUtnTag(listing, currentIndex)}</span>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center gap-3">
                    <div className="flex flex-col gap-1">
                      <span className="text-[9px] font-black uppercase text-slate-400 tracking-widest block font-sans">
                        Uncle Tee Garage Spec
                      </span>
                      <div className="text-sm font-sans font-bold text-slate-300">
                        {listing.autoDetails?.year || ''} {listing.autoDetails?.make || ''} {listing.autoDetails?.model || ''}
                      </div>
                    </div>
                  </div>
                )}
                
                {/* Actions Block with Reused Buttons */}
                <div className="w-full sm:w-auto flex-1 max-w-sm">
                  {renderActionButtons(true)}
                </div>
              </div>
            </DialogContent>
          </Dialog>
          <div className="absolute inset-0 bg-gradient-to-t from-slate-900/60 to-transparent opacity-60 pointer-events-none"></div>
          
          {/* Slideshow Controls */}
          {hasMultipleImages && (
            <div className="absolute inset-0 flex items-center justify-between px-4 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
              <button 
                onClick={prevImage}
                className="p-2 rounded-full bg-white/20 backdrop-blur-md hover:bg-white text-white hover:text-slate-900 transition-all shadow-lg pointer-events-auto"
              >
                <MoreHorizontal className="w-4 h-4 rotate-180" />
              </button>
              <button 
                onClick={nextImage}
                className="p-2 rounded-full bg-white/20 backdrop-blur-md hover:bg-white text-white hover:text-slate-900 transition-all shadow-lg pointer-events-auto"
              >
                <MoreHorizontal className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* Dots Indicator */}
          {hasMultipleImages && (
            <div className="absolute bottom-4 right-4 flex gap-1 z-10 pointer-events-none">
              {images.map((_, i) => (
                <div 
                  key={`inline-dot-${listing.id}-${i}`} 
                  className={cn(
                    "w-1.5 h-1.5 rounded-full transition-all",
                    i === currentIndex ? "bg-white w-4" : "bg-white/40"
                  )}
                />
              ))}
            </div>
          )}
          
          <div className="absolute top-4 left-4 flex flex-col gap-1.5 pointer-events-none">
            {listing.status === 'sold' && (
              <span className="text-[9px] font-extrabold px-2.5 py-1 rounded bg-rose-600 text-white shadow-lg w-fit pointer-events-auto animate-pulse tracking-widest uppercase">
                SOLD OUT
              </span>
            )}
            <span className={cn(
              "text-[10px] font-black px-2 py-1 rounded uppercase tracking-tighter shadow-lg w-fit pointer-events-auto",
              isAuto ? "bg-emerald-500 text-white" : isJersey ? "bg-amber-500 text-white" : "bg-indigo-500 text-white"
            )}>
              {categoryType.replace('_', ' ')}
            </span>
          </div>
          
          <div className="absolute top-4 right-4 flex gap-2 pointer-events-none">
            {isAuto && carVin ? (
              <button
                type="button"
                onClick={(e) => handleCopyVin(carVin, e)}
                className="bg-white/90 hover:bg-white backdrop-blur text-[10px] font-mono px-2.5 py-1 rounded-lg font-bold text-slate-800 pointer-events-auto flex items-center gap-1.5 transition-all shadow-md active:scale-95 hover:text-indigo-600"
                title="Click to copy full VIN"
              >
                <span>{carVin.substring(0, 8)}...</span>
                {copiedVin ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3 text-indigo-600" />}
              </button>
            ) : (
              <div className="bg-white/90 backdrop-blur text-[10px] font-mono px-2 py-1 rounded font-bold text-slate-800 pointer-events-auto">
                {isJersey ? (listing.jerseyDetails?.type || "HOME KIT") : (listing.subCategory || "PREMIUM")}
              </div>
            )}
            {(() => {
              const isAdmin = currentUser?.email?.toLowerCase() === 'itztahirismail@gmail.com';
              const isOwner = (listing as any).sellerId === currentUser?.uid;
              const hasNoOwner = !(listing as any).sellerId;
              const canEdit = currentUser && (isOwner || isAdmin || hasNoOwner);
              
              if (!canEdit) return null;

              const toggleSoldStatus = async (e: any) => {
                e.stopPropagation();
                try {
                  const newStatus = listing.status === 'sold' ? 'published' : 'sold';
                  await updateDoc(doc(db, 'listings', listing.id!), { status: newStatus });
                } catch (err) {
                  console.error("Failed to toggle sold status:", err);
                }
              };
              
              return (
                <div className="flex gap-1.5 pointer-events-auto">
                  {isAdmin && (
                    <button 
                      onClick={toggleSoldStatus}
                      className={cn(
                        "bg-white/90 backdrop-blur px-2 py-1 rounded text-[9px] font-black uppercase transition-all shadow-sm tracking-tight",
                        listing.status === 'sold' ? "text-emerald-600 hover:bg-emerald-500 hover:text-white text-white bg-emerald-500/10" : "text-rose-600 hover:bg-rose-500 hover:text-white text-white bg-rose-500/10"
                      )}
                      title={listing.status === 'sold' ? "Mark as In-Stock" : "Mark as Sold-Out"}
                    >
                      {listing.status === 'sold' ? "Mark Instock" : "Mark Sold"}
                    </button>
                  )}
                  {onEdit && (
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        onEdit();
                      }}
                      className="bg-white/90 backdrop-blur p-1.5 rounded text-indigo-600 hover:bg-indigo-600 hover:text-white transition-all shadow-sm"
                      title="Edit specifications"
                    >
                      <Edit className="w-3.5 h-3.5" />
                    </button>
                  )}
                  {onDelete && (
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        onDelete();
                      }}
                      className="bg-white/90 backdrop-blur p-1.5 rounded text-red-500 hover:bg-red-500 hover:text-white transition-all shadow-sm"
                      title="Delete asset"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              );
            })()}
          </div>

          <div className="absolute bottom-4 left-4 pr-10 pointer-events-none">
            <h4 className="text-white font-bold text-lg leading-tight line-clamp-1">{listing.title}</h4>
          </div>
        </div>

        <div className="p-6">
          <div className={cn(
            "grid gap-4 mb-6 min-h-[4rem]",
            isAuto ? "grid-cols-2 text-left" : "grid-cols-3 text-left"
          )}>
            {renderSpecifications()}
          </div>

          {isJersey && (
            <div className="space-y-4 mb-6 p-4 bg-slate-50 rounded-xl border border-slate-100">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">JERSEY CUSTOMIZATION</label>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <span className="text-[9px] font-bold text-slate-500 uppercase">Back Name</span>
                  <input 
                    type="text" 
                    placeholder="E.g. RONALDO" 
                    value={customName}
                    onChange={(e) => setCustomName(e.target.value.toUpperCase())}
                    className="w-full bg-white border border-slate-200 rounded-md px-3 py-2 text-xs font-bold focus:ring-1 focus:ring-amber-500 outline-none uppercase"
                  />
                </div>
                <div className="space-y-1">
                  <span className="text-[9px] font-bold text-slate-500 uppercase">Back Number</span>
                  <input 
                    type="text" 
                    placeholder="E.g. 7" 
                    value={customNumber}
                    onChange={(e) => setCustomNumber(e.target.value)}
                    className="w-full bg-white border border-slate-200 rounded-md px-3 py-2 text-xs font-bold focus:ring-1 focus:ring-amber-500 outline-none"
                  />
                </div>
              </div>
            </div>
          )}

          {listing.tags && listing.tags.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mb-6">
              {Array.from(new Set(listing.tags)).map((tag, i) => (
                <span key={`${tag}-${i}`} className="text-[8px] font-black uppercase tracking-widest bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded">
                  #{tag.replace(' ', '')}
                </span>
              ))}
            </div>
          )}

          <div className="flex flex-col gap-3 pt-6 border-t border-slate-100 mt-2">
            <div className="flex items-center justify-between">
              <span className="text-2xl font-black italic text-slate-900 tracking-tighter">
                ₦{listing.price?.toLocaleString()}
              </span>
              <div className="flex gap-2">
                <Badge variant="outline" className="bg-slate-50 text-slate-500 font-bold border-slate-200">
                  {isAuto ? (listing.autoDetails?.negotiable ? 'NEGOTIABLE' : 'FIXED PRICE') : 'AUTHENTIC'}
                </Badge>
              </div>
            </div>
            
            {renderActionButtons()}
          </div>
        </div>
      </div>

      {/* Bid / Make an Offer Modal Overlay */}
      <AnimatePresence>
        {showBidModal && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[999] p-4">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-100 relative z-10 text-left"
            >
              <button 
                onClick={() => setShowBidModal(false)}
                className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 text-sm font-bold p-1 rounded-full hover:bg-slate-100 transition-colors"
              >
                ✕
              </button>
              <div className="flex flex-col gap-2">
                <h3 className="text-lg font-bold text-slate-900 tracking-tight">Make a Purchase Offer</h3>
                <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Listing: {listing.title}</p>
                <div className="h-px bg-slate-100 my-2" />
                
                <div className="space-y-4">
                  <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 flex justify-between items-center">
                    <span className="text-[10px] font-bold text-slate-500 uppercase">Valuation Price</span>
                    <span className="font-mono font-black text-slate-800 text-sm">₦{listing.price?.toLocaleString()}</span>
                  </div>
                  
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Your Bid in Naira (₦)</label>
                    <div className="relative">
                      <span className="absolute left-3.5 top-1/2 -translate-y-1/2 font-mono text-slate-400 font-bold">₦</span>
                      <input 
                        type="number"
                        placeholder="Enter bid amount"
                        value={activeBid}
                        onChange={(e) => setActiveBid(e.target.value)}
                        className="w-full pl-8 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl font-mono text-base font-bold focus:ring-2 focus:ring-indigo-500 outline-none text-slate-900"
                        required
                      />
                    </div>
                  </div>
                  
                  {bidStatusText && (
                    <p className={cn(
                      "p-3 rounded-xl text-center text-xs font-bold uppercase tracking-wider border",
                      bidStatusText.includes('successfully') ? "bg-emerald-50 border-emerald-200 text-emerald-700" : "bg-indigo-55 border-indigo-200 text-indigo-700"
                    )}>
                      {bidStatusText}
                    </p>
                  )}
                  
                  <button 
                    onClick={handleSendOffer}
                    disabled={isBidSending || !activeBid}
                    className="w-full bg-indigo-600 hover:bg-indigo-75 transition-all font-sans text-xs font-black uppercase text-white tracking-widest py-3.5 rounded-xl disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isBidSending ? 'Transmitting bid...' : 'Send Offer to Owner'}
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

