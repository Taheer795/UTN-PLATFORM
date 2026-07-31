import React, { useState, useEffect, useMemo, useRef } from 'react';
import { db, auth, handleFirestoreError, OperationType } from '@/src/lib/firebase';
import { 
  collection, 
  doc, 
  setDoc, 
  deleteDoc, 
  onSnapshot, 
  query, 
  orderBy, 
  addDoc, 
  updateDoc,
  serverTimestamp,
  limit
} from 'firebase/firestore';
import { 
  Gavel, 
  Clock, 
  User as UserIcon, 
  Phone, 
  ShieldAlert, 
  CheckCircle2, 
  Zap, 
  AlertTriangle, 
  Plus, 
  Trash2, 
  Edit,
  ShieldCheck, 
  HelpCircle, 
  Info, 
  Coins, 
  Lock, 
  ChevronDown, 
  ChevronUp, 
  RefreshCw,
  Award,
  MessageCircle,
  Upload,
  Image as ImageIcon,
  Volume2,
  VolumeX,
  FileText,
  Eye,
  Wallet,
  MapPin,
  Map,
  ArrowLeft,
  Car,
  Shirt,
  Star,
  Bell,
  Send,
  Heart,
  Sparkles,
  CheckCircle,
  ChevronRight
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Button } from '@/components/ui/button';
import { AuctionImageCarousel } from './AuctionImageCarousel';
import { liveBiddingAudioEngine } from '@/src/lib/audioManager';

// Client-side ImgBB multi-uploader helper
const uploadToImgBB = (file: Blob | File, fileName: string, onProgress?: (progress: number) => void): Promise<string> => {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    const apiKey = (import.meta as any).env?.VITE_IMGBB_API_KEY || '3cc5fe0296f848097db1814ed635d131';
    
    xhr.open('POST', `https://api.imgbb.com/1/upload?key=${apiKey}`);

    if (onProgress && xhr.upload) {
      xhr.upload.addEventListener('progress', (e) => {
        if (e.lengthComputable) {
          const progress = (e.loaded / e.total) * 100;
          onProgress(progress);
        }
      });
    }

    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        try {
          const res = JSON.parse(xhr.responseText);
          if (res.success && res.data && res.data.url) {
            resolve(res.data.url);
          } else {
            reject(new Error(res.error?.message || 'ImgBB upload failed'));
          }
        } catch (err) {
          reject(new Error('Failed to parse ImgBB response'));
        }
      } else {
        reject(new Error(`ImgBB upload failed with status ${xhr.status}`));
      }
    };

    xhr.onerror = () => reject(new Error('ImgBB upload network error'));

    const formData = new FormData();
    const nameToUse = (file as File).name || fileName || 'image.jpg';
    formData.append('image', file, nameToUse);

    xhr.send(formData);
  });
};
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';

const ADMIN_EMAIL = 'Itztahirismail@gmail.com'.toLowerCase();

const VEHICLE_TEMPLATES = [
  {
    title: "Lamborghini Huracán STO",
    make: "LAMBORGHINI",
    model: "Huracán STO",
    year: 2022,
    vin: "ZHWHU1S20N818293B",
    mileage: 450,
    price: 320000000, // 320m NGN
    imageUrl: "https://images.unsplash.com/photo-1621135802920-133df287f89c?auto=format&fit=crop&w=800&q=80",
    description: "The ultimate track-ready street supercar. V10 naturally aspirated monster with STO aerodynamic package and custom factory paint."
  },
  {
    title: "Mercedes-AMG G 63",
    make: "MERCEDES-BENZ",
    model: "AMG G 63 G-Wagon",
    year: 2023,
    vin: "W1ZBU7FJ8PA912837",
    mileage: 1200,
    price: 240000000, // 240m NGN
    imageUrl: "https://images.unsplash.com/photo-1520050206274-a1ae446cb3cc?auto=format&fit=crop&w=800&q=80",
    description: "Iconic luxury SUV with 4.5l twin-turbo V8, hand-crafted interior in classic satin obsidian black designo package."
  },
  {
    title: "Porsche 911 GT3 RS",
    make: "PORSCHE",
    model: "911 GT3 RS (992)",
    year: 2024,
    vin: "WP0AF2Y9XNS127495",
    mileage: 180,
    price: 380000000, // 380m NGN
    imageUrl: "https://images.unsplash.com/photo-1614162614757-fe7ef7537e3d?auto=format&fit=crop&w=800&q=80",
    description: "Weissach performance pack equipped GT3 RS. Active aero wing system, carbon ceramic brakes, finished in Lizard Green."
  },
  {
    title: "Land Rover Defender 110 V8",
    make: "LAND ROVER",
    model: "Defender 110 V8 CARPATHIAN",
    year: 2024,
    vin: "SALEN2EV7PA102948",
    mileage: 70,
    price: 185000000,
    imageUrl: "https://images.unsplash.com/photo-1605559424843-9e4c228bf1c2?auto=format&fit=crop&w=800&q=80",
    description: "Supercharged V8 power with Carpathian Edition satin dark gray finish, premium ebony Windsor seats and active differential control."
  }
];

interface DistressBiddingProps {
  onBack?: () => void;
  isAdmin?: boolean;
  userRole?: string | null;
  onNavigateView?: (view: any, silo?: any) => void;
}

export default function DistressBidding({ 
  onBack,
  isAdmin: propIsAdmin,
  userRole: propUserRole,
  onNavigateView
}: DistressBiddingProps = {}) {
  const [auctions, setAuctions] = useState<any[]>([]);
  const [userRestriction, setUserRestriction] = useState<{ restricted: boolean; walletBalance: number; hasPaidRegistrationFee: boolean } | null>(null);
  const [bidsByAuction, setBidsByAuction] = useState<{ [auctionId: string]: any[] }>({});
  
  // User's customized current state/bidding location (Copart style)
  const [biddingLocationState, setBiddingLocationState] = useState<string>(() => {
    return localStorage.getItem('user_bidding_location_state') || 'Lagos';
  });

  useEffect(() => {
    localStorage.setItem('user_bidding_location_state', biddingLocationState);
  }, [biddingLocationState]);

  useEffect(() => {
    // Check if location can be dynamically fetched
    if (!localStorage.getItem('user_bidding_location_state')) {
      const detectLocation = async () => {
        try {
          const res = await fetch('https://ipapi.co/json/');
          if (res.ok) {
            const data = await res.json();
            if (data.region) {
              setBiddingLocationState(data.region);
            } else if (data.city) {
              setBiddingLocationState(data.city);
            }
          }
        } catch (e) {
          console.warn("Could not auto-detect location status:", e);
        }
      };
      detectLocation();
    }
  }, []);
  
  // Admin Relisting Date selectors
  const [relistDates, setRelistDates] = useState<Record<string, string>>({});
  const [relistingIds, setRelistingIds] = useState<Record<string, boolean>>({});
  
  // Custom Funding Dialog States
  const [isFundModalOpen, setIsFundModalOpen] = useState(false);
  const [isPayingRegistrationDirectly, setIsPayingRegistrationDirectly] = useState(false);
  const [customFundAmount, setCustomFundAmount] = useState('50000');
  const [fundingStep, setFundingStep] = useState<1 | 2>(1); // 1: Card info, 2: Success
  const [fundCardNum, setFundCardNum] = useState('');
  const [fundCardExp, setFundCardExp] = useState('');
  const [fundCardCvv, setFundCardCvv] = useState('');
  const [fundingProgress, setFundingProgress] = useState(false);
  
  // Create Auction Form States
  const [isAdminPanelOpen, setIsAdminPanelOpen] = useState(false);
  const [editingAuctionId, setEditingAuctionId] = useState<string | null>(null);
  const [selectedTemplate, setSelectedTemplate] = useState<number | null>(null);
  const [title, setTitle] = useState('');
  const [make, setMake] = useState('');
  const [model, setModel] = useState('');
  const [year, setYear] = useState(2023);
  const [vin, setVin] = useState('');
  const [mileage, setMileage] = useState(1000);
  const [price, setPrice] = useState(5000000); // Starting price
  const [imageUrl, setImageUrl] = useState('');
  const [description, setDescription] = useState('');
  const [durationMinutes, setDurationMinutes] = useState(15);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Photo Upload States
  const [localPhotoFiles, setLocalPhotoFiles] = useState<{
    id: string;
    file: File;
    preview: string;
    status: 'pending' | 'uploading' | 'completed' | 'error';
    progress: number;
    url?: string;
  }[]>([]);
  const [uploadedUrls, setUploadedUrls] = useState<string[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  
  // Unfreeze Payment Portal State
  const [isPaymentPortalOpen, setIsPaymentPortalOpen] = useState(false);
  const [paymentPortalStep, setPaymentPortalStep] = useState<1 | 2 | 3>(1); // 1: Info, 2: Process, 3: Success
  const [portalGateway, setPortalGateway] = useState<'paystack' | 'flutterwave'>('paystack');
  const [cardNumber, setCardNumber] = useState('');
  const [cardExpiry, setCardExpiry] = useState('');
  const [cardCvv, setCardCvv] = useState('');
  const [paymentLoading, setPaymentLoading] = useState(false);

  // Buy Now Checkout States
  const [checkoutAuction, setCheckoutAuction] = useState<any | null>(null);
  const [checkoutStep, setCheckoutStep] = useState<1 | 2 | 3 | 4>(1); // 1: Delivery info, 2: Payment method, 3: Process, 4: Success
  const [checkoutMethod, setCheckoutMethod] = useState<'card' | 'transfer'>('card');
  const [checkoutCardNumber, setCheckoutCardNumber] = useState('');
  const [checkoutCardExpiry, setCheckoutCardExpiry] = useState('');
  const [checkoutCardCvv, setCheckoutCardCvv] = useState('');
  const [checkoutFullName, setCheckoutFullName] = useState('');
  const [checkoutEmail, setCheckoutEmail] = useState('');
  const [checkoutPhone, setCheckoutPhone] = useState('');
  const [checkoutAddress, setCheckoutAddress] = useState('');
  const [checkoutLoading, setCheckoutLoading] = useState(false);

  // Custom Distress Auction Specs States
  const [biddingDate, setBiddingDate] = useState(new Date().toISOString().substring(0, 10)); // YYYY-MM-DD
  const [runAndDrive, setRunAndDrive] = useState<'run_and_drive' | 'has_issues'>('run_and_drive');
  const [carIssues, setCarIssues] = useState('');
  const [dutyDocUrl, setDutyDocUrl] = useState('');
  const [dutyUploadStatus, setDutyUploadStatus] = useState<'idle' | 'uploading' | 'completed' | 'error'>('idle');
  const [dutyUploadProgress, setDutyUploadProgress] = useState(0);
  const dutyDocInputRef = useRef<HTMLInputElement>(null);

  // Audio Bidding Pulse State
  const [isAudioMuted, setIsAudioMuted] = useState(true);

  // Time ticker state
  const [currentTime, setCurrentTime] = useState(new Date());

  const currentUser = auth.currentUser;
  const [userRole, setUserRole] = useState<string | null>(null);

  useEffect(() => {
    if (!currentUser) {
      setUserRole(null);
      return;
    }
    const userRef = doc(db, 'users', currentUser.uid);
    const unsub = onSnapshot(userRef, (snap) => {
      if (snap.exists()) {
        setUserRole(snap.data()?.role || 'user');
      }
    });
    return () => unsub();
  }, [currentUser]);

  const isAdmin = propIsAdmin || propUserRole === 'admin' || userRole === 'admin' || currentUser?.email?.toLowerCase() === ADMIN_EMAIL;
  
  // Admin View Mode state: 'management' shows admin tools & active auctions engine, 'user_preview' shows user view
  const [adminViewMode, setAdminViewMode] = useState<'management' | 'user_preview'>('management');
  
  // User alert subscription form states
  const [alertContact, setAlertContact] = useState('');
  const [alertSubscribed, setAlertSubscribed] = useState(false);

  // Real-time ticker
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Sync Audio playback with live bidding status
  useEffect(() => {
    const hasLiveAuction = auctions.some(auction => {
      if (auction.status !== 'active') return false;
      const end = new Date(auction.endTime);
      return end.getTime() > currentTime.getTime();
    });

    if (hasLiveAuction && !isAudioMuted) {
      liveBiddingAudioEngine.setMute(false);
    } else {
      liveBiddingAudioEngine.setMute(true);
    }
  }, [auctions, isAudioMuted, currentTime]);

  // Clean shutdown on unmount
  useEffect(() => {
    return () => {
      liveBiddingAudioEngine.shutdown();
    };
  }, []);

  // Listen to auctions collection in real-time
  useEffect(() => {
    if (!currentUser) return;

    const path = 'auctions';
    const q = query(collection(db, path), orderBy('createdAt', 'desc'));
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const activeList: any[] = [];
      snapshot.forEach((doc) => {
        activeList.push({ id: doc.id, ...doc.data() });
      });
      setAuctions(activeList);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, path);
    });

    return () => unsubscribe();
  }, [currentUser]);

  // Listen to user's personal restriction profile in real-time
  useEffect(() => {
    if (!currentUser) {
      setUserRestriction(null);
      return;
    }

    const path = `bidding_restrictions/${currentUser.uid}`;
    const unsubscribe = onSnapshot(doc(db, 'bidding_restrictions', currentUser.uid), (doc) => {
      if (doc.exists()) {
        const data = doc.data();
        setUserRestriction({ 
          restricted: data.restricted || false, 
          walletBalance: data.walletBalance || 0,
          hasPaidRegistrationFee: data.hasPaidRegistrationFee || false
        });
      } else {
        setUserRestriction({ restricted: false, walletBalance: 0, hasPaidRegistrationFee: false });
      }
    }, (error) => {
      // Degrade gracefully (non-fatal offline status check)
      console.warn("Restriction check status offline fallback notice:", error);
    });

    return () => unsubscribe();
  }, [currentUser]);

  // Listen to bids subcollections in real-time for bidding history and location displays
  useEffect(() => {
    if (auctions.length === 0) return;

    const unsubscribes = auctions.map((auction) => {
      const q = query(
        collection(db, 'auctions', auction.id, 'bids'), 
        orderBy('createdAt', 'desc'), 
        limit(15)
      );
      return onSnapshot(q, (snapshot) => {
        const bidsList: any[] = [];
        snapshot.forEach((docSnap) => {
          bidsList.push({ id: docSnap.id, ...docSnap.data() });
        });
        setBidsByAuction(prev => ({
          ...prev,
          [auction.id]: bidsList
        }));
      }, (error) => {
        console.warn(`Error loading bids subcollection for ${auction.id}:`, error);
      });
    });

    return () => {
      unsubscribes.forEach(unsub => unsub());
    };
  }, [auctions]);

  // Handle template selection
  const handleApplyTemplate = (index: number) => {
    const template = VEHICLE_TEMPLATES[index];
    setSelectedTemplate(index);
    setTitle(template.title);
    setMake(template.make);
    setModel(template.model);
    setYear(template.year);
    setVin(template.vin);
    setMileage(template.mileage);
    setPrice(template.price);
    setImageUrl(template.imageUrl);
    setDescription(template.description);
    setLocalPhotoFiles([]);
    setUploadedUrls([template.imageUrl]);
  };

  const handleFundWallet = async (amount: number) => {
    if (!currentUser) return;
    const currentBalance = userRestriction?.walletBalance || 0;
    const newBalance = currentBalance + amount;
    try {
      const ref = doc(db, 'bidding_restrictions', currentUser.uid);
      await setDoc(ref, {
        restricted: userRestriction?.restricted || false,
        walletBalance: newBalance,
        hasPaidRegistrationFee: userRestriction?.hasPaidRegistrationFee || false
      }, { merge: true });
    } catch (err) {
      console.error("[WALLET FUND ERR]:", err);
      // Fallback update
      setUserRestriction(prev => prev ? { ...prev, walletBalance: newBalance } : { restricted: false, walletBalance: newBalance, hasPaidRegistrationFee: false });
    }
  };

  const handlePayRegistrationFee = async () => {
    if (!currentUser) return;
    const balance = userRestriction?.walletBalance || 0;
    if (balance < 5000) {
      // Direct them to the secure card payment gateway system automatically for direct ₦5,000 NGN fee payment
      setIsPayingRegistrationDirectly(true);
      setCustomFundAmount('5000');
      setFundingStep(1);
      setIsFundModalOpen(true);
      return;
    }

    try {
      const newBalance = balance - 5000;
      const ref = doc(db, 'bidding_restrictions', currentUser.uid);
      await setDoc(ref, {
        restricted: userRestriction?.restricted || false,
        walletBalance: newBalance,
        hasPaidRegistrationFee: true
      }, { merge: true });

      alert("🟢 REGISTRATION ACTIVATED:\n\nYou have paid the constant ₦5,000 NGN bidding registration fee. Live distress bidding privileges are now successfully activated on your account!");
    } catch (err: any) {
      console.error("[PAY REGISTRATION FEE ERR]:", err);
      alert("Failed to pay registration fee: " + err.message);
    }
  };

  const handleDutyDocClick = () => {
    dutyDocInputRef.current?.click();
  };

  const handleDutyDocChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    const file = files[0];
    setDutyUploadStatus('uploading');
    setDutyUploadProgress(0);
    
    uploadToImgBB(file, file.name, (progress) => {
      setDutyUploadProgress(Math.round(progress));
    }).then(url => {
      setDutyDocUrl(url);
      setDutyUploadStatus('completed');
    }).catch(err => {
      console.error("[DUTY DOC UPLOAD ERROR]:", err);
      setDutyUploadStatus('error');
      alert(`Duty/Registration upload failed: ${err.message || String(err)}`);
    });
  };

  const handlePhotoUploadClick = () => {
    fileInputRef.current?.click();
  };

  const handlePhotosSelected = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;
    processPhotoFiles(Array.from(files));
  };

  const processPhotoFiles = (files: File[]) => {
    const validPhotos = files.filter(file => file.type.startsWith('image/'));
    if (validPhotos.length === 0) {
      alert("Please select valid image files.");
      return;
    }

    validPhotos.forEach(file => {
      const id = `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
      const previewUrl = URL.createObjectURL(file);
      
      const newPhoto = {
        id,
        file,
        preview: previewUrl,
        status: 'uploading' as const,
        progress: 0
      };

      setLocalPhotoFiles(prev => [...prev, newPhoto]);

      // Upload in background immediately
      uploadToImgBB(file, file.name, (progress) => {
        setLocalPhotoFiles(prev => 
          prev.map(item => item.id === id ? { ...item, progress: Math.round(progress) } : item)
        );
      }).then(url => {
        setLocalPhotoFiles(prev => 
          prev.map(item => item.id === id ? { ...item, status: 'completed' as const, progress: 100, url } : item)
        );
        setUploadedUrls(prev => {
          const fresh = [...prev, url];
          // Auto-populate primary input if it is empty
          if (!imageUrl) {
            setImageUrl(fresh[0]);
          }
          return fresh;
        });
      }).catch(err => {
        console.error("Photo upload pipeline error:", err);
        setLocalPhotoFiles(prev => 
          prev.map(item => item.id === id ? { ...item, status: 'error' as const } : item)
        );
        alert(`Failed to upload photo "${file.name}": ${err.message || String(err)}`);
      });
    });
  };

  const handleRemovePhoto = (id: string, urlToRemove?: string) => {
    setLocalPhotoFiles(prev => {
      const target = prev.find(item => item.id === id);
      if (target?.preview) {
        URL.revokeObjectURL(target.preview);
      }
      return prev.filter(item => item.id !== id);
    });
    
    if (urlToRemove) {
      setUploadedUrls(prev => {
        const fresh = prev.filter(url => url !== urlToRemove);
        // Sync cover image input
        if (imageUrl === urlToRemove) {
          setImageUrl(fresh[0] || '');
        }
        return fresh;
      });
    }
  };

  const handleSetCoverPhoto = (url: string) => {
    setUploadedUrls(prev => {
      const filtered = prev.filter(u => u !== url);
      const fresh = [url, ...filtered];
      setImageUrl(url);
      return fresh;
    });
  };

  // helper to clear form
  const handleClearForm = () => {
    setTitle('');
    setMake('');
    setModel('');
    setVin('');
    setImageUrl('');
    setDescription('');
    setSelectedTemplate(null);
    setLocalPhotoFiles([]);
    setUploadedUrls([]);
    setBiddingDate(new Date().toISOString().substring(0, 10));
    setPrice(5000000);
    setYear(2023);
    setMileage(1000);
    setRunAndDrive('run_and_drive');
    setCarIssues('');
    setDutyDocUrl('');
    setDutyUploadStatus('idle');
    setEditingAuctionId(null);
  };

  // Pre-populate form to edit vehicle
  const handleStartEditAuction = (auction: any) => {
    setEditingAuctionId(auction.id);
    setTitle(auction.title || '');
    setMake(auction.make || '');
    setModel(auction.model || '');
    setYear(auction.year || 2023);
    setVin(auction.vin || '');
    setMileage(auction.mileage || 1000);
    setPrice(auction.startPrice || 5000000);
    setImageUrl(auction.imageUrl || '');
    setDescription(auction.description || '');
    setBiddingDate(auction.biddingDate || new Date().toISOString().substring(0, 10));
    setRunAndDrive(auction.runAndDrive || 'run_and_drive');
    setCarIssues(auction.carIssues || '');
    setDutyDocUrl(auction.dutyDocUrl || '');
    setDurationMinutes(15);
    setUploadedUrls(auction.imageUrls || (auction.imageUrl ? [auction.imageUrl] : []));
    setLocalPhotoFiles([]);
    setIsAdminPanelOpen(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Submit new distressed auction or update existing
  const handleCreateAuction = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAdmin) return;

    // Direct check for pending uploads
    const hasUploading = localPhotoFiles.some(photo => photo.status === 'uploading');
    if (hasUploading) {
      alert("Please wait for all image uploads to complete before publishing.");
      return;
    }

    const finalImageUrl = imageUrl || uploadedUrls[0] || '';
    if (!title || !make || !model || !price || !finalImageUrl) {
      alert("Please populate all vital vehicle configurations and provide an image/upload car pictures.");
      return;
    }

    setIsSubmitting(true);

    if (editingAuctionId) {
      const path = `auctions/${editingAuctionId}`;
      try {
        const auctionRef = doc(db, 'auctions', editingAuctionId);
        await updateDoc(auctionRef, {
          title,
          make,
          model,
          year,
          vin,
          mileage: Number(mileage),
          startPrice: Number(price),
          imageUrl: finalImageUrl,
          imageUrls: uploadedUrls.length > 0 ? uploadedUrls : [finalImageUrl],
          biddingDate: biddingDate || new Date().toISOString().substring(0, 10),
          runAndDrive: runAndDrive || 'run_and_drive',
          carIssues: carIssues || '',
          dutyDocUrl: dutyDocUrl || ''
        });
        
        alert("✅ Vehicle post updated successfully!");
        handleClearForm();
        setIsAdminPanelOpen(false);
      } catch (error) {
        handleFirestoreError(error, OperationType.UPDATE, path);
      } finally {
        setIsSubmitting(false);
      }
      return;
    }

    const path = 'auctions';
    try {
      const startTime = new Date();
      const endTime = new Date(startTime.getTime() + durationMinutes * 60 * 1000);
      
      const newAuction = {
        title,
        make,
        model,
        year,
        vin,
        mileage,
        startPrice: Number(price),
        currentBid: Number(price),
        highestBidderId: '',
        highestBidderName: '',
        highestBidderEmail: '',
        highestBidderPhone: '',
        secondHighestBidderId: '',
        secondHighestBidderName: '',
        secondHighestBidderEmail: '',
        secondHighestBidderPhone: '',
        createdAt: new Date().toISOString(),
        startTime: startTime.toISOString(),
        endTime: endTime.toISOString(),
        status: 'active', // active, ended, paid, unpaid
        winnerDefaulted: false,
        imageUrl: finalImageUrl,
        imageUrls: uploadedUrls.length > 0 ? uploadedUrls : [finalImageUrl],
        biddingDate: biddingDate || new Date().toISOString().substring(0, 10),
        runAndDrive: runAndDrive || 'run_and_drive',
        carIssues: carIssues || '',
        dutyDocUrl: dutyDocUrl || ''
      };

      await addDoc(collection(db, path), newAuction);
      handleClearForm();
      setIsAdminPanelOpen(false);
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, path);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Run bid increment (instantly increase current highest bid)
  const handlePlaceBid = async (auction: any, increment: number) => {
    if (!currentUser) return;
    if (userRestriction?.restricted) {
      alert("ACCOUNT RESTRICTED: You cannot place bids while your bidding access is frozen.");
      return;
    }

    if (!userRestriction?.hasPaidRegistrationFee) {
      alert(`🔒 LIVE BIDDING LOCKED:\n\nTo place active live bids on corporate liquidation vehicles, you must first pay the constant ₦5,000 NGN bidding registration fee from your funded Bid Wallet of the software.\n\nPlease activate your Bidding Registration instantly at the Control Center above!`);
      return;
    }

    const now = new Date();
    if (now >= new Date(auction.endTime) || auction.status !== 'active') {
      alert("AUCTION TERMINATED: Bidding has concluded for this vehicle.");
      return;
    }

    // Bidder payload
    const finalBidAmount = (auction.currentBid || auction.startPrice) + increment;
    const path = `auctions/${auction.id}`;

    // Prepare runner up tracking
    let updatedSecondBidderProps = {};
    if (auction.highestBidderId && auction.highestBidderId !== currentUser.uid) {
      // Push old highest bidder down to runner up status
      updatedSecondBidderProps = {
        secondHighestBidderId: auction.highestBidderId,
        secondHighestBidderName: auction.highestBidderName || 'Premium Bidder',
        secondHighestBidderEmail: auction.highestBidderEmail || '',
        secondHighestBidderPhone: auction.highestBidderPhone || ''
      };
    }

    try {
      const auctionRef = doc(db, 'auctions', auction.id);
      await updateDoc(auctionRef, {
        currentBid: finalBidAmount,
        highestBidderId: currentUser.uid,
        highestBidderName: currentUser.displayName || 'Authorized Bidder',
        highestBidderEmail: currentUser.email || '',
        highestBidderPhone: currentUser.phoneNumber || '+23481XXXXXXXX',
        highestBidderLocation: biddingLocationState,
        ...updatedSecondBidderProps
      });

      // Record bid in subcollection for audit logs
      const bidsPath = `auctions/${auction.id}/bids`;
      await addDoc(collection(db, 'auctions', auction.id, 'bids'), {
        amount: finalBidAmount,
        bidderId: currentUser.uid,
        bidderName: currentUser.displayName || 'Authorized Bidder',
        bidderEmail: currentUser.email || '',
        createdAt: new Date().toISOString(),
        location: biddingLocationState
      });

    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, path);
    }
  };

  // Buy Now success state and updates
  const handleBuyNowSuccess = async (auction: any) => {
    if (!currentUser) return;
    const path = `auctions/${auction.id}`;
    const buyNowPrice = Math.round((auction.startPrice || auction.currentBid) * 1.25);
    const orderId = `AUC-BUY-${auction.id.substring(0, 6).toUpperCase()}-${Math.floor(100+Math.random()*900)}`;

    try {
      const auctionRef = doc(db, 'auctions', auction.id);
      
      // Update auction document bypassing the timer & securing status 'paid'
      await updateDoc(auctionRef, {
        currentBid: buyNowPrice,
        highestBidderId: currentUser.uid,
        highestBidderName: checkoutFullName || currentUser.displayName || 'Premium Buyer',
        highestBidderEmail: checkoutEmail || currentUser.email || '',
        highestBidderPhone: checkoutPhone || currentUser.phoneNumber || '+23481XXXXXXXX',
        status: 'paid'
      });

      // Record direct buyout transaction ledger
      await addDoc(collection(db, 'auctions', auction.id, 'bids'), {
        amount: buyNowPrice,
        bidderId: currentUser.uid,
        bidderName: checkoutFullName || currentUser.displayName || 'Premium Buyer',
        bidderEmail: checkoutEmail || currentUser.email || '',
        createdAt: new Date().toISOString()
      });

      // Register checkout as an official order request in requests collection so it reflects on admin Order Board
      await addDoc(collection(db, 'requests'), {
        orderId,
        listingId: auction.id,
        userId: currentUser.uid,
        status: 'paid',
        price: buyNowPrice,
        title: `${auction.title} [BUY NOW]`,
        orderDate: new Date().toISOString(),
        siloType: 'garage',
        deliveryDetails: {
          fullName: checkoutFullName || currentUser.displayName || 'VIP Buyer',
          email: checkoutEmail || currentUser.email || '',
          phone: checkoutPhone || currentUser.phoneNumber || '',
          address: checkoutAddress ? `${checkoutAddress} (Bidding Origin: ${biddingLocationState})` : `VIP Delivery / Handover Logistics (Bidding Origin: ${biddingLocationState})`
        },
        createdAt: serverTimestamp()
      });

      // Invoke official secure email transmitter
      const customerEmail = checkoutEmail || currentUser.email || '';
      if (customerEmail) {
        const emailHtml = `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; color: #1e293b; background-color: #ffffff; padding: 24px; border: 1px solid #e2e8f0; border-radius: 16px;">
            <h2 style="font-size: 18px; font-weight: bold; color: #0f172a; margin-bottom: 16px;">Immediate Buyout Confirmed • Luxury Asset Secured</h2>
            <p>Dear <strong>${checkoutFullName || currentUser.displayName || 'Valued Client'}</strong>,</p>
            <p>You have successfully bypass-acquired <strong>${auction.title}</strong> via our instant Buy Now checkout option.</p>
            
            <div style="margin: 20px 0; padding: 16px; background-color: #f8fafc; border-left: 4px solid #10b981; border-radius: 8px;">
              <h3 style="margin: 0 0 8px 0; font-size: 11px; text-transform: uppercase; font-weight: 800; color: #64748b; letter-spacing: 0.1em;">Delivery & Contact Details</h3>
              <p style="margin: 4px 0; font-size: 13px; color: #1e293b;"><strong>Full Name:</strong> ${checkoutFullName || 'N/A'}</p>
              <p style="margin: 4px 0; font-size: 13px; color: #1e293b;"><strong>Delivery Address:</strong> ${checkoutAddress || 'VIP Air Delivery / Handover Logistics'}</p>
              <p style="margin: 4px 0; font-size: 13px; color: #1e293b;"><strong>Contact Email Given:</strong> ${checkoutEmail || 'N/A'}</p>
              <p style="margin: 4px 0; font-size: 13px; color: #1e293b;"><strong>WhatsApp Support:</strong> ${checkoutPhone || 'N/A'}</p>
              <p style="margin: 4px 0; font-size: 13px; color: #1e293b;"><strong>Acquiring Price:</strong> ₦${buyNowPrice.toLocaleString()} NGN</p>
              <p style="margin: 4px 0; font-size: 13px; color: #1e293b;"><strong>Bypass Transaction ID:</strong> ${orderId}</p>
            </div>

            <p>Please call us or join the WhatsApp VIP Concierge immediately to organize structural testing, document transfer and transport logistics.</p>
            <hr style="border: 0; border-top: 1px solid #e2e8f0; margin: 24px 0;" />
            <p style="font-size: 12px; font-weight: bold; text-transform: uppercase; color: #64748b; margin-bottom: 12px; letter-spacing: 0.05em;">Verify Concierge Coordinates</p>
            <ul style="list-style: none; padding: 0; margin: 0;">
              <li style="margin-bottom: 12px;"><a href="tel:+2348138642942" style="color: #0f172a; text-decoration: none; font-weight: bold; font-size: 14px;">📞 Call Concierge: +234 813 864 2942</a></li>
              <li style="margin-bottom: 12px;"><a href="https://wa.me/2348138642942" style="color: #10b981; text-decoration: none; font-weight: bold; font-size: 14px;">💬 WhatsApp VIP Concierge</a></li>
            </ul>
          </div>
        `;

        fetch('/api/generate-email', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email: customerEmail,
            to: customerEmail,
            fullName: checkoutFullName || currentUser.displayName || 'Valued Partner',
            subject: `Asset Secured (Buy Now) - Uncle Tee's Search Engine (#${auction.id.substring(0, 8).toUpperCase()})`,
            title: auction.title,
            html: emailHtml
          })
        }).catch(err => console.error("[BUY NOW CALLBACK ERROR]:", err));

        // Send a parallel email notice directly to the Admin
        fetch('/api/generate-email', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email: ADMIN_EMAIL,
            to: ADMIN_EMAIL,
            fullName: 'Uncle Tee Admin',
            subject: `[ADMIN ALERT] New Buy Now Acquisition - ${auction.title}`,
            title: auction.title,
            html: `
              <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; color: #1e293b; background-color: #ffffff; padding: 24px; border: 1px solid #e2e8f0; border-radius: 16px;">
                <h2 style="font-size: 18px; font-weight: bold; color: #e11d48; margin-bottom: 16px;">🚨 ADMIN NOTIFICATION: DIRECT BUYOUT COMPLETED</h2>
                <p>The asset <strong>${auction.title}</strong> has been instantly bypass-purchased via the Buy Now option.</p>
                
                <div style="margin: 20px 0; padding: 16px; background-color: #fff1f2; border-left: 4px solid #e11d48; border-radius: 8px;">
                  <h3 style="margin: 0 0 8px 0; font-size: 11px; text-transform: uppercase; font-weight: 800; color: #9f1239; letter-spacing: 0.1em;">Buyer Delivery & Contact Details</h3>
                  <p style="margin: 4px 0; font-size: 13px; color: #1e293b;"><strong>Full Name:</strong> ${checkoutFullName || 'N/A'}</p>
                  <p style="margin: 4px 0; font-size: 13px; color: #1e293b;"><strong>Delivery Address:</strong> ${checkoutAddress || 'N/A'}</p>
                  <p style="margin: 4px 0; font-size: 13px; color: #1e293b;"><strong>Email Given:</strong> <a href="mailto:${customerEmail}">${customerEmail}</a></p>
                  <p style="margin: 4px 0; font-size: 13px; color: #1e293b;"><strong>WhatsApp Support:</strong> <a href="https://wa.me/${(checkoutPhone || '').replace(/\D/g, '')}">${checkoutPhone || 'N/A'}</a></p>
                  <p style="margin: 4px 0; font-size: 13px; color: #1e293b;"><strong>Acquiring Price:</strong> ₦${buyNowPrice.toLocaleString()} NGN</p>
                  <p style="margin: 4px 0; font-size: 13px; color: #1e293b;"><strong>Transaction ID:</strong> ${orderId}</p>
                </div>
                
                <p>Please check the administrative Requests Ledger table immediately to authorize shipping, schedule verification, or schedule delivery updates.</p>
              </div>
            `
          })
        }).catch(err => console.error("[BUY NOW ADMIN NOTIFICATION ERROR]:", err));
      }
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, path);
    }
  };

  // Admin relisting when bidding on an auction has concluded
  const handleRelistAuction = async (auction: any, newEndTimeIsoString: string) => {
    if (!isAdmin) return;
    if (!newEndTimeIsoString) {
      alert("❌ Please select a valid date and time for relisting.");
      return;
    }
    const path = `auctions/${auction.id}`;
    try {
      const auctionRef = doc(db, 'auctions', auction.id);
      await updateDoc(auctionRef, {
        status: 'active',
        endTime: newEndTimeIsoString,
        startTime: new Date().toISOString(),
        currentBid: auction.startPrice || 5000000, // Reset bid back to start price
        highestBidderId: '',
        highestBidderName: '',
        highestBidderEmail: '',
        highestBidderPhone: '',
        secondHighestBidderId: '',
        secondHighestBidderName: '',
        secondHighestBidderEmail: '',
        secondHighestBidderPhone: '',
        winnerDefaulted: false
      });
      alert("✅ Vehicle Auction has been successfully relisted! The car is now live for public bidding with your selected scheduled end time.");
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, path);
    }
  };

  // Admin settles auction as fully Paid
  const handleMarkPaid = async (auction: any) => {
    if (!isAdmin) return;
    const path = `auctions/${auction.id}`;
    const orderId = `AUC-WIN-${auction.id.substring(0, 6).toUpperCase()}-${Math.floor(100+Math.random()*900)}`;

    try {
      const auctionRef = doc(db, 'auctions', auction.id);
      await updateDoc(auctionRef, {
        status: 'paid'
      });

      // Write request so final bid reflects in administrative requests panel
      await addDoc(collection(db, 'requests'), {
        orderId,
        listingId: auction.id,
        userId: auction.highestBidderId || 'unknown',
        status: 'paid',
        price: auction.currentBid || 0,
        title: `${auction.title} [Auction Winner Settle]`,
        orderDate: new Date().toISOString(),
        siloType: 'garage',
        deliveryDetails: {
          fullName: auction.highestBidderName || 'Winner Bidder',
          email: auction.highestBidderEmail || 'itztahirismail@gmail.com',
          phone: auction.highestBidderPhone || '+23481XXXXXXXX',
          address: `Bidding Location Origin: ${auction.highestBidderLocation || 'Unknown'} - Auction Physical Transfer / Verified Handover`
        },
        createdAt: serverTimestamp()
      });

      // Alert & dispatch secure email to winner notify about complete payment confirmation
      const customerEmail = auction.highestBidderEmail;
      if (customerEmail) {
        fetch('/api/generate-email', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email: customerEmail,
            to: customerEmail,
            fullName: auction.highestBidderName || 'Valued Winner',
            subject: `Asset Marked Settle/Paid - Uncle Tee Auction VIP (#${auction.id.substring(0, 6).toUpperCase()})`,
            title: auction.title,
            html: `
              <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; color: #1e293b; background-color: #ffffff; padding: 24px; border: 1px solid #e2e8f0; border-radius: 16px;">
                <h2 style="font-size: 18px; font-weight: bold; color: #10b981; margin-bottom: 16px;">Verified Auction Award settled Successfully!</h2>
                <p>Hello <strong>${auction.highestBidderName || 'Winner'}</strong>,</p>
                <p>Your payment/escrow for the auction asset <strong>${auction.title}</strong> has been officially confirmed and verified by Uncle Tee Administration.</p>
                
                <div style="margin: 20px 0; padding: 16px; background-color: #f0fdf4; border-left: 4px solid #10b981; border-radius: 8px;">
                  <h3 style="margin: 0 0 8px 0; font-size: 11px; text-transform: uppercase; font-weight: 800; color: #15803d; letter-spacing: 0.1em;">Payment Settlement Ledger Info</h3>
                  <p style="margin: 4px 0; font-size: 13px; color: #1e293b;"><strong>Won Vehicle Asset:</strong> ${auction.title}</p>
                  <p style="margin: 4px 0; font-size: 13px; color: #1e293b;"><strong>Winning Bid Value:</strong> ₦${(auction.currentBid || 0).toLocaleString()} NGN</p>
                  <p style="margin: 4px 0; font-size: 13px; color: #1e293b;"><strong>Verified Owner Name:</strong> ${auction.highestBidderName || 'N/A'}</p>
                  <p style="margin: 4px 0; font-size: 13px; color: #1e293b;"><strong>Customer Contact Phone:</strong> ${auction.highestBidderPhone || 'N/A'}</p>
                  <p style="margin: 4px 0; font-size: 13px; color: #1e293b;"><strong>Verified Ledger reference ID:</strong> ${orderId}</p>
                </div>

                <p>To schedule custom delivery, please check email notices, call concierge, or click our WhatsApp support link within 24 hours.</p>
                <hr style="border: 0; border-top: 1px solid #e2e8f0; margin: 24px 0;" />
                <p style="font-size: 11px; font-weight: bold; text-transform: uppercase; color: #64748b; margin-bottom: 8px;">Support center connections</p>
                <p style="margin: 6px 0;"><a href="tel:+2348138642942" style="color: #0f172a; text-decoration: none; font-weight: bold; font-size: 14px;">📞 Call Direct: +234 813 864 2942</a></p>
                <p style="margin: 6px 0;"><a href="https://wa.me/2348138642942" style="color: #10b981; text-decoration: none; font-weight: bold; font-size: 14px;">💬 WhatsApp VIP Concierge Support</a></p>
              </div>
            `
          })
        }).catch(err => console.error("[SETTLE EMAIL ERROR]:", err));
      }

      alert("Auction marked as Paid successfully. Final winning bid order has been registered in the Requests Panel ledger!");
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, path);
    }
  };

  // Admin marks winner as Unpaid (Freeze Access & Award to Runner Up if possible)
  const handleMarkUnpaid = async (auction: any) => {
    if (!isAdmin) return;
    const path = `auctions/${auction.id}`;

    const defaultedWinnerId = auction.highestBidderId;
    if (!defaultedWinnerId) return;

    try {
      // 1. Freeze access for defaulted winner
      const restrictionRef = doc(db, 'bidding_restrictions', defaultedWinnerId);
      await setDoc(restrictionRef, {
        restricted: true,
        reason: 'unpaid_auction',
        frozenAt: new Date().toISOString(),
        auctionId: auction.id,
        defaultedBidAmount: auction.currentBid
      });

      // 2. Resolve Fallback option (award to runner up / second-highest bidder)
      const hasRunnerUp = !!auction.secondHighestBidderId;
      const auctionRef = doc(db, 'auctions', auction.id);

      if (hasRunnerUp) {
        // Automatically promote second-highest bidder as active winner!
        await updateDoc(auctionRef, {
          status: 'awarded_runner_up',
          winnerDefaulted: true,
          // Assign active highest bidder values to the runner up
          highestBidderId: auction.secondHighestBidderId,
          highestBidderName: auction.secondHighestBidderName,
          highestBidderEmail: auction.secondHighestBidderEmail,
          highestBidderPhone: auction.secondHighestBidderPhone,
          // We keep the original bid intact or represent custom awarded price
          currentBid: auction.currentBid - 50000 // Subtle adjusted reward
        });
        
        // Notify runner-up would be active on next render.
        alert(`Default concluded. ${auction.highestBidderName}'s account frozen. Vehicle awarded to runner-up: ${auction.secondHighestBidderName}.`);
      } else {
        // Conclude auction as unpaid completely with no fallback
        await updateDoc(auctionRef, {
          status: 'unpaid',
          winnerDefaulted: true
        });
        alert(`Default concluded. ${auction.highestBidderName}'s account has been successfully frozen.`);
      }

    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, path);
    }
  };

  // Unfreeze Settlement Trigger (Restore Access upon paying fine)
  const handlePayFineSuccess = async () => {
    if (!currentUser) return;
    const path = `bidding_restrictions/${currentUser.uid}`;
    try {
      // Delete restriction or set restricted to false
      const restrictionRef = doc(db, 'bidding_restrictions', currentUser.uid);
      await deleteDoc(restrictionRef);
      setUserRestriction({ 
        restricted: false, 
        walletBalance: userRestriction?.walletBalance || 0,
        hasPaidRegistrationFee: userRestriction?.hasPaidRegistrationFee || false
      });
      
      // Auto success toast on dashboard
      alert("Settlement verified! Bidding access successfully restored.");
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, path);
    }
  };

  const startFinePaymentFlow = (gateway: 'paystack' | 'flutterwave') => {
    setPortalGateway(gateway);
    setPaymentPortalStep(1);
    setIsPaymentPortalOpen(true);
  };

  const executeFinePayment = () => {
    setPaymentLoading(true);
    // Mimic real transaction processing
    setTimeout(() => {
      setPaymentLoading(false);
      setPaymentPortalStep(3);
    }, 2800);
  };

  // Delete auction entry from lists
  const handleDeleteAuction = async (id: string) => {
    if (!isAdmin) return;
    if (!confirm("Are you sure you want to permanently delete this distress auction record?")) return;
    try {
      await deleteDoc(doc(db, 'auctions', id));
    } catch (error) {
      console.error("Failed to delete distress auction:", error);
    }
  };

  // Calculate remaining timer metrics
  const getAuctionTimerString = (endTimeStr: string) => {
    const end = new Date(endTimeStr);
    const diff = end.getTime() - currentTime.getTime();
    if (diff <= 0) return "Auction Concluded";

    const hours = Math.floor(diff / (1000 * 60 * 60));
    const mins = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    const secs = Math.floor((diff % (1000 * 60)) / 1000);

    return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="space-y-12 pb-16 font-sans">
      
      {onBack && (
        <div className="flex items-center -mb-6">
          <button
            onClick={onBack}
            className="group flex items-center gap-2 text-xs font-bold text-slate-500 hover:text-slate-900 transition-all bg-slate-50 hover:bg-slate-100 px-4 py-2.5 rounded-2xl border border-slate-200 w-fit shadow-xs active:scale-95"
          >
            <ArrowLeft className="w-4 h-4 transition-transform group-hover:-translate-x-0.5 text-slate-400 group-hover:text-slate-700" />
            <span>Back to Storefront</span>
          </button>
        </div>
      )}
      
      {/* Admin Mode Toggle Bar (Visible to Admin only) */}
      {isAdmin && (
        <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white p-4.5 rounded-3xl border border-slate-800 shadow-xl flex flex-col sm:flex-row items-center justify-between gap-4 font-sans">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-indigo-500/20 text-indigo-400 rounded-xl border border-indigo-500/30">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-black uppercase tracking-wider text-white">Administrator Workspace Active</span>
                <span className="px-2 py-0.5 bg-indigo-500/30 text-indigo-300 rounded text-[9px] font-bold uppercase tracking-widest border border-indigo-500/40">Full Admin Mode</span>
              </div>
              <p className="text-[11px] text-slate-300">Toggle between your Live Auction Management Console and the User Experience Preview.</p>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0 w-full sm:w-auto">
            <button
              onClick={() => setAdminViewMode('management')}
              className={`flex-1 sm:flex-initial px-4 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-all flex items-center justify-center gap-2 ${
                adminViewMode === 'management'
                  ? 'bg-indigo-600 text-white shadow-md border border-indigo-400/30 font-black'
                  : 'bg-slate-800 text-slate-300 hover:bg-slate-700 border border-slate-700'
              }`}
            >
              <Zap className="w-3.5 h-3.5" />
              <span>Admin Management</span>
            </button>
            <button
              onClick={() => setAdminViewMode('user_preview')}
              className={`flex-1 sm:flex-initial px-4 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-all flex items-center justify-center gap-2 ${
                adminViewMode === 'user_preview'
                  ? 'bg-amber-500 text-slate-950 shadow-md font-black border border-amber-400/40'
                  : 'bg-slate-800 text-slate-300 hover:bg-slate-700 border border-slate-700'
              }`}
            >
              <Eye className="w-3.5 h-3.5" />
              <span>User Preview View</span>
            </button>
          </div>
        </div>
      )}

      {/* Header section with brand accent */}
      <div className="flex flex-col md:flex-row md:items-end justify-between border-b border-slate-100 pb-6 gap-6">
        <div className="space-y-2">
          <div className="flex items-center gap-2.5">
            <div className="bg-amber-500/10 text-amber-500 p-2 rounded-xl border border-amber-500/20">
              <Gavel className="w-6 h-6 animate-pulse" />
            </div>
            <span className="text-[10px] bg-slate-900 text-white px-2.5 py-1 rounded-full font-black uppercase tracking-widest leading-none">LIVE AUCTION PORTFOLIO</span>
          </div>
          <h1 className="text-4xl md:text-5xl font-light text-slate-900 leading-none italic tracking-tight">LIVE AUCTION</h1>
          <p className="text-slate-500 text-[10px] uppercase font-black tracking-[0.2em]">Verified Distress Sales & Accident Cars Direct from Nigeria Liquidation Hubs</p>
        </div>

        {/* Admin Creation Console Toggle button (shown when in management view) */}
        {isAdmin && adminViewMode === 'management' && (
          <button 
            onClick={() => setIsAdminPanelOpen(!isAdminPanelOpen)}
            className="flex items-center gap-2 px-5 py-3 bg-indigo-600 hover:bg-slate-900 text-white rounded-xl text-xs font-bold uppercase tracking-widest shadow-xl transition-all font-sans shrink-0 border border-indigo-500/10"
          >
            <Plus className="w-4 h-4" />
            {isAdminPanelOpen ? "Close Admin Console" : "Open Admin Control Panel"}
          </button>
        )}
      </div>

      {/* User Explanation & Car Dealer Contact Banner */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Main Platform Explanation */}
        <div className="lg:col-span-2 bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 text-white p-6 rounded-3xl border border-slate-800 shadow-xl space-y-3 relative overflow-hidden">
          <div className="flex items-center gap-2">
            <span className="p-1.5 bg-amber-500/20 text-amber-400 rounded-lg border border-amber-500/30">
              <Info className="w-4 h-4" />
            </span>
            <span className="text-xs font-black uppercase tracking-wider text-amber-400">About Live Auction</span>
          </div>
          <h3 className="text-lg font-bold tracking-tight text-white leading-snug">
            Accident & Non-Accident Distress Cars in Nigeria
          </h3>
          <p className="text-xs text-slate-300 leading-relaxed font-sans">
            This Live Auction portal gives users full access to bid on verified cars located within Nigeria — including <strong className="text-white font-bold">accident-damaged cars</strong> (for rebuilders and auto enthusiasts) and <strong className="text-white font-bold">non-accident distress sales cars</strong>. All listed vehicles come complete with authentic custom duties documentation at highly affordable rates, accessible for bidding with a small registration fee.
          </p>
          <div className="pt-1 flex flex-wrap gap-2 text-[10px] font-bold uppercase text-slate-300 font-sans">
            <span className="px-2.5 py-1 bg-white/10 rounded-full border border-white/10">✓ Genuine Customs Duties</span>
            <span className="px-2.5 py-1 bg-white/10 rounded-full border border-white/10">✓ Verified Distress Sales</span>
            <span className="px-2.5 py-1 bg-white/10 rounded-full border border-white/10">✓ Affordable Starting Bids</span>
          </div>
        </div>

        {/* Car Dealer Listing Prompt Banner */}
        <div className="bg-emerald-950/90 text-white p-6 rounded-3xl border border-emerald-800/80 shadow-xl space-y-3 flex flex-col justify-between relative overflow-hidden">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="p-1.5 bg-emerald-500/20 text-emerald-400 rounded-lg border border-emerald-500/30">
                <Car className="w-4 h-4" />
              </span>
              <span className="text-xs font-black uppercase tracking-wider text-emerald-400">Car Dealers Hub</span>
            </div>
            <h4 className="text-base font-bold text-white tracking-tight">Have a Car to Put Up for Auction?</h4>
            <p className="text-xs text-emerald-100/80 leading-relaxed font-sans">
              If you are a car dealer and have a car you want to put in for auction or a distressed car to liquidate, contact us via WhatsApp so your car can be listed!
            </p>
          </div>
          <a
            href="https://wa.me/2348138642942?text=Hello%20Uncle%20Tee%20Automobiles,%20I%20am%20a%20car%20dealer%20and%20I%20want%20to%20list%20a%20car%20for%20Live%20Auction"
            target="_blank"
            rel="noopener noreferrer"
            className="w-full py-3 px-4 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs uppercase tracking-wider rounded-2xl transition-all shadow-lg flex items-center justify-center gap-2 font-sans active:scale-95"
          >
            <MessageCircle className="w-4 h-4 fill-slate-950" />
            <span>Contact 08138642942 on WhatsApp</span>
          </a>
        </div>
      </div>

      {/* USER VIEW: Comprehensive Words of Encouragement, Trust Building, Alert Form, and Site Navigation */}
      {(!isAdmin || adminViewMode === 'user_preview') && (
        <div className="space-y-10">
          
          {/* Words of Encouragement & Trust Building Section */}
          <div className="bg-gradient-to-br from-amber-500/5 via-indigo-500/5 to-slate-900/5 p-8 rounded-3xl border border-amber-500/20 shadow-lg space-y-6 relative overflow-hidden font-sans">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-amber-500/10 text-amber-600 rounded-2xl border border-amber-500/20">
                  <Sparkles className="w-6 h-6 animate-pulse" />
                </div>
                <div>
                  <span className="text-[10px] font-black uppercase tracking-widest text-amber-600 block">Preparation & Updates</span>
                  <h3 className="text-2xl font-bold text-slate-900 tracking-tight">Building Trust & Delivering Perfection For You</h3>
                </div>
              </div>
              <span className="px-3.5 py-1.5 bg-amber-500 text-slate-950 text-[10px] font-black uppercase tracking-wider rounded-full shadow-xs">
                COMING SOON • UNDER ACTIVE PREPARATION
              </span>
            </div>

            <div className="space-y-4 text-sm text-slate-600 leading-relaxed font-sans max-w-4xl">
              <p>
                <strong className="text-slate-900">Dear valued customer and auto enthusiast,</strong> we are working round the clock to make the Live Auction experience as simple, secure, and seamless as possible for you! We understand that acquiring a vehicle — whether an accident distress sale for custom restoration or a non-accident distress deal — requires absolute trust, clear condition reporting, and guaranteed customs duty documentation verification.
              </p>
              <p>
                Our engineering, physical inspection, and logistics teams are perfecting every detail of the live bidding engine. From real-time escrow wallet protection and instant bid status notifications to pre-verified duty papers and physical vehicle inspection certificates, we are setting up a portal engineered for complete confidence and peace of mind.
              </p>
              <p>
                We deeply appreciate your patience, trust, and enthusiasm as we finalize the launch schedule for our live bidding rounds. Rest assured, we will notify you on updates immediately as upcoming high-value vehicle drops go live!
              </p>
            </div>

            {/* Notification Alert Subscription Form */}
            <div className="pt-4 border-t border-slate-200/60">
              <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs max-w-2xl space-y-4">
                <div className="flex items-center gap-2 text-slate-900 font-bold text-sm">
                  <Bell className="w-4 h-4 text-amber-500" />
                  <span>Be the First to Know When Live Bidding Launches</span>
                </div>
                <p className="text-xs text-slate-500 font-sans">
                  Enter your email address or WhatsApp phone number below to join our VIP notification ledger for instant launch alerts and exclusive vehicle drop updates.
                </p>

                {alertSubscribed ? (
                  <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center gap-3 text-emerald-800 text-xs font-bold font-sans">
                    <CheckCircle className="w-5 h-5 text-emerald-600 shrink-0" />
                    <span>Thank you! You are subscribed for VIP Live Auction launch alerts and vehicle drop notifications. We will reach out to you as soon as bidding opens!</span>
                  </div>
                ) : (
                  <form
                    onSubmit={(e) => {
                      e.preventDefault();
                      if (alertContact.trim()) {
                        setAlertSubscribed(true);
                      }
                    }}
                    className="flex flex-col sm:flex-row gap-2"
                  >
                    <input
                      type="text"
                      value={alertContact}
                      onChange={(e) => setAlertContact(e.target.value)}
                      placeholder="Enter Email or WhatsApp Phone Number..."
                      required
                      className="flex-1 px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-500 font-sans"
                    />
                    <button
                      type="submit"
                      className="px-6 py-3 bg-slate-900 hover:bg-amber-500 hover:text-slate-950 text-white font-bold text-xs uppercase tracking-wider rounded-xl transition-all shadow-md shrink-0 flex items-center justify-center gap-2 active:scale-95"
                    >
                      <Bell className="w-4 h-4" />
                      <span>Notify Me On Launch</span>
                    </button>
                  </form>
                )}
              </div>
            </div>
          </div>

          {/* "In the Meantime — Explore Uncle Tee Nigeria" Navigation Section */}
          <div className="space-y-6 pt-2">
            <div className="space-y-1 font-sans">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-indigo-600" />
                <span className="text-xs font-black uppercase tracking-widest text-indigo-600">Explore Uncle Tee Nigeria</span>
              </div>
              <h3 className="text-2xl font-bold text-slate-900 tracking-tight">Discover Our Full Ecosystem In the Meantime</h3>
              <p className="text-xs text-slate-500 font-sans max-w-2xl">
                While our live auction engine is being prepared for prime time, explore our complete catalog of luxury products, vehicle sales, custom fabrics, and specialized services:
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 font-sans">
              
              {/* Card 1: The Garage & Fleet Sales */}
              <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm hover:shadow-md transition-all flex flex-col justify-between space-y-4 group">
                <div className="space-y-3">
                  <div className="p-3 bg-blue-50 text-blue-600 rounded-2xl w-fit group-hover:bg-blue-600 group-hover:text-white transition-colors">
                    <Car className="w-6 h-6" />
                  </div>
                  <h4 className="text-lg font-bold text-slate-900 tracking-tight">The Garage & Fleet Sales</h4>
                  <p className="text-xs text-slate-500 leading-relaxed font-sans">
                    Browse our available inventory of pre-inspected luxury cars, distress sales vehicles, and brand-new arrivals ready for immediate purchase.
                  </p>
                </div>
                <button
                  onClick={() => onNavigateView?.('store', 'garage')}
                  className="w-full py-3 px-4 bg-slate-100 hover:bg-blue-600 hover:text-white text-slate-800 font-bold text-xs uppercase tracking-wider rounded-2xl transition-all flex items-center justify-center gap-2 group-hover:shadow-md"
                >
                  <span>Explore The Garage</span>
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>

              {/* Card 2: Wardrobe & Fabrics */}
              <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm hover:shadow-md transition-all flex flex-col justify-between space-y-4 group">
                <div className="space-y-3">
                  <div className="p-3 bg-amber-50 text-amber-600 rounded-2xl w-fit group-hover:bg-amber-600 group-hover:text-white transition-colors">
                    <Shirt className="w-6 h-6" />
                  </div>
                  <h4 className="text-lg font-bold text-slate-900 tracking-tight">Wardrobe & Luxury Fabrics</h4>
                  <p className="text-xs text-slate-500 leading-relaxed font-sans">
                    Explore our exquisite collection of premium Senator fabrics, cashmere suitings, cotton materials, and custom fashion accessories.
                  </p>
                </div>
                <button
                  onClick={() => onNavigateView?.('store', 'wardrobe')}
                  className="w-full py-3 px-4 bg-slate-100 hover:bg-amber-600 hover:text-white text-slate-800 font-bold text-xs uppercase tracking-wider rounded-2xl transition-all flex items-center justify-center gap-2 group-hover:shadow-md"
                >
                  <span>Browse Wardrobe</span>
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>

              {/* Card 3: Jersey Studio */}
              <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm hover:shadow-md transition-all flex flex-col justify-between space-y-4 group">
                <div className="space-y-3">
                  <div className="p-3 bg-emerald-50 text-emerald-600 rounded-2xl w-fit group-hover:bg-emerald-600 group-hover:text-white transition-colors">
                    <Star className="w-6 h-6" />
                  </div>
                  <h4 className="text-lg font-bold text-slate-900 tracking-tight">Jersey Studio & Custom Kits</h4>
                  <p className="text-xs text-slate-500 leading-relaxed font-sans">
                    Design and customize authentic football club jerseys and sportswear with personalized player names, numbers, and custom patches.
                  </p>
                </div>
                <button
                  onClick={() => onNavigateView?.('store', 'jersey')}
                  className="w-full py-3 px-4 bg-slate-100 hover:bg-emerald-600 hover:text-white text-slate-800 font-bold text-xs uppercase tracking-wider rounded-2xl transition-all flex items-center justify-center gap-2 group-hover:shadow-md"
                >
                  <span>Customize Jerseys</span>
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>

              {/* Card 4: VIN Verification & Customs Duty Check */}
              <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm hover:shadow-md transition-all flex flex-col justify-between space-y-4 group">
                <div className="space-y-3">
                  <div className="p-3 bg-indigo-50 text-indigo-600 rounded-2xl w-fit group-hover:bg-indigo-600 group-hover:text-white transition-colors">
                    <ShieldCheck className="w-6 h-6" />
                  </div>
                  <h4 className="text-lg font-bold text-slate-900 tracking-tight">VIN & Customs Duty Check</h4>
                  <p className="text-xs text-slate-500 leading-relaxed font-sans">
                    Verify vehicle identification numbers, check authentic customs duty status, and request comprehensive vehicle history reports.
                  </p>
                </div>
                <button
                  onClick={() => onNavigateView?.('store', 'garage')}
                  className="w-full py-3 px-4 bg-slate-100 hover:bg-indigo-600 hover:text-white text-slate-800 font-bold text-xs uppercase tracking-wider rounded-2xl transition-all flex items-center justify-center gap-2 group-hover:shadow-md"
                >
                  <span>Verify VIN Records</span>
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>

              {/* Card 5: Custom Requests & Cart */}
              <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm hover:shadow-md transition-all flex flex-col justify-between space-y-4 group md:col-span-2 lg:col-span-2">
                <div className="space-y-3">
                  <div className="p-3 bg-purple-50 text-purple-600 rounded-2xl w-fit group-hover:bg-purple-600 group-hover:text-white transition-colors">
                    <FileText className="w-6 h-6" />
                  </div>
                  <h4 className="text-lg font-bold text-slate-900 tracking-tight">Custom Orders & Special Requests Ledger</h4>
                  <p className="text-xs text-slate-500 leading-relaxed font-sans">
                    Have a specific car model, rare fabric, custom tailoring request, or bulk accessory order? Submit a custom request to Uncle Tee directly and track your orders in real time.
                  </p>
                </div>
                <button
                  onClick={() => onNavigateView?.('orders')}
                  className="w-full sm:w-auto px-6 py-3 bg-slate-100 hover:bg-purple-600 hover:text-white text-slate-800 font-bold text-xs uppercase tracking-wider rounded-2xl transition-all flex items-center justify-center gap-2 group-hover:shadow-md self-start"
                >
                  <span>View Custom Orders & Requests</span>
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>

            </div>
          </div>

        </div>
      )}

      {/* ADMIN MANAGEMENT VIEW: Client Credentials & Bidding Control Center */}
      {isAdmin && adminViewMode === 'management' && (
        <>
          {currentUser && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 bg-slate-50 p-5 rounded-3xl border border-slate-100 shadow-sm">
            {/* Box 1: Bidding Escrow Wallet */}
            <div className="flex flex-col justify-between p-4.5 bg-white rounded-2xl border border-slate-100 shadow-xs relative overflow-hidden group min-h-[110px]">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 bg-amber-500/10 text-amber-500 rounded-xl">
                    <Wallet className="w-5 h-5" />
                  </div>
                  <div className="text-left">
                    <span className="text-[9px] font-black tracking-wider uppercase text-slate-400 block p-0 leading-none mb-1">Bid Escrow Wallet</span>
                    <span className="text-sm font-black text-slate-900 font-mono block">
                      ₦{(userRestriction?.walletBalance || 0).toLocaleString()} <span className="text-[10px] text-slate-400">NGN</span>
                    </span>
                  </div>
                </div>
                
                <button
                  type="button"
                  onClick={() => {
                    setCustomFundAmount('50000');
                    setFundingStep(1);
                    setIsFundModalOpen(true);
                  }}
                  className="px-3 py-1.5 bg-slate-900 hover:bg-amber-500 hover:text-white text-white text-[9.5px] font-black uppercase tracking-wider rounded-lg transition-all active:scale-95 whitespace-nowrap"
                >
                  + Fund Wallet
                </button>
              </div>

              <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between text-[10px] text-slate-400 font-bold">
                <span>Constant Registration Fee:</span>
                <span className="text-slate-600 font-mono">₦5,000 NGN</span>
              </div>
            </div>

            {/* Box 2: Verified Bidding Status Credentials */}
            <div className="flex flex-col justify-between p-4.5 bg-white rounded-2xl border border-slate-100 shadow-xs min-h-[110px]">
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-3">
                  <div className={`p-2.5 rounded-xl ${
                    userRestriction?.hasPaidRegistrationFee 
                      ? "bg-emerald-50 text-emerald-600" 
                      : "bg-slate-100 text-slate-500"
                  }`}>
                    <Award className="w-5 h-5 animate-pulse" />
                  </div>
                  <div className="text-left">
                    <span className="text-[9px] font-black tracking-wider uppercase text-slate-400 block p-0 leading-none mb-1">Bidding Credentials</span>
                    <span className={`text-xs font-black block leading-tight ${
                      userRestriction?.hasPaidRegistrationFee ? "text-emerald-600" : "text-slate-500"
                    }`}>
                      {userRestriction?.hasPaidRegistrationFee ? "Registered Active Bidder 🟢" : "Watch-Only Spectator 🔒"}
                    </span>
                  </div>
                </div>

                {!userRestriction?.hasPaidRegistrationFee && (
                  <button
                    type="button"
                    onClick={handlePayRegistrationFee}
                    className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-[9.5px] font-black uppercase tracking-wider rounded-lg transition-all active:scale-95 whitespace-nowrap"
                  >
                    Pay ₦5K Fee ➔
                  </button>
                )}
              </div>

              <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between text-[9.5px] font-bold">
                <span className="text-slate-400">Status Check:</span>
                <span className={userRestriction?.hasPaidRegistrationFee ? "text-emerald-600 animate-pulse" : "text-amber-500"}>
                  {userRestriction?.hasPaidRegistrationFee ? "Verified ✓" : "Dues Outstanding (₦5,000 Constant)"}
                </span>
              </div>
            </div>

            {/* Box 3: Atmosphere / Performance Control */}
            <div className="flex flex-col justify-between p-4.5 bg-white rounded-2xl border border-slate-100 shadow-xs min-h-[110px]">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => setIsAudioMuted(!isAudioMuted)}
                    className={`p-2.5 rounded-xl transition-all ${
                      !isAudioMuted ? "bg-indigo-50 text-indigo-600 ring-2 ring-indigo-500/10" : "bg-slate-100 text-slate-400 hover:bg-slate-200"
                    }`}
                  >
                    {!isAudioMuted ? <Volume2 className="w-5 h-5" /> : <VolumeX className="w-5 h-5" />}
                  </button>
                  <div className="text-left">
                    <span className="text-[9px] font-black tracking-wider uppercase text-slate-400 block p-0 leading-none mb-1">Suspense Audio</span>
                    <span className={`text-xs font-bold block ${!isAudioMuted ? "text-indigo-600" : "text-slate-500"}`}>
                      {!isAudioMuted ? "Live Synthesizer On 🎵" : "Sound Muted"}
                    </span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setIsAudioMuted(!isAudioMuted)}
                  className={`text-[9.5px] font-black uppercase tracking-widest ${!isAudioMuted ? "text-indigo-650 hover:text-indigo-800" : "text-slate-400 hover:text-slate-650"}`}
                >
                  {!isAudioMuted ? "MUTE" : "PLAY"}
                </button>
              </div>

              <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between text-[9.5px] text-slate-400 font-bold">
                <span>Audio Engine state:</span>
                <span className={!isAudioMuted ? "text-indigo-600 font-mono" : "text-slate-400 font-mono"}>
                  {!isAudioMuted ? "SYNTH_ACTIVE" : "STBY"}
                </span>
              </div>
            </div>
          </div>

          {/* Secure Interactive Funding Gateway Overlay */}
          <AnimatePresence>
            {isFundModalOpen && (
              <div className="fixed inset-0 z-[1000] bg-slate-950/70 backdrop-blur-md flex items-center justify-center p-4">
                <motion.div
                  initial={{ opacity: 0, scale: 0.95, y: 15 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95, y: 15 }}
                  className="bg-white rounded-[2.5rem] border border-slate-200/50 shadow-2xl max-w-md w-full overflow-hidden text-left"
                >
                  {/* Header */}
                  <div className="p-6 bg-slate-900 text-white relative">
                    <span className="absolute -top-12 -left-12 w-36 h-36 bg-amber-500/10 rounded-full blur-3xl animate-pulse" />
                    <div className="flex items-center justify-between relative z-10">
                      <div className="flex items-center gap-2">
                        <Wallet className="w-5 h-5 text-amber-400 animate-bounce" />
                        <span className="text-[9px] font-black uppercase tracking-widest text-amber-400">
                          {isPayingRegistrationDirectly ? "SECURE REGISTER GATEWAY" : "SECURE BILLING ESCROW"}
                        </span>
                      </div>
                      <button 
                        type="button"
                        onClick={() => {
                          setIsFundModalOpen(false);
                          setFundingStep(1);
                          setIsPayingRegistrationDirectly(false);
                        }}
                        className="text-slate-400 hover:text-white text-[11px] font-black uppercase tracking-widest transition-colors bg-white/5 px-2.5 py-1 rounded-lg"
                      >
                        ✕ Close
                      </button>
                    </div>
                    <h3 className="text-xl font-light italic text-slate-100 mt-4 leading-none">
                      {isPayingRegistrationDirectly ? "Bidding Registration Activation" : "Fund Escrow Wallet"}
                    </h3>
                    <p className="text-[9px] text-slate-400 uppercase tracking-widest font-extrabold mt-1.5 leading-none">
                      {isPayingRegistrationDirectly ? "Authorize direct ₦5,000 activation payment" : "Complete simulated card deposit credential"}
                    </p>
                  </div>

                  {fundingStep === 1 ? (
                    <div className="p-6 space-y-5">
                      {isPayingRegistrationDirectly ? (
                        <div className="p-4 bg-emerald-50 border border-emerald-100 rounded-2xl text-left">
                          <span className="text-[9.5px] font-black uppercase tracking-wider text-emerald-600 block mb-1">DUE REGISTRATION FEE</span>
                          <span className="text-2xl font-black text-emerald-700 font-mono">₦5,000 <span className="text-xs">NGN</span></span>
                          <span className="text-[10px] text-emerald-600 font-medium block mt-1.5 leading-tight">
                            Constant licensing and registration activation charge to enable active bidding on corporate distress liquidation vehicles. This amount will be directly authorized via this secure gateway.
                          </span>
                        </div>
                      ) : (
                        <>
                          {/* Interactive form */}
                          <div className="space-y-1.5">
                            <label className="text-[9.5px] font-black uppercase tracking-wider text-slate-400 block p-0">Deposit Amount (₦ NGN)</label>
                            <div className="relative">
                              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-mono font-bold text-sm">₦</span>
                              <input 
                                type="number" 
                                value={customFundAmount} 
                                onChange={(e) => setCustomFundAmount(e.target.value)}
                                placeholder="e.g. 10000"
                                className="w-full bg-slate-50 border-2 rounded-xl pl-8 pr-4 py-3 text-slate-950 font-mono font-bold text-sm border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500" 
                              />
                            </div>
                          </div>

                          {/* Quick select presets */}
                          <div className="space-y-1.5">
                            <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block mb-0.5">Preset Values</span>
                            <div className="grid grid-cols-4 gap-2">
                              {['5000', '15000', '50000', '100000'].map((val) => (
                                <button
                                  key={val}
                                  type="button"
                                  onClick={() => setCustomFundAmount(val)}
                                  className={`py-2 px-1 text-[9.5px] border font-mono font-black rounded-lg uppercase tracking-wider transition-all ${
                                    customFundAmount === val 
                                      ? "bg-indigo-600 text-white border-indigo-600 shadow-md" 
                                      : "bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100"
                                  }`}
                                >
                                  ₦{parseInt(val).toLocaleString()}
                                </button>
                              ))}
                            </div>
                          </div>
                        </>
                      )}

                      <div className="h-px bg-slate-100" />

                      {/* Fake Card Details */}
                      <div className="space-y-3.5">
                        <span className="text-[9.5px] font-black text-slate-400 uppercase tracking-widest block mb-0.5">Simulated Gateway Authorization</span>
                        
                        <div className="space-y-1">
                          <label className="text-[9px] font-bold text-slate-500 uppercase block p-0">Secure Card Number</label>
                          <input 
                            type="text" 
                            maxLength={19}
                            value={fundCardNum} 
                            onChange={(e) => {
                              const val = e.target.value.replace(/\s+/g, '').replace(/[^0-9]/gi, '');
                              const matches = val.match(/\d{4,16}/g);
                              const match = matches && matches[0] || '';
                              const parts = [];
                              for (let i=0, len=match.length; i<len; i+=4) {
                                parts.push(match.substring(i, i+4));
                              }
                              if (parts.length > 0) {
                                setFundCardNum(parts.join(' '));
                              } else {
                                setFundCardNum(val);
                              }
                            }}
                            placeholder="4000 1234 5678 9010" 
                            className="w-full bg-slate-50 border rounded-xl px-3 py-2 text-xs font-mono border-slate-200 text-slate-800 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                          />
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                          <div className="space-y-1">
                            <label className="text-[9px] font-bold text-slate-500 uppercase block p-0 font-sans">Expiry Date</label>
                            <input 
                              type="text" 
                              maxLength={5}
                              value={fundCardExp} 
                              onChange={(e) => {
                                let val = e.target.value.replace(/[^0-9]/g, '');
                                if (val.length >= 2) {
                                  val = val.substring(0, 2) + '/' + val.substring(2, 4);
                                }
                                setFundCardExp(val);
                              }}
                              placeholder="MM/YY" 
                              className="w-full bg-slate-50 border rounded-xl px-3 py-2 text-xs font-mono border-slate-200 text-slate-800 text-center focus:outline-none focus:ring-1 focus:ring-indigo-500"
                            />
                          </div>
                          <div className="space-y-1">
                            <label className="text-[9px] font-bold text-slate-500 uppercase block p-0 font-sans">CVV Security</label>
                            <input 
                              type="password" 
                              maxLength={3}
                              value={fundCardCvv} 
                              onChange={(e) => setFundCardCvv(e.target.value.replace(/[^0-9]/g, ''))}
                              placeholder="•••" 
                              className="w-full bg-slate-50 border rounded-xl px-3 py-2 text-xs font-mono border-slate-200 text-slate-800 text-center focus:outline-none focus:ring-1 focus:ring-indigo-500"
                            />
                          </div>
                        </div>
                      </div>

                      {/* Pay button */}
                      <button
                        type="button"
                        disabled={fundingProgress}
                        onClick={async () => {
                          const amountNum = parseFloat(customFundAmount);
                          if (isNaN(amountNum) || amountNum <= 0) {
                            alert("Please enter a valid amount.");
                            return;
                          }
                          setFundingProgress(true);
                          setTimeout(async () => {
                            if (isPayingRegistrationDirectly) {
                              try {
                                const ref = doc(db, 'bidding_restrictions', currentUser.uid);
                                await setDoc(ref, {
                                  restricted: userRestriction?.restricted || false,
                                  walletBalance: userRestriction?.walletBalance || 0,
                                  hasPaidRegistrationFee: true
                                }, { merge: true });
                              } catch (err) {
                                console.error("[DIRECT REGISTRATION PAYMENT ERR]:", err);
                                setUserRestriction(prev => prev ? { ...prev, hasPaidRegistrationFee: true } : { restricted: false, walletBalance: 0, hasPaidRegistrationFee: true });
                              }
                            } else {
                              await handleFundWallet(amountNum);
                            }
                            setFundingProgress(false);
                            setFundingStep(2);
                          }, 1500);
                        }}
                        className="w-full py-4.5 bg-indigo-600 hover:bg-slate-900 text-white text-[10px] font-black uppercase tracking-[0.2em] rounded-xl flex items-center justify-center gap-2 shadow-xl hover:shadow-indigo-500/15 transition-all active:scale-95"
                      >
                        {fundingProgress ? "Authorizing Secure Core Gateway..." : isPayingRegistrationDirectly ? "Process ₦5,000 Registration Fee ➔" : `Process Deposit ₦${parseFloat(customFundAmount || '0').toLocaleString()} ➔`}
                      </button>
                    </div>
                  ) : (
                    <div className="p-8 text-center space-y-4">
                      <div className="w-14 h-14 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center mx-auto border border-emerald-100 shadow-xs">
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3.5" d="M5 13l4 4L19 7"></path>
                        </svg>
                      </div>
                      <div className="space-y-1.5">
                        <h4 className="text-md font-black text-slate-900 tracking-tight leading-none">
                          {isPayingRegistrationDirectly ? "REGISTRATION ACTIVATED SUCCESS" : "TRANSACTION AUTHORIZED SUCCESS"}
                        </h4>
                        <p className="text-[11px] text-slate-500 leading-relaxed max-w-xs mx-auto">
                          {isPayingRegistrationDirectly 
                            ? "Verified instant card payment of ₦5,000 NGN. Your bidding registration has been successfully activated!" 
                            : `Verified deposit of ₦${parseFloat(customFundAmount || '0').toLocaleString()} NGN has been successfully settled and credited to your Bid Escrow Wallet.`
                          }
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          setIsFundModalOpen(false);
                          setFundingStep(1);
                          setFundCardNum('');
                          setFundCardExp('');
                          setFundCardCvv('');
                          setIsPayingRegistrationDirectly(false);
                        }}
                        className="w-full py-3 bg-slate-900 hover:bg-slate-800 text-white text-[10px] font-black uppercase tracking-widest rounded-xl transition-all"
                      >
                        Return To Hub ➔
                      </button>
                    </div>
                  )}
                </motion.div>
              </div>
            )}
          </AnimatePresence>
        </div>
      )}

      {/* Guest Login Fallback View */}
      {!currentUser && (
        <div className="max-w-xl mx-auto p-12 border border-slate-100 rounded-[2.5rem] bg-white shadow-xl text-center space-y-6">
          <div className="w-16 h-16 bg-slate-100 rounded-3xl flex items-center justify-center mx-auto border border-slate-200">
            <Lock className="w-8 h-8 text-slate-400" />
          </div>
          <div className="space-y-2">
            <h3 className="text-xl font-bold text-slate-900 tracking-tight uppercase">Registration Required</h3>
            <p className="text-slate-500 text-xs leading-relaxed max-w-sm mx-auto">
              Our Distress Bidding section houses high-value luxury assets from corporate liquidation portfolios. Connect your Google account to view real-time auctions.
            </p>
          </div>
          <div className="p-4 bg-slate-50 rounded-xl max-w-md mx-auto flex items-center justify-center gap-2 text-slate-500 text-[11px] font-mono">
            <ShieldCheck className="w-4 h-4 text-indigo-500 shrink-0" /> Verified AML/KYC Protocols Enforced
          </div>
        </div>
      )}

      {/* User Frozen Access Restriction Indicator Banner */}
      {currentUser && userRestriction?.restricted && (
        <motion.div 
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-red-50 border border-red-200 p-8 rounded-[2rem] flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6 shadow-sm shadow-red-100"
        >
          <div className="flex items-start gap-4">
            <div className="p-3 bg-red-100 rounded-2xl text-red-600 border border-red-200 shrink-0">
              <ShieldAlert className="w-6 h-6" />
            </div>
            <div className="space-y-1">
              <h4 className="text-base font-bold text-red-900 uppercase tracking-tight">Bidding Privileges Revoked</h4>
              <p className="text-red-700 text-xs max-w-xl leading-relaxed">
                Your account was frozen by Uncle Tee Concierge because an auction won by your account defaulted on final payment settlement (24 hour limit exceeded). E-commerce remains open, but you cannot place active bids.
              </p>
              <div className="flex items-center gap-2 mt-2 font-mono text-[10px] uppercase text-red-500 font-bold">
                <AlertTriangle className="w-3.5 h-3.5" /> Code: SEC_REVOKEATION_UNPAID • Fine: ₦50,000 NGN
              </div>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 w-full lg:w-auto shrink-0 pt-2 lg:pt-0">
            <button 
              onClick={() => startFinePaymentFlow('paystack')}
              className="flex items-center justify-center gap-2 px-6 py-4 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black uppercase tracking-widest rounded-xl shadow-lg shadow-emerald-100 transition-all font-sans"
            >
              <Coins className="w-4 h-4" /> Pay fine via Paystack
            </button>
            <button 
              onClick={() => startFinePaymentFlow('flutterwave')}
              className="flex items-center justify-center gap-2 px-6 py-4 bg-blue-600 hover:bg-blue-700 text-white text-xs font-black uppercase tracking-widest rounded-xl shadow-lg shadow-blue-100 transition-all font-sans"
            >
              <Coins className="w-4 h-4" /> Pay fine via Flutterwave
            </button>
          </div>
        </motion.div>
      )}

      {/* Admin Panel Creation Form (Collapsible Drawer style) */}
      {isAdmin && isAdminPanelOpen && (
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          className="border border-slate-200 bg-slate-50/50 p-8 rounded-[2rem] space-y-8 shadow-inner"
        >
          <div className="space-y-2">
            <h2 className="text-xl font-bold uppercase tracking-tight text-slate-900 flex items-center gap-2">
              {editingAuctionId ? (
                <>
                  <Edit className="w-5 h-5 text-amber-600 animate-pulse" /> Administrative Auction Editor
                </>
              ) : (
                <>
                  <Plus className="w-5 h-5 text-indigo-600" /> Administrative Auction Creator
                </>
              )}
            </h2>
            <p className="text-xs text-slate-500">
              {editingAuctionId 
                ? "Update corporate liquidation values, details, or documentation." 
                : "Configure corporate liquidation vehicles or use templates to deploy instantly."}
            </p>
          </div>

          {/* Template presets - Hide during active editing */}
          {!editingAuctionId && (
            <div className="space-y-3">
              <Label className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Deploy Preset Template (Accelerates QA Testing)</Label>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
                {VEHICLE_TEMPLATES.map((item, index) => (
                  <button
                    key={index}
                    type="button"
                    onClick={() => handleApplyTemplate(index)}
                    className={`p-3.5 rounded-xl border text-left text-xs transition-all flex items-center gap-3 ${
                      selectedTemplate === index 
                        ? "border-indigo-600 bg-indigo-50 shadow-sm" 
                        : "border-slate-200 bg-white hover:bg-slate-50"
                    }`}
                  >
                    <div className="h-10 w-10 bg-slate-100 rounded-lg overflow-hidden shrink-0">
                      <img src={item.imageUrl} alt="" className="h-full w-full object-cover" />
                    </div>
                    <div className="overflow-hidden leading-tight">
                      <p className="font-bold text-slate-800 truncate">{item.title}</p>
                      <p className="text-[9px] text-slate-400 font-mono mt-0.5">₦{(item.price/1000000).toFixed(0)}M Start</p>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleCreateAuction} className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="space-y-2">
              <Label className="text-xs font-bold text-slate-700">Display Title</Label>
              <Input 
                value={title} 
                onChange={(e) => setTitle(e.target.value)} 
                placeholder="e.g. Mercedes-AMG G63 Brabus" 
                className="bg-white border-2"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-xs font-bold text-slate-700">Brand / Make</Label>
                <Input 
                  value={make} 
                  onChange={(e) => setMake(e.target.value)} 
                  placeholder="e.g. MERCEDES-BENZ" 
                  className="bg-white border-2"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-xs font-bold text-slate-700">Model Name</Label>
                <Input 
                  value={model} 
                  onChange={(e) => setModel(e.target.value)} 
                  placeholder="e.g. G63" 
                  className="bg-white border-2"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-xs font-bold text-slate-700">Production Year</Label>
                <Input 
                  type="number"
                  value={year} 
                  onChange={(e) => setYear(Number(e.target.value))} 
                  className="bg-white border-2"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-xs font-bold text-slate-700">Vehicle VIN</Label>
                <Input 
                  value={vin} 
                  onChange={(e) => setVin(e.target.value)} 
                  placeholder="17-Digit Identifier" 
                  className="bg-white border-2 font-mono uppercase"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label className="text-xs font-bold text-slate-700">Mileage (KM)</Label>
              <Input 
                type="number"
                value={mileage} 
                onChange={(e) => setMileage(Number(e.target.value))} 
                className="bg-white border-2"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-xs font-bold text-slate-700">Starting Liquidation Price (₦)</Label>
              <Input 
                type="number"
                value={price} 
                onChange={(e) => setPrice(Number(e.target.value))} 
                className="bg-white border-2"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-xs font-bold text-slate-700">Auction Duration (Minutes)</Label>
              <select
                value={durationMinutes}
                onChange={(e) => setDurationMinutes(Number(e.target.value))}
                className="w-full bg-white border-2 rounded-lg px-3 py-2 text-sm text-slate-900 border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 h-10"
              >
                <option value={1}>1 Minute (Fast QA Test)</option>
                <option value={5}>5 Minutes</option>
                <option value={15}>15 Minutes</option>
                <option value={60}>1 Hour</option>
                <option value={1440}>24 Hours</option>
              </select>
            </div>
            <div className="col-span-1 md:col-span-3 space-y-4">
              <div className="space-y-1">
                <Label className="text-xs font-bold text-slate-700 block">Vehicle Auction Pictures</Label>
                <p className="text-[10px] text-slate-450 leading-relaxed font-sans">
                  Drag and drop high-resolution car photos or click to select files. Custom sizing optimizations are applied client-side. The leftmost picture acts as the main cover image, drag or specify cover overrides as needed.
                </p>
              </div>

              {/* Hidden file input */}
              <input 
                type="file" 
                ref={fileInputRef} 
                onChange={handlePhotosSelected} 
                accept="image/*" 
                multiple 
                className="hidden" 
              />

              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                {/* Drag and Drop Zone */}
                <div 
                  onClick={handlePhotoUploadClick}
                  onDragOver={(e) => {
                    e.preventDefault();
                    setIsDragging(true);
                  }}
                  onDragLeave={() => setIsDragging(false)}
                  onDrop={(e) => {
                    e.preventDefault();
                    setIsDragging(false);
                    if (e.dataTransfer.files) {
                      processPhotoFiles(Array.from(e.dataTransfer.files));
                    }
                  }}
                  className={`col-span-1 border-2 border-dashed rounded-2xl p-6 flex flex-col items-center justify-center text-center cursor-pointer min-h-[140px] transition-all duration-200 ${
                    isDragging 
                      ? "border-indigo-600 bg-indigo-50/50" 
                      : "border-slate-200 bg-white hover:border-indigo-400 hover:bg-slate-50/30"
                  }`}
                >
                  <Upload className={`w-8 h-8 mb-2 transition-colors ${isDragging ? "text-indigo-600" : "text-slate-400"}`} />
                  <span className="text-xs font-bold text-slate-700">Upload Car Pictures</span>
                  <span className="text-[9px] text-slate-400 mt-1 uppercase font-semibold">Drop or Click here</span>
                </div>

                {/* Picture Previews List */}
                <div className="col-span-1 md:col-span-3 grid grid-cols-3 sm:grid-cols-4 gap-3">
                  {/* Local Photos Queue (Files being uploaded or completed via file uploader) */}
                  {localPhotoFiles.map((photo) => {
                    const isCover = photo.url && uploadedUrls[0] === photo.url;
                    return (
                      <div key={photo.id} className="relative aspect-square bg-slate-900 rounded-2xl overflow-hidden border border-slate-100 group shadow-sm">
                        <img 
                          src={photo.preview} 
                          alt="Car Preview" 
                          className="w-full h-full object-cover select-none"
                        />
                        
                        {/* Coverage banner overlay */}
                        {isCover && (
                          <div className="absolute top-2 left-2 bg-indigo-600 border border-indigo-400/30 text-[8px] font-black uppercase text-white px-2 py-0.5 rounded-full shadow-md z-10">
                            Cover Image
                          </div>
                        )}

                        {/* Uploading Progress Overlay */}
                        {photo.status === 'uploading' && (
                          <div className="absolute inset-0 bg-slate-950/85 backdrop-blur-xs flex flex-col items-center justify-center text-center p-2 z-10">
                            <RefreshCw className="w-5 h-5 text-indigo-400 animate-spin mb-1.5" />
                            <span className="text-[10px] font-mono font-bold text-white leading-none">{photo.progress}%</span>
                            <span className="text-[8px] text-slate-400 uppercase font-black tracking-widest mt-1">UPLOADING</span>
                          </div>
                        )}

                        {/* Error state */}
                        {photo.status === 'error' && (
                          <div className="absolute inset-0 bg-red-950/90 backdrop-blur-xs flex flex-col items-center justify-center text-center p-2 z-10 border border-red-500">
                            <AlertTriangle className="w-5 h-5 text-red-500 mb-1" />
                            <span className="text-[8px] text-white font-black uppercase tracking-wider">Upload Failed</span>
                          </div>
                        )}

                        {/* Action overlays on hover */}
                        {photo.status === 'completed' && (
                          <div className="absolute inset-0 bg-slate-950/85 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2 z-20">
                            {!isCover && (
                              <button
                                type="button"
                                onClick={() => photo.url && handleSetCoverPhoto(photo.url)}
                                className="bg-white hover:bg-amber-400 hover:text-white p-2 text-slate-700 shadow-md transition-all duration-150 rounded-lg"
                                title="Set as main cover picture"
                              >
                                <ImageIcon className="w-3.5 h-3.5" />
                              </button>
                            )}
                            <button
                              type="button"
                              onClick={() => handleRemovePhoto(photo.id, photo.url)}
                              className="bg-white hover:bg-red-500 hover:text-white p-2 text-slate-700 shadow-md transition-all duration-150 rounded-lg"
                              title="Delete picture"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        )}
                      </div>
                    );
                  })}

                  {/* Template preset rendering or manually copy-pasted URLs (if not present as a preview already) */}
                  {imageUrl && !localPhotoFiles.some(p => p.url === imageUrl || p.preview === imageUrl) && (
                    <div className="relative aspect-square bg-slate-900 rounded-2xl overflow-hidden border border-slate-100 group shadow-sm">
                      <img 
                        src={imageUrl} 
                        alt="Template Cover Preview" 
                        className="w-full h-full object-cover select-none"
                        referrerPolicy="no-referrer"
                      />
                      <div className="absolute top-2 left-2 bg-amber-500 border border-amber-300/30 text-[8px] font-black uppercase text-white px-2 py-0.5 rounded-full shadow-md z-10">
                        Cover Image
                      </div>
                      
                      <div className="absolute inset-0 bg-slate-950/80 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2.5 z-20">
                        <button
                          type="button"
                          onClick={() => {
                            setImageUrl('');
                            setUploadedUrls(prev => prev.filter(u => u !== imageUrl));
                          }}
                          className="bg-white hover:bg-red-500 hover:text-white p-2 text-slate-700 shadow-md transition-all duration-150 rounded-lg"
                          title="Clear picture"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Empty state slots placeholder to keep design rhythm */}
                  {localPhotoFiles.length === 0 && !imageUrl && (
                    <div className="col-span-3 sm:col-span-4 flex items-center justify-center p-6 border-2 border-dashed border-slate-100 rounded-2xl bg-slate-50/50 min-h-[140px] text-center">
                      <div className="space-y-1">
                        <ImageIcon className="w-6 h-6 text-slate-350 mx-auto animate-pulse" />
                        <p className="text-[10px] text-slate-400 font-medium">No car pictures uploaded yet. Select files to construct catalog.</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Extra fallback text field if admin wants manually copy-pasting url */}
              <div className="pt-2">
                <button
                  type="button"
                  onClick={() => {
                    const fallbackUrl = prompt("Enter complete HTTPS picture URL:");
                    if (fallbackUrl && fallbackUrl.trim().startsWith("http")) {
                      setImageUrl(fallbackUrl.trim());
                      setUploadedUrls(prev => [...prev, fallbackUrl.trim()]);
                    }
                  }}
                  className="text-[10px] text-indigo-600 hover:text-indigo-800 font-bold uppercase tracking-wider block hover:underline"
                >
                  🔗 Or manual paste external photo link...
                </button>
              </div>
            </div>

            {/* Custom Distress Specs: Bidding Date, Car Mechanical Condition, Vehicle Papers */}
            <div className="col-span-1 md:col-span-3 grid grid-cols-1 md:grid-cols-3 gap-6 pt-4 border-t border-slate-100">
              {/* Bidding Occurrence Date */}
              <div className="space-y-2 text-left">
                <Label className="text-xs font-bold text-slate-700">Scheduled Bidding Date</Label>
                <Input 
                  type="date"
                  value={biddingDate} 
                  onChange={(e) => setBiddingDate(e.target.value)} 
                  className="bg-white border-2"
                />
              </div>

              {/* Run & Drive mechanical toggles */}
              <div className="space-y-2 text-left">
                <Label className="text-xs font-bold text-slate-700">Mechanical Status</Label>
                <select
                  value={runAndDrive}
                  onChange={(e) => setRunAndDrive(e.target.value as any)}
                  className="w-full bg-white border-2 rounded-lg px-3 py-2 text-sm text-slate-900 border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 h-10"
                >
                  <option value="run_and_drive">Run and Drive 🟢</option>
                  <option value="has_issues">Has Mechanical Issues / Needs Repairs ⚠️</option>
                </select>
              </div>

              {/* Specific Issues if any */}
              <div className="space-y-2 text-left">
                <Label className="text-xs font-bold text-slate-700">Specific Disclosed Issues</Label>
                <Input 
                  value={carIssues} 
                  onChange={(e) => setCarIssues(e.target.value)} 
                  placeholder="e.g. AC compressor issues, minor bumper dent" 
                  className="bg-white border-2 text-sm"
                />
              </div>
            </div>

            {/* Credibility Documents (Customs Duty / Vehicle Papers) */}
            <div className="col-span-1 md:col-span-3 space-y-2 bg-slate-50 p-4 rounded-xl border border-slate-200/50 text-left">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                  <Label className="text-xs font-bold text-slate-700 block text-left">Duty & Registration Credentials Certificate</Label>
                  <span className="text-[10px] text-slate-400 font-medium text-left block mt-0.5">Upload proof of customs duty or vehicle registration to maximize bidding credibility.</span>
                </div>
                
                <input 
                  type="file" 
                  ref={dutyDocInputRef} 
                  onChange={handleDutyDocChange}
                  accept="image/*,application/pdf"
                  className="hidden"
                />

                <button
                  type="button"
                  onClick={handleDutyDocClick}
                  disabled={dutyUploadStatus === 'uploading'}
                  className="px-4 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-600 font-black text-[10px] uppercase rounded-lg transition-colors border border-indigo-200 shadow-sm whitespace-nowrap self-start sm:self-center"
                >
                  {dutyUploadStatus === 'uploading' ? `Uploading (${dutyUploadProgress}%)` : dutyDocUrl ? "Replace Document ➔" : "Upload Document ➔"}
                </button>
              </div>

              {dutyDocUrl && (
                <div className="mt-2 flex items-center gap-2 p-2 bg-emerald-50 text-emerald-700 text-[10.5px] font-bold rounded-lg border border-emerald-100">
                  <span className="text-emerald-650">✓ Credential document uploaded successfully:</span>
                  <a href={dutyDocUrl} target="_blank" rel="noopener noreferrer" className="underline text-indigo-600 truncate max-w-xs hover:text-indigo-800">
                    {dutyDocUrl}
                  </a>
                </div>
              )}
            </div>

            <div className="col-span-1 md:col-span-3 space-y-2">
              <Label className="text-xs font-bold text-slate-700">Asset Condition / Notes</Label>
              <textarea 
                value={description} 
                onChange={(e) => setDescription(e.target.value)} 
                placeholder="Disclose any damage, background on liquidating trust..." 
                className="w-full bg-white border-2 rounded-lg p-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 h-24"
              />
            </div>

            {editingAuctionId ? (
              <div className="col-span-1 md:col-span-3 flex flex-col sm:flex-row gap-4">
                <button 
                  type="button"
                  onClick={handleClearForm}
                  className="px-6 py-4 bg-slate-200 hover:bg-slate-300 text-slate-800 font-sans text-xs font-bold uppercase tracking-widest rounded-xl transition-colors shrink-0"
                >
                  Cancel Edit
                </button>
                <button 
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1 bg-amber-600 text-white font-sans text-xs font-bold uppercase tracking-widest p-4 rounded-xl shadow-xl hover:bg-slate-900 transition-colors disabled:opacity-50"
                >
                  {isSubmitting ? "Saving Updates..." : "Save and Update Distress Post ➔"}
                </button>
              </div>
            ) : (
              <button 
                type="submit"
                disabled={isSubmitting}
                className="col-span-1 md:col-span-3 bg-indigo-600 text-white font-sans text-xs font-bold uppercase tracking-widest p-4 rounded-xl shadow-xl hover:bg-slate-900 transition-colors disabled:opacity-50"
              >
                {isSubmitting ? "Deploying Auction Security Keys..." : "Publish distress auction immediately"}
              </button>
            )}
          </form>
        </motion.div>
      )}

      {/* Active Distressed Auctions Grid Showcase */}
      {currentUser && (
        <div className="space-y-8">
          <div className="flex items-center gap-2">
            <span className="relative flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-amber-500"></span>
            </span>
            <h2 className="text-xl font-bold uppercase tracking-tight text-slate-900">Live Vehicle Auctions ({auctions.length})</h2>
          </div>

          {auctions.length === 0 ? (
            <div className="text-center py-24 border-2 border-dashed border-slate-100 rounded-[2.5rem] bg-white space-y-4">
              <Zap className="w-12 h-12 text-slate-300 mx-auto" />
              <div className="space-y-1">
                <h4 className="text-base font-bold text-slate-900 uppercase">Cabinet Empty</h4>
                <p className="text-slate-400 text-xs max-w-sm mx-auto">There are currently no active distressed vehicles listed. Log in as an administrator to spin up a new test auction using the presets.</p>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 lg:gap-8">
              {auctions.map((auction) => {
                const now = currentTime.getTime();
                const end = new Date(auction.endTime).getTime();
                const isConcluded = now >= end || auction.status !== 'active';
                const isWinner = isConcluded && auction.highestBidderId === currentUser.uid;

                return (
                  <motion.div 
                    layout
                    key={auction.id}
                    className="border border-slate-100 bg-white rounded-[2.5rem] overflow-hidden shadow-xl flex flex-col h-full relative group hover:border-slate-200 transition-all font-sans"
                  >
                    
                    {/* Floating Admin Actions (Delete & Edit) */}
                    {isAdmin && (
                      <div className="absolute top-4 right-4 z-40 flex items-center gap-2">
                        <button 
                          onClick={() => handleStartEditAuction(auction)}
                          className="bg-white/90 hover:bg-amber-500 hover:text-white text-slate-500 rounded-xl p-3 shadow-md border hover:border-amber-600 transition-colors"
                          title="Edit Vehicle Post"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button 
                          onClick={() => handleDeleteAuction(auction.id)}
                          className="bg-white/90 hover:bg-red-500 hover:text-white text-slate-500 rounded-xl p-3 shadow-md border hover:border-red-600 transition-colors"
                          title="Delete Auction Record"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    )}

                    {/* Image Area */}
                    <div className="h-64 overflow-hidden relative bg-slate-950 shrink-0">
                      <AuctionImageCarousel 
                        imageUrls={auction.imageUrls || [auction.imageUrl]} 
                        title={auction.title} 
                      />
                      <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-slate-950 via-slate-950/40 to-transparent opacity-80 pointer-events-none" />
                      
                      {/* Floating Countdown Indicator Pill */}
                      <div className="absolute bottom-4 left-6 flex flex-col items-start gap-1.5 pointer-events-none z-15">
                        <div className="flex items-center gap-2 bg-slate-900/80 backdrop-blur-md px-4 py-2 border border-slate-800 rounded-full shadow-lg">
                          <Clock className={`w-3.5 h-3.5 ${isConcluded ? "text-red-400" : "text-amber-400 animate-pulse"}`} />
                          <span className="text-[10px] font-mono font-bold text-white tracking-wider uppercase">
                            {isConcluded ? "Concluded" : getAuctionTimerString(auction.endTime)}
                          </span>
                        </div>
                        {!isConcluded && auction.endTime && (
                          <div className="bg-slate-950/90 backdrop-blur-md px-3 py-1.5 border border-slate-800 rounded-xl shadow-md text-[9px] font-mono font-bold text-amber-300 flex items-center gap-1">
                            <span>📅 Ends:</span>
                            <span>
                              {(() => {
                                try {
                                  return new Date(auction.endTime).toLocaleString('en-US', {
                                    month: 'short',
                                    day: 'numeric',
                                    hour: '2-digit',
                                    minute: '2-digit',
                                    hour12: true
                                  });
                                } catch (e) {
                                  return auction.endTime;
                                }
                              })()}
                            </span>
                          </div>
                        )}
                      </div>

                      {/* Status Badges */}
                      <div className="absolute top-4 left-6 flex flex-wrap gap-1.5 pointer-events-none">
                        {auction.status === 'paid' && (
                          <span className="bg-emerald-500 text-white text-[9px] font-black uppercase tracking-wider px-3 py-1.5 rounded-full border border-emerald-400/20 flex items-center gap-1">
                            <CheckCircle2 className="w-3 h-3" /> Settled
                          </span>
                        )}
                        {auction.status === 'unpaid' && (
                          <span className="bg-red-600 text-white text-[9px] font-black uppercase tracking-wider px-3 py-1.5 rounded-full border border-red-500/20">
                            Defaulted
                          </span>
                        )}
                        {auction.status === 'awarded_runner_up' && (
                          <span className="bg-purple-600 text-white text-[9px] font-black uppercase tracking-wider px-3 py-1.5 rounded-full border border-purple-500/20 flex items-center gap-1">
                            <Award className="w-3 h-3" /> Awarded Runner-Up
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Meta info block */}
                    <div className="p-8 flex-1 flex flex-col justify-between space-y-6">
                      <div className="space-y-3">
                        <div className="flex items-start justify-between">
                          <div>
                            <h3 className="text-2xl font-bold text-slate-900 tracking-tight">{auction.title}</h3>
                            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mt-1 font-sans">
                              {auction.year} • {auction.make} • {auction.mileage?.toLocaleString() || 1000} KM
                            </p>
                          </div>
                          <div className="text-right">
                            <span className="text-[9px] font-black uppercase text-slate-400 tracking-widest block mb-0.5">Starting Valuation</span>
                            <span className="text-sm font-mono font-bold text-slate-500">₦{auction.startPrice?.toLocaleString()}</span>
                          </div>
                        </div>

                        {/* Custom Mechanical Credentials & Scheduled Date Section */}
                        <div className="flex flex-wrap gap-2 pt-1 pb-1">
                          {/* Run & Drive tag */}
                          <span className={`px-2.5 py-1 text-[9.5px] font-black uppercase tracking-wider rounded-lg border flex items-center gap-1 ${
                            auction.runAndDrive === 'has_issues'
                              ? "bg-amber-50 text-amber-600 border-amber-200"
                              : "bg-emerald-50 text-emerald-600 border-emerald-200"
                          }`}>
                            {auction.runAndDrive === 'has_issues' ? "Issues Disclosed ⚠️" : "Run & Drive 🟢"}
                          </span>

                          {/* Bidding Scheduled Date */}
                          {auction.biddingDate && (
                            <span className="px-2.5 py-1 bg-indigo-50/50 text-indigo-700 border border-indigo-150 rounded-lg text-[9.5px] font-bold uppercase tracking-wider flex items-center gap-1">
                              📅 Bid Occurence: {auction.biddingDate}
                            </span>
                          )}

                          {/* Document Credential Badge */}
                          {auction.dutyDocUrl ? (
                            <a 
                              href={auction.dutyDocUrl} 
                              target="_blank" 
                              rel="noopener noreferrer" 
                              className="px-2.5 py-1 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-[9.5px] font-black uppercase tracking-wider flex items-center gap-1 cursor-pointer transition-colors shadow-xs"
                              title="Click to view verified legal custom duty or registration papers"
                            >
                              <FileText className="w-3 h-3 text-amber-400" /> Duty Verified
                            </a>
                          ) : (
                            <span className="px-2.5 py-1 bg-slate-100 text-slate-400 rounded-lg text-[9.5px] font-bold uppercase tracking-wider flex items-center gap-1">
                              No Uploaded Papers
                            </span>
                          )}
                        </div>

                        {/* Disclosed mechanical issues if present */}
                        {auction.runAndDrive === 'has_issues' && auction.carIssues && (
                          <div className="p-3 bg-amber-50/50 rounded-xl border border-amber-200/40 text-[10.5px] text-amber-700 text-left">
                            <span className="font-extrabold block mb-0.5 text-amber-850">⚠️ SPECIFIED MECHANICAL DEFECTS:</span>
                            <p className="font-medium text-amber-600 leading-relaxed font-sans">{auction.carIssues}</p>
                          </div>
                        )}
                        
                        <p className="text-slate-500 text-xs leading-relaxed line-clamp-3">{auction.description}</p>
                        
                        <div className="p-3 bg-slate-50 rounded-xl flex items-center justify-between text-xs text-slate-600 font-mono">
                          <span className="text-slate-400">VIN Fingerprint</span>
                          <span className="font-bold uppercase tracking-wider text-slate-800">{auction.vin || "NOT REGISTERED"}</span>
                        </div>
                      </div>

                      {/* Display Bid status card */}
                      <div className="p-5 bg-slate-50 rounded-2xl border border-slate-100 flex items-center justify-between gap-4">
                        <div>
                          <span className="text-[9px] font-black uppercase text-indigo-600 tracking-widest block mb-1">Active Highest Bid</span>
                          <span className="text-3xl font-black italic text-slate-900 leading-none">
                            ₦{auction.currentBid?.toLocaleString() || auction.startPrice?.toLocaleString()}
                          </span>
                        </div>
                        <div className="text-right leading-snug">
                          <span className="text-[9px] font-black uppercase text-slate-400 tracking-widest block mb-1">Current Leader</span>
                          {auction.highestBidderId ? (
                            <div className="flex flex-col items-end">
                              <p className="text-xs font-black text-slate-800 uppercase tracking-tight truncate max-w-[150px]">
                                {auction.highestBidderId === currentUser?.uid ? "You 👑" : auction.highestBidderName}
                              </p>
                              {auction.highestBidderLocation && (
                                <span className="text-[9.5px] text-indigo-650 font-bold uppercase tracking-tight mt-0.5 inline-flex items-center gap-0.5 bg-indigo-50/80 px-1.5 py-0.5 rounded-md border border-indigo-100/40">
                                  <MapPin className="w-2.5 h-2.5 text-indigo-500" /> {auction.highestBidderLocation}
                                </span>
                              )}
                              {isAdmin && (
                                <p className="text-[9px] text-indigo-600 font-sans mt-0.5">{auction.highestBidderPhone || 'No Phone'}</p>
                              )}
                            </div>
                          ) : (
                            <p className="text-xs font-bold text-slate-400">No active bids yet</p>
                          )}
                        </div>
                      </div>

                      {/* Your Bidding Location status & input (telling the admin) */}
                      {!isConcluded && (
                        <div className="bg-indigo-50/40 border border-indigo-100/50 rounded-2xl p-4 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs">
                          <div className="flex items-center gap-2.5 self-start sm:self-center">
                            <div className="p-2 rounded-xl bg-indigo-600 text-white shrink-0 shadow-sm animate-pulse">
                              <MapPin className="w-4 h-4" />
                            </div>
                            <div>
                              <p className="text-[10px] font-black text-indigo-600 uppercase tracking-widest">Bidding Origin</p>
                              <p className="font-extrabold text-slate-800 text-[11px] font-mono leading-tight mt-0.5">Bidding from: {biddingLocationState}</p>
                            </div>
                          </div>
                          
                          <div className="w-full sm:w-auto relative">
                            <input 
                              type="text"
                              value={biddingLocationState} 
                              onChange={(e) => setBiddingLocationState(e.target.value)}
                              placeholder="e.g. Lagos, Nigeria"
                              className="w-full sm:w-48 bg-white border border-slate-200 rounded-xl px-3 py-2 text-[11px] font-bold text-slate-700 hover:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-400 shadow-sm transition-all focus:border-indigo-500 font-sans"
                            />
                            <span className="absolute -bottom-3.5 right-1.5 text-[8px] font-medium text-slate-400">Specifies location to Admin</span>
                          </div>
                        </div>
                      )}

                      {/* Dynamic view layer (Active / concluded / winner) */}
                      {!isConcluded ? (
                        <div className="space-y-4">
                          <Label className="text-[10px] font-black uppercase text-slate-400 tracking-widest block px-1">Quick Instant Increment Bid (Click to Bid)</Label>
                          <div className="grid grid-cols-3 gap-2">
                            {[10000, 50000, 100000].map((increment) => (
                              <button
                                key={increment}
                                type="button"
                                disabled={userRestriction?.restricted}
                                onClick={() => handlePlaceBid(auction, increment)}
                                className="py-3 bg-slate-900 hover:bg-indigo-600 disabled:opacity-50 text-white font-mono text-[10px] font-bold uppercase tracking-wider rounded-xl shadow-lg transition-all active:scale-95 text-center"
                              >
                                +₦{(increment/1000).toFixed(0)}K
                              </button>
                            ))}
                          </div>

                          <button
                            type="button"
                            disabled={userRestriction?.restricted}
                            onClick={() => {
                              setCheckoutAuction(auction);
                              setCheckoutStep(1);
                              setCheckoutMethod('card');
                              setCheckoutCardNumber('');
                              setCheckoutCardExpiry('');
                              setCheckoutCardCvv('');
                              setCheckoutFullName(currentUser?.displayName || '');
                              setCheckoutEmail(currentUser?.email || '');
                              setCheckoutPhone(currentUser?.phoneNumber || '');
                              setCheckoutAddress('');
                              setIsPaymentPortalOpen(false);
                            }}
                            className="w-full py-4.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white font-black uppercase text-xs tracking-[0.2em] rounded-xl flex items-center justify-center gap-2 shadow-xl hover:shadow-amber-100 transition-all active:scale-95 mt-4"
                          >
                            <Zap className="w-4 h-4 text-amber-300 animate-pulse" /> Buy Now: ₦{Math.round((auction.startPrice || auction.currentBid) * 1.25).toLocaleString()}
                          </button>

                          {/* Copart-style Real-time Bidding Activity Ledger */}
                          {bidsByAuction[auction.id] && bidsByAuction[auction.id].length > 0 && (
                            <div className="space-y-3 bg-slate-50/50 rounded-2xl p-4 border border-dashed border-slate-200 mt-4">
                              <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                                <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider flex items-center gap-1.5 font-mono">
                                  <span className="h-2 w-2 rounded-full bg-indigo-500 animate-ping inline-block shrink-0" />
                                  Live Bidding Stream ({bidsByAuction[auction.id].length})
                                </span>
                                <span className="text-[9px] font-mono text-slate-400">Copart-Standard Ledger</span>
                              </div>
                              
                              <div className="max-h-40 overflow-y-auto space-y-2.5 pr-1 font-mono text-xs">
                                {bidsByAuction[auction.id].slice(0, 5).map((bidItem, idx) => {
                                  const bidDate = bidItem.createdAt ? new Date(bidItem.createdAt) : null;
                                  return (
                                    <motion.div 
                                      initial={{ opacity: 0, x: -10 }}
                                      animate={{ opacity: 1, x: 0 }}
                                      key={`bid-${auction.id}-${bidItem.id || idx}-${idx}`}
                                      className="flex items-center justify-between leading-none p-2.5 bg-white border border-slate-100 rounded-xl shadow-xs"
                                    >
                                      <div className="flex items-center gap-2">
                                        <div className="h-6 w-6 rounded-full bg-slate-100 flex items-center justify-center text-[10px] font-bold text-slate-650 font-mono">
                                          #{idx + 1}
                                        </div>
                                        <div className="text-left">
                                          <span className="font-extrabold text-slate-800 uppercase block leading-tight">
                                            {bidItem.bidderId === currentUser?.uid ? "You (Client)" : (bidItem.bidderName || "VIP Bidder")}
                                          </span>
                                          <span className="text-[9px] text-slate-400 flex items-center gap-0.5 mt-1 font-sans leading-none">
                                            <MapPin className="w-2.5 h-2.5 text-indigo-500 shrink-0" />
                                            {bidItem.location || "Online"}
                                          </span>
                                        </div>
                                      </div>
                                      <div className="text-right">
                                        <span className="font-black text-indigo-600 block text-[12px] leading-tight">
                                          ₦{bidItem.amount?.toLocaleString()}
                                        </span>
                                        <span className="text-[8px] text-slate-400 mt-0.5 block leading-none">
                                          {bidDate ? bidDate.toLocaleTimeString() : "Just Now"}
                                        </span>
                                      </div>
                                    </motion.div>
                                  );
                                })}
                              </div>
                            </div>
                          )}

                          {userRestriction?.restricted && (
                            <p className="text-[10px] font-bold text-red-500 text-center uppercase tracking-tight">Your access is currently frozen. Pay fine to restore bidding access.</p>
                          )}
                        </div>
                      ) : (
                        <div className="space-y-4 pt-4 border-t border-slate-100">
                          {isWinner ? (
                            // STRICT RULE Flow: "When the timer ends, the highest bidder sees a 'Winner' screen instructing them to call a specific phone number"
                            <motion.div 
                              initial={{ opacity: 0, scale: 0.95 }}
                              animate={{ opacity: 1, scale: 1 }}
                              className="bg-emerald-50 border border-emerald-100 p-6 rounded-3xl text-center space-y-5 shadow-lg"
                            >
                              <div className="w-14 h-14 bg-emerald-500 text-white rounded-2xl flex items-center justify-center mx-auto shadow-md animate-bounce">
                                <Award className="w-7 h-7" />
                              </div>
                              <div className="space-y-1.5">
                                <span className="text-[10px] font-black uppercase text-emerald-600 tracking-widest font-mono">Lot Secured • Pending Gate Pass</span>
                                <h4 className="text-xl font-black text-emerald-950 uppercase font-sans">Secured 🏆 You Won</h4>
                                <p className="text-[11px] text-emerald-700 leading-relaxed max-w-sm mx-auto">
                                  You are the highest bidder for this vehicle! To conclude structural AML inspection and arrange logistics, please connect with our admin immediately within 24 hours.
                                </p>
                              </div>
                              
                              <div className="bg-white/95 border border-emerald-200/50 rounded-2xl p-4 text-left space-y-2.5 shadow-sm text-xs">
                                <div className="flex justify-between items-center text-xs font-mono border-b border-slate-100 pb-2">
                                  <span className="text-slate-400 font-bold uppercase text-[9px]">Sale Status</span>
                                  <span className="text-emerald-700 font-extrabold uppercase text-[10px] bg-emerald-100 px-2 py-0.5 rounded-md">Pending Approval</span>
                                </div>
                                <div className="flex justify-between items-center text-xs font-mono border-b border-slate-100 pb-2">
                                  <span className="text-slate-400 font-bold uppercase text-[9px]">Final Bid Value</span>
                                  <span className="text-slate-900 font-black">₦{auction.currentBid?.toLocaleString()}</span>
                                </div>
                                <div className="flex justify-between items-center text-xs font-mono border-b border-slate-100 pb-2">
                                  <span className="text-slate-400 font-bold uppercase text-[9px]">Bidding Origin</span>
                                  <span className="text-indigo-650 font-black uppercase flex items-center gap-0.5">
                                    <MapPin className="w-3 h-3 text-indigo-500" /> {auction.highestBidderLocation || biddingLocationState}
                                  </span>
                                </div>
                                <div className="flex justify-between items-center text-xs font-mono pb-0.5">
                                  <span className="text-slate-400 font-bold uppercase text-[9px]">Dispatch Destination</span>
                                  <span className="text-indigo-650 font-black uppercase flex items-center gap-0.5">
                                    {biddingLocationState} Yard
                                  </span>
                                </div>
                              </div>

                              {/* Copart Shipment Milestones checklist */}
                              <div className="text-left bg-white/70 border border-slate-150 rounded-2xl p-4 space-y-3 shadow-xs">
                                <h5 className="text-[10px] font-black uppercase text-slate-400 tracking-wider font-mono">Lot Dispatch Milestones</h5>
                                
                                <div className="flex gap-2.5 items-start">
                                  <div className="h-5 w-5 rounded-full bg-emerald-500 text-white flex items-center justify-center text-[9px] font-bold shrink-0 mt-0.5">✓</div>
                                  <div>
                                    <p className="text-[10.5px] font-bold text-slate-800 uppercase leading-none">Bid Awarded</p>
                                    <p className="text-[9px] text-slate-500 mt-1">Lot acquired from corporate liquidator. Outstanding title transfer verified.</p>
                                  </div>
                                </div>

                                <div className="flex gap-2.5 items-start">
                                  <div className="h-5 w-5 rounded-full bg-amber-500 text-white flex items-center justify-center text-[9px] font-black shrink-0 mt-0.5 animate-pulse">2</div>
                                  <div>
                                    <p className="text-[10.5px] font-bold text-slate-800 uppercase leading-none">Clearing and Gate Pass</p>
                                    <p className="text-[9px] text-slate-500 mt-1">Pending wire clearance & document handover certification.</p>
                                  </div>
                                </div>

                                <div className="flex gap-2.5 items-start">
                                  <div className="h-5 w-5 rounded-full bg-slate-100 text-slate-400 border border-slate-200 flex items-center justify-center text-[9px] font-bold shrink-0 mt-0.5">3</div>
                                  <div>
                                    <p className="text-[10.5px] font-bold text-slate-400 uppercase leading-none">Carrier Dispatch</p>
                                    <p className="text-[9px] text-slate-400 mt-1">Flatbed shipping loader to travel directly to {biddingLocationState} Facility.</p>
                                  </div>
                                </div>
                              </div>

                              <a 
                                href="tel:+2348138642942"
                                className="w-full bg-emerald-600 hover:bg-emerald-700 text-white py-4 px-4 rounded-xl text-xs font-black uppercase tracking-widest flex items-center justify-center gap-2 shadow-lg shadow-emerald-100 transition-all font-sans"
                              >
                                <Phone className="w-4 h-4 shrink-0" /> Call Concierge (+234 813 864 2942)
                              </a>
                            </motion.div>
                          ) : (
                            <div className="text-center py-4 bg-slate-50 rounded-xl border">
                              <p className="text-xs font-bold text-slate-800">
                                {auction.status === 'paid' ? "Auction Concluded & Settled" : "Auction Concluded"}
                              </p>
                              <p className="text-[10px] text-slate-400 uppercase tracking-widest mt-1">
                                Winning bid: ₦{auction.currentBid?.toLocaleString()} by {auction.highestBidderId === currentUser?.uid ? "You" : (auction.highestBidderName || "Default bidder")} {auction.highestBidderLocation && `(Bidding from: ${auction.highestBidderLocation})`}
                              </p>
                            </div>
                          )}

                          {/* Admin post-conclude settling tools */}
                          {isAdmin && (auction.status === 'active' || isConcluded) && (
                            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-3">
                              <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest block">ADMIN SETTLEMENT ACTIONS</label>
                              <div className="flex gap-2">
                                <button
                                  type="button"
                                  onClick={() => handleMarkPaid(auction)}
                                  disabled={auction.status === 'paid'}
                                  className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white text-[10px] font-bold uppercase tracking-wider rounded-lg transition-all"
                                >
                                  Mark as Paid
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleMarkUnpaid(auction)}
                                  disabled={auction.status === 'unpaid' || !auction.highestBidderId}
                                  className="flex-1 py-2.5 bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white text-[10px] font-bold uppercase tracking-wider rounded-lg transition-all"
                                >
                                  Winner Defaulted
                                </button>
                              </div>
                            </div>
                          )}

                          {/* Admin relisting date selector for concluded auctions */}
                          {isAdmin && isConcluded && auction.status !== 'paid' && (
                            <div className="bg-slate-50 p-5 rounded-2xl border border-amber-200 mt-4 space-y-4 shadow-sm">
                              <div className="flex items-center gap-2">
                                <RefreshCw className="w-4 h-4 text-amber-500 animate-[spin_4s_linear_infinite]" />
                                <span className="text-[10px] font-black uppercase tracking-widest text-amber-700 font-sans">
                                  Relist Concluded Vehicle
                                </span>
                              </div>
                              <p className="text-[10px] text-slate-500 leading-normal font-sans">
                                Public bidding has ended for this vehicle. Set a new scheduled date and time below to relist and start a brand-new bidding cycle.
                              </p>
                              
                              <div className="space-y-1.5">
                                <label className="text-[9.5px] font-black uppercase tracking-wider text-slate-400 block">Select Relisting End Date & Time</label>
                                <input 
                                  type="datetime-local" 
                                  value={relistDates[auction.id] || ''}
                                  onChange={(e) => setRelistDates(prev => ({ ...prev, [auction.id]: e.target.value }))}
                                  className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-mono font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-500"
                                />
                              </div>

                              <button
                                type="button"
                                disabled={relistingIds[auction.id]}
                                onClick={async () => {
                                  const targetDateStr = relistDates[auction.id];
                                  if (!targetDateStr) {
                                    alert("❌ Please select a date and time for relisting.");
                                    return;
                                  }
                                  setRelistingIds(prev => ({ ...prev, [auction.id]: true }));
                                  await handleRelistAuction(auction, new Date(targetDateStr).toISOString());
                                  setRelistingIds(prev => ({ ...prev, [auction.id]: false }));
                                }}
                                className="w-full py-3.5 bg-amber-600 hover:bg-slate-900 disabled:opacity-50 text-white text-[10.5px] font-black uppercase tracking-[0.15em] rounded-xl flex items-center justify-center gap-2 shadow-md hover:shadow-amber-500/10 transition-all active:scale-95"
                              >
                                {relistingIds[auction.id] ? "Relisting Vehicle..." : "Relist now with date ➔"}
                              </button>
                            </div>
                          )}
                        </div>
                      )}

                    </div>
                  </motion.div>
                );
              })}
            </div>
          )}
        </div>
      )}
        </>
      )}

      {/* Interactive Paystack/Flutterwave Fine Settlement Gateway Modal */}
      <AnimatePresence>
        {isPaymentPortalOpen && (
          <div className="fixed inset-0 z-[120] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-slate-950/60 backdrop-blur-sm"
              onClick={() => setIsPaymentPortalOpen(false)}
            />
            
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl overflow-hidden border border-slate-100 font-sans"
            >
              <div className={`p-6 text-white flex items-center justify-between ${
                portalGateway === 'paystack' ? "bg-emerald-950" : "bg-blue-950"
              }`}>
                <div className="flex items-center gap-2.5">
                  <div className={`p-1.5 rounded-lg ${portalGateway === 'paystack' ? "bg-emerald-500/10 text-emerald-400" : "bg-blue-500/10 text-blue-400"}`}>
                    <ShieldCheck className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-xs font-black uppercase tracking-[0.2em]">{portalGateway.toUpperCase()} SECURE GATEWAY</h3>
                    <p className="text-[9px] opacity-60 uppercase font-black tracking-tight mt-0.5">Accounts fine verification point</p>
                  </div>
                </div>
                <button 
                  onClick={() => setIsPaymentPortalOpen(false)} 
                  className="text-slate-400 hover:text-white transition-colors text-xs font-mono"
                >
                  [Esc]
                </button>
              </div>

              <div className="p-8">
                <AnimatePresence mode="wait">
                  {paymentPortalStep === 1 && (
                    <motion.div 
                      key="portal-step-1" 
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -20 }}
                      className="space-y-6"
                    >
                      <div className="p-4 bg-slate-50 border rounded-2xl text-center space-y-1">
                        <span className="text-[9px] font-black uppercase text-slate-400 tracking-widest block">settling outstanding charge</span>
                        <h4 className="text-xl font-bold text-slate-800">Bidding Access Restoration</h4>
                        <p className="text-2xl font-black italic text-slate-900 mt-2">₦50,000.00</p>
                      </div>

                      <div className="space-y-4">
                        <div className="space-y-1">
                          <Label className="text-xs font-bold text-slate-700">Credit Card Number</Label>
                          <Input 
                            value={cardNumber} 
                            onChange={(e) => setCardNumber(e.target.value.replace(/\s?/g, '').replace(/(\d{4})/g, '$1 ').trim())} 
                            placeholder="0000 0000 0000 0000" 
                            maxLength={19}
                            className="border-2 text-center font-mono placeholder:font-sans"
                          />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-1">
                            <Label className="text-xs font-bold text-slate-700">Expiration Info</Label>
                            <Input 
                              value={cardExpiry} 
                              onChange={(e) => setCardExpiry(e.target.value)} 
                              placeholder="MM / YY" 
                              maxLength={7}
                              className="border-2 text-center font-mono"
                            />
                          </div>
                          <div className="space-y-1">
                            <Label className="text-xs font-bold text-slate-700">Security CVV</Label>
                            <Input 
                              value={cardCvv} 
                              onChange={(e) => setCardCvv(e.target.value)} 
                              placeholder="123" 
                              maxLength={3}
                              type="password"
                              className="border-2 text-center font-mono"
                            />
                          </div>
                        </div>
                      </div>

                      <button
                        onClick={executeFinePayment}
                        className={`w-full py-4 text-white text-xs font-black uppercase tracking-widest rounded-xl shadow-lg transition-all ${
                          portalGateway === 'paystack' 
                            ? "bg-emerald-600 hover:bg-emerald-700 shadow-emerald-100" 
                            : "bg-blue-600 hover:bg-blue-700 shadow-blue-100"
                        }`}
                      >
                        Authorize fine settlement
                      </button>
                    </motion.div>
                  )}

                  {paymentPortalStep === 2 || paymentLoading ? (
                    <motion.div 
                      key="portal-step-2" 
                      className="py-12 text-center space-y-6"
                    >
                      <div className="relative w-16 h-16 mx-auto">
                        <div className={`absolute inset-0 rounded-full border-4 opacity-10 ${
                          portalGateway === 'paystack' ? "border-emerald-600" : "border-blue-600"
                        }`} />
                        <div className={`absolute inset-0 rounded-full border-4 border-t-transparent animate-spin ${
                          portalGateway === 'paystack' ? "border-emerald-600" : "border-blue-600"
                        }`} />
                      </div>
                      <div>
                        <h4 className="text-base font-bold text-slate-900 leading-tight">Securing Channel Connection</h4>
                        <p className="text-xs text-slate-500 mt-2 leading-relaxed">
                          Synchronizing AML ledgers. Do not conclude, close or abort transaction page.
                        </p>
                      </div>
                    </motion.div>
                  ) : paymentPortalStep === 3 ? (
                    <motion.div 
                      key="portal-step-3" 
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="py-6 text-center space-y-6"
                    >
                      <div className="w-16 h-16 bg-emerald-50 rounded-full flex items-center justify-center mx-auto border border-emerald-100 shadow-inner">
                        <CheckCircle2 className="w-8 h-8 text-emerald-500" />
                      </div>
                      <div className="space-y-1 text-center">
                        <h4 className="text-lg font-bold text-slate-900 leading-tight">Fine Settled • Access Restored</h4>
                        <p className="text-xs text-slate-500 max-w-xs mx-auto mt-2">
                          Restoration transaction keys deployed successfully to global directory. Your bidding freeze is now completely lifted.
                        </p>
                      </div>

                      <button
                        onClick={() => {
                          setIsPaymentPortalOpen(false);
                          handlePayFineSuccess();
                        }}
                        className="w-full py-4 bg-slate-900 hover:bg-emerald-600 text-white text-xs font-black uppercase tracking-widest rounded-xl shadow-lg transition-colors"
                      >
                        Conclude Settlement
                      </button>
                    </motion.div>
                  ): null}
                </AnimatePresence>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Dynamic Buy Now Checkout Secure Gateway Modal */}
      <AnimatePresence>
        {checkoutAuction && (
          <div className="fixed inset-0 z-[120] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-slate-950/60 backdrop-blur-sm"
              onClick={() => setCheckoutAuction(null)}
            />
            
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="relative w-full max-w-4xl bg-white rounded-3xl shadow-2xl overflow-hidden border border-slate-100 font-sans"
            >
              <div className="p-6 text-white bg-slate-950 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="p-1.5 rounded-lg bg-indigo-500/10 text-indigo-400">
                    <ShieldCheck className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-xs font-black uppercase tracking-[0.2em]">SECURE BUYOUT GATEWAY</h3>
                    <p className="text-[9px] opacity-60 uppercase font-black tracking-tight mt-0.5">Asset instant checkout terminal</p>
                  </div>
                </div>
                <button 
                  onClick={() => setCheckoutAuction(null)} 
                  className="text-slate-400 hover:text-white transition-colors text-xs font-mono"
                >
                  [Esc]
                </button>
              </div>

              <div className="p-6 md:p-8">
                <AnimatePresence mode="wait">
                  {checkoutStep === 1 && (
                    <motion.div 
                      key="checkout-step-1" 
                      initial={{ opacity: 0, y: 15 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -15 }}
                      className="space-y-6"
                    >
                      <div className="p-4 bg-slate-50 border rounded-2xl text-center space-y-1 text-slate-900">
                        <span className="text-[9px] font-black uppercase text-slate-400 tracking-widest block">Acquiring Distressed Asset</span>
                        <h4 className="text-base font-bold text-slate-800 truncate max-w-2xl mx-auto">{checkoutAuction.title}</h4>
                        <div className="flex flex-col sm:flex-row items-center justify-center gap-2 sm:gap-4 text-xs font-mono mt-1 text-slate-500">
                          <span>VIN: {checkoutAuction.vin || "NOT REGISTERED"}</span>
                          <span className="hidden sm:inline w-1.5 h-1.5 rounded-full bg-slate-300" />
                          <span className="font-sans font-black text-slate-900 text-sm">₦{Math.round((checkoutAuction.startPrice || checkoutAuction.currentBid) * 1.25).toLocaleString()}</span>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
                        {/* LEFT COLUMN: Shipping & Coordinates */}
                        <div className="space-y-4 text-left">
                          <p className="text-[10px] font-black uppercase text-indigo-600 tracking-widest block border-b pb-2">1. Delivery coordinates & contact details</p>
                          
                          <div className="space-y-1">
                            <Label className="text-[11px] font-bold text-slate-700">Full Name</Label>
                            <Input 
                              value={checkoutFullName} 
                              onChange={(e) => setCheckoutFullName(e.target.value)} 
                              placeholder="E.g., Tahir Ismail" 
                              className="border-2 text-xs text-slate-850 font-sans bg-white"
                              required
                            />
                          </div>

                          <div className="space-y-1">
                            <Label className="text-[11px] font-bold text-slate-700">Contact Email (for notification)</Label>
                            <Input 
                              value={checkoutEmail} 
                              onChange={(e) => setCheckoutEmail(e.target.value)} 
                              placeholder="itztahirismail@gmail.com" 
                              type="email"
                              className="border-2 text-xs text-slate-850 font-sans bg-white"
                              required
                            />
                          </div>

                          <div className="space-y-1">
                            <Label className="text-[11px] font-bold text-slate-700">WhatsApp Phone Number</Label>
                            <Input 
                              value={checkoutPhone} 
                              onChange={(e) => setCheckoutPhone(e.target.value)} 
                              placeholder="E.g., +234 813 864 2942" 
                              type="tel"
                              className="border-2 text-xs text-slate-850 font-sans bg-white"
                              required
                            />
                          </div>

                          <div className="space-y-1">
                            <Label className="text-[11px] font-bold text-slate-700">Delivery Address</Label>
                            <textarea 
                              value={checkoutAddress} 
                              onChange={(e) => setCheckoutAddress(e.target.value)} 
                              placeholder="Enter physical destination address..." 
                              className="w-full h-24 p-3 text-xs border-2 text-slate-850 rounded-xl focus:border-indigo-600 focus:outline-none focus:ring-0 font-sans bg-white resize-none"
                              required
                            />
                          </div>
                        </div>

                        {/* RIGHT COLUMN: Payment system */}
                        <div className="space-y-4 text-left">
                          <p className="text-[10px] font-black uppercase text-indigo-600 tracking-widest block border-b pb-2">2. Secure Checkout Payment gateway</p>
                          
                          <div className="grid grid-cols-2 gap-3">
                            <button 
                              type="button"
                              onClick={() => setCheckoutMethod('card')}
                              className={`p-3 rounded-xl flex flex-col items-center justify-center border transition-all ${
                                checkoutMethod === 'card' ? "bg-indigo-50/50 border-indigo-600 ring-2 ring-indigo-600/10" : "bg-white border-slate-200 hover:border-slate-300"
                              }`}
                            >
                              <Coins className="w-5 h-5 text-indigo-600 mb-1" />
                              <span className="text-xs font-bold text-slate-850">Card Payment</span>
                              <span className="text-[8px] text-slate-400 font-mono mt-0.5">VISA / Verve</span>
                            </button>

                            <button 
                              type="button"
                              onClick={() => setCheckoutMethod('transfer')}
                              className={`p-3 rounded-xl flex flex-col items-center justify-center border transition-all ${
                                checkoutMethod === 'transfer' ? "bg-indigo-50/50 border-indigo-600 ring-2 ring-indigo-600/10" : "bg-white border-slate-200 hover:border-slate-300"
                              }`}
                            >
                              <Coins className="w-5 h-5 text-emerald-600 mb-1" />
                              <span className="text-xs font-bold text-slate-850">Bank Transfer</span>
                              <span className="text-[8px] text-slate-400 font-mono mt-0.5">Manual Account</span>
                            </button>
                          </div>

                          {checkoutMethod === 'card' ? (
                            <div className="space-y-4 bg-slate-50/70 p-4 rounded-2xl border border-slate-100">
                              <div className="space-y-1">
                                <Label className="text-xs font-bold text-slate-700">Credit Card Number</Label>
                                <Input 
                                  value={checkoutCardNumber} 
                                  onChange={(e) => setCheckoutCardNumber(e.target.value.replace(/\s?/g, '').replace(/(\d{4})/g, '$1 ').trim())} 
                                  placeholder="0000 0000 0000 0000" 
                                  maxLength={19}
                                  className="border-2 text-center font-mono placeholder:font-sans bg-white text-slate-800"
                                />
                              </div>
                              <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1">
                                  <Label className="text-xs font-bold text-slate-700">Expiration Info</Label>
                                  <Input 
                                    value={checkoutCardExpiry} 
                                    onChange={(e) => setCheckoutCardExpiry(e.target.value)} 
                                    placeholder="MM / YY" 
                                    maxLength={7}
                                    className="border-2 text-center font-mono bg-white text-slate-800"
                                  />
                                </div>
                                <div className="space-y-1">
                                  <Label className="text-xs font-bold text-slate-700">Security CVV</Label>
                                  <Input 
                                    value={checkoutCardCvv} 
                                    onChange={(e) => setCheckoutCardCvv(e.target.value)} 
                                    placeholder="123" 
                                    maxLength={3}
                                    type="password"
                                    className="border-2 text-center font-mono bg-white text-slate-800"
                                  />
                                </div>
                              </div>
                            </div>
                          ) : (
                            <div className="bg-slate-900 rounded-2xl p-5 text-white text-left space-y-4 relative overflow-hidden shadow-inner">
                              <div className="absolute right-0 top-0 translate-x-1/4 -translate-y-1/4 w-32 h-32 bg-indigo-500/10 rounded-full blur-2xl pointer-events-none" />
                              <p className="text-[10px] text-indigo-300 uppercase tracking-widest font-black">Uncle Tee Liquidation Account</p>
                              <div className="space-y-2.5 font-mono">
                                <div>
                                  <p className="text-[9px] opacity-60">BANK INSTITUTION</p>
                                  <p className="text-xs font-bold text-indigo-400">Kuda Bank</p>
                                </div>
                                <div>
                                  <p className="text-[9px] opacity-60">ACCOUNT IDENTIFIER</p>
                                  <p className="text-lg font-bold tracking-wider text-white">2019667940</p>
                                </div>
                                <div>
                                  <p className="text-[9px] opacity-60">ACCOUNT TITLE</p>
                                  <p className="text-xs font-bold text-indigo-400">Tahir Ismail</p>
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="flex gap-2 pt-2">
                        <button
                          type="button"
                          onClick={() => setCheckoutAuction(null)}
                          className="w-1/4 py-4 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold uppercase tracking-widest rounded-xl transition-all"
                        >
                          Cancel
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            if (!checkoutFullName.trim() || !checkoutEmail.trim() || !checkoutPhone.trim() || !checkoutAddress.trim()) {
                              alert("Please fill in all delivery details and contact coordinates to confirm.");
                              return;
                            }
                            if (checkoutMethod === 'card' && (!checkoutCardNumber || !checkoutCardExpiry || !checkoutCardCvv)) {
                              alert("Please enter card digits and credential metadata to authorize payment.");
                              return;
                            }
                            setCheckoutLoading(true);
                            setCheckoutStep(3);
                            setTimeout(() => {
                              setCheckoutLoading(false);
                              setCheckoutStep(4);
                              handleBuyNowSuccess(checkoutAuction);
                            }, 2500);
                          }}
                          className="flex-1 py-4 bg-indigo-600 hover:bg-slate-900 text-white text-xs font-black uppercase tracking-[0.2em] rounded-xl shadow-xl hover:shadow-indigo-500/15 transition-all active:scale-[0.98] flex items-center justify-center gap-2"
                        >
                          Confirm Buyout & Pay ➔
                        </button>
                      </div>
                    </motion.div>
                  )}

                  {(checkoutStep === 3 || checkoutLoading) && (
                    <motion.div 
                      key="checkout-step-3" 
                      className="py-12 text-center space-y-6"
                    >
                      <div className="relative w-16 h-16 mx-auto">
                        <div className="absolute inset-0 rounded-full border-4 border-indigo-600 opacity-10" />
                        <div className="absolute inset-0 rounded-full border-4 border-indigo-600 border-t-transparent animate-spin" />
                      </div>
                      <div>
                        <h4 className="text-base font-bold text-slate-900 leading-tight">Securing Asset Allocation</h4>
                        <p className="text-xs text-slate-500 mt-2 leading-relaxed">
                          Processing direct buyout. Your VIP acquisition is being registered on secure ledgers.
                        </p>
                      </div>
                    </motion.div>
                  )}

                  {checkoutStep === 4 && (
                    <motion.div 
                      key="checkout-step-4" 
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="py-5 text-center space-y-6 font-sans text-slate-900"
                    >
                      <div className="w-16 h-16 bg-emerald-50 rounded-full flex items-center justify-center mx-auto border border-emerald-100 shadow-inner">
                        <CheckCircle2 className="w-8 h-8 text-emerald-500" />
                      </div>
                      <div className="space-y-1">
                        <h4 className="text-lg font-bold text-slate-900 leading-none">Asset Acquired!</h4>
                        <p className="text-xs text-slate-500 max-w-xs mx-auto mt-2 leading-relaxed">
                          Your purchase receipt and VIP transport logistics plan have been drafted. Connect with Uncle Tee immediately via email or WhatsApp!
                        </p>
                      </div>

                      <div className="p-4 bg-slate-50 border rounded-2xl text-left space-y-2 font-sans text-xs">
                        <p><strong className="text-slate-500">Winner Client:</strong> {checkoutFullName}</p>
                        <p><strong className="text-slate-500">Verified Email:</strong> {checkoutEmail}</p>
                        <p><strong className="text-slate-500">Phone Signal:</strong> {checkoutPhone}</p>
                        <p><strong className="text-slate-500">VIP Destination:</strong> {checkoutAddress}</p>
                      </div>

                      <div className="grid grid-cols-1 gap-2.5">
                        <a 
                          href={`https://wa.me/2348138642942?text=${encodeURIComponent(
                            `Hello Uncle Tee! I just completed a Buy Now for "${checkoutAuction.title}". Here are my delivery coordinates:\n- Name: ${checkoutFullName}\n- Phone: ${checkoutPhone}\n- Email: ${checkoutEmail}\n- Address: ${checkoutAddress}\n\nPlease confirm my VIP shipping!`
                          )}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="w-full bg-emerald-600 hover:bg-emerald-700 text-white py-3.5 px-4 rounded-xl text-xs font-black uppercase tracking-widest flex items-center justify-center gap-2 shadow-lg transition-colors"
                        >
                          <MessageCircle className="w-4 h-4 shrink-0" /> Dispatch WhatsApp Details
                        </a>
                        <a 
                          href="tel:+2348138642942"
                          className="w-full bg-slate-100 hover:bg-slate-200 text-slate-800 py-3 px-4 rounded-xl text-xs font-bold uppercase tracking-widest flex items-center justify-center gap-2 transition-all"
                        >
                          <Phone className="w-4 h-4 shrink-0" /> Call Direct Concierge
                        </a>
                      </div>

                      <button
                        onClick={() => {
                          setCheckoutAuction(null);
                        }}
                        className="w-full py-4 bg-slate-900 hover:bg-indigo-600 text-white text-xs font-black uppercase tracking-widest rounded-xl shadow-lg transition-colors"
                      >
                        Done
                      </button>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}
