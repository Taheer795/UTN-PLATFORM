/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect } from 'react';
import Navigation from '@/src/components/Navigation';
import SidebarContent from '@/src/components/SidebarContent';
import SiloSwitcher, { SiloType } from '@/src/components/SiloSwitcher';
import SplashScreen from '@/src/components/SplashScreen';
import ListingCard from '@/src/components/ListingCard';
import ListingForm from '@/src/components/ListingForm';
import JerseyStudio from '@/src/components/JerseyStudio';
import GarageHub from '@/src/components/GarageHub';
import ChatBox from '@/src/components/ChatBox';
import PaymentModal from '@/src/components/PaymentModal';
import DistressBidding from '@/src/components/DistressBidding';
import { LiveBiddingBanner } from '@/src/components/LiveBiddingBanner';
import SocialFunnelModal from '@/src/components/SocialFunnelModal';
import AboutUs from '@/src/components/AboutUs';
import ProfileSettings from '@/src/components/ProfileSettings';
import TransactionHub from '@/src/components/TransactionHub';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { 
  Plus, 
  SlidersHorizontal, 
  Zap, 
  LayoutGrid, 
  List as ListIcon, 
  Trash2, 
  CreditCard, 
  CheckCircle2, 
  X, 
  Settings, 
  Instagram, 
  MessageCircle, 
  Music2, 
  ShoppingBag,
  Car,
  Wifi,
  WifiOff,
  AlertTriangle,
  ShieldAlert,
  Users,
  PackageCheck,
  ShoppingCart,
  Mail,
  ChevronDown,
  ChevronUp,
  Search,
  FileText,
  Copy
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Dialog, DialogContent, DialogTrigger } from '@/components/ui/dialog';
import { cn, getUtnTag } from '@/src/lib/utils';
import { CategoryType } from '@/src/types';
import { generateDeliveryEmail } from '@/src/services/geminiService';
import { auth, db, handleFirestoreError, OperationType, signInWithGoogle } from '@/src/lib/firebase';
import Markdown from 'react-markdown';
import { onAuthStateChanged, User } from 'firebase/auth';
import { 
  collection, 
  onSnapshot, 
  query, 
  where, 
  addDoc, 
  deleteDoc, 
  doc, 
  updateDoc, 
  serverTimestamp, 
  setDoc,
  getDoc,
  orderBy,
  limit,
  getDocFromServer,
  or
} from 'firebase/firestore';

async function testConnection() {
  // Already handled in lib/firebase.ts
}
testConnection();

const MOCK_APPAREL = [
  { 
    id: '1589141034901-d10231b21bd6', 
    title: 'Vintage Silk Evening Dress', 
    price: 1250, 
    apparelDetails: { brand: 'HERMÈS', size: 'M', condition: 'Mint' },
    images: [{ url: 'https://images.unsplash.com/photo-1539109132332-945739ef1f31?auto=format&fit=crop&w=800&q=80' }]
  },
  { 
    id: '1539106723-6444b9903361', 
    title: 'Limited Edition Sneakers', 
    price: 950, 
    apparelDetails: { brand: 'OFF-WHITE', size: '10', condition: 'Brand New' },
    images: [{ url: 'https://images.unsplash.com/photo-1552346154-21d32810aba3?auto=format&fit=crop&w=800&q=80' }]
  },
  { 
    id: '1548883354-931061f43501', 
    title: 'Cashmere Winter Coat', 
    price: 2100, 
    apparelDetails: { brand: 'LORO PIANA', size: 'L', condition: 'Gently Used' },
    images: [{ url: 'https://images.unsplash.com/photo-1591047139829-d91aecb6caea?auto=format&fit=crop&w=800&q=80' }]
  },
];

const MOCK_AUTOS = [
  { 
    id: '1503376780353-7e6692767b70', 
    title: '911 Carrera S (992)', 
    price: 142000, 
    autoDetails: { year: 2023, make: 'PORSCHE', mileage: 1200, transmission: 'PDK', fuelType: 'Petrol' },
    images: [{ url: 'https://images.unsplash.com/photo-1503376780353-7e6692767b70?auto=format&fit=crop&w=800&q=80' }]
  },
  { 
    id: '1614162486245-03932e676100', 
    title: 'Huracán STO', 
    price: 425000, 
    autoDetails: { year: 2022, make: 'LAMBORGHINI', mileage: 450, transmission: 'Auto', fuelType: 'Petrol' },
    images: [{ url: 'https://images.unsplash.com/photo-1621135802920-133df287f89c?auto=format&fit=crop&w=800&q=80' }]
  },
  { 
    id: '1567627477620-569cd185590c', 
    title: 'Defender 110 V8', 
    price: 118000, 
    autoDetails: { year: 2024, make: 'LAND ROVER', mileage: 50, transmission: 'Auto', fuelType: 'Petrol' },
    images: [{ url: 'https://images.unsplash.com/photo-1605559424843-9e4c228bf1c2?auto=format&fit=crop&w=800&q=80' }]
  },
];

export type ViewType = 'store' | 'collection' | 'orders' | 'profile' | 'preferences' | 'security' | 'transactions' | 'bidding' | 'about' | 'admin';

const VIEW_ORDER: Record<string, number> = {
  store: 0,
  collection: 1,
  orders: 2,
  admin: 3,
  profile: 4,
  preferences: 5,
  security: 6,
  transactions: 7,
  bidding: 8,
  about: 9,
};

const ADMIN_EMAIL = 'Itztahirismail@gmail.com'.toLowerCase();

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [authReady, setAuthReady] = useState(false);
  const [activeSilo, setActiveSilo] = useState<SiloType>('wardrobe');
  const [currentView, setCurrentView] = useState<ViewType>('store');

  const isAdminUser = userRole === 'admin' || user?.email?.toLowerCase() === ADMIN_EMAIL;
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [showSplash, setShowSplash] = useState(true);
  const [authError, setAuthError] = useState<any | null>(null);

  // Guarantee that bidding silo always routes to bidding view
  useEffect(() => {
    if (currentView === 'store' && activeSilo === 'bidding') {
      setCurrentView('bidding');
    }
  }, [currentView, activeSilo]);

  useEffect(() => {
    const handleAuthError = (event: Event) => {
      const error = (event as CustomEvent).detail;
      setAuthError(error);
    };

    const handleLocalDemoUser = (event: Event) => {
      const mockUser = (event as CustomEvent).detail || {
        uid: 'demo_guest_user',
        email: 'guest-auctioneer@demo.internal',
        displayName: 'Guest Bidder',
        photoURL: null,
        isAnonymous: true,
        phoneNumber: '+2348123456789'
      };
      setUser(mockUser);
      setAuthReady(true);
      setAuthError(null);
      localStorage.setItem('local_backup_guest_user', JSON.stringify(mockUser));
    };

    // Load any saved guest user on component mount
    const savedUser = localStorage.getItem('local_backup_guest_user');
    if (savedUser) {
      try {
        const parsed = JSON.parse(savedUser);
        setUser(parsed);
        setAuthReady(true);
      } catch (e) {
        console.warn("Could not parse saved local backup user:", e);
      }
    }

    window.addEventListener('firebase-auth-error', handleAuthError);
    window.addEventListener('local-demo-login', handleLocalDemoUser as any);
    return () => {
      window.removeEventListener('firebase-auth-error', handleAuthError);
      window.removeEventListener('local-demo-login', handleLocalDemoUser as any);
    };
  }, []);

  const [imageUploadSize, setImageUploadSizeState] = useState<'original' | 'compressed'>(() => {
    const saved = localStorage.getItem('imageUploadSize');
    return (saved === 'original' || saved === 'compressed') ? saved : 'original';
  });

  const setImageUploadSize = (val: 'original' | 'compressed') => {
    setImageUploadSizeState(val);
    localStorage.setItem('imageUploadSize', val);
    window.dispatchEvent(new CustomEvent('imageUploadSizeChanged', { detail: val }));
  };

  useEffect(() => {
    const handleStorageChange = (e: any) => {
      const val = e.detail || localStorage.getItem('imageUploadSize');
      if (val === 'original' || val === 'compressed') {
        setImageUploadSizeState(val);
      }
    };
    window.addEventListener('imageUploadSizeChanged' as any, handleStorageChange);
    window.addEventListener('storage', handleStorageChange);
    return () => {
      window.removeEventListener('imageUploadSizeChanged' as any, handleStorageChange);
      window.removeEventListener('storage', handleStorageChange);
    };
  }, []);

  const [listings, setListings] = useState<any[]>([]);
  const [deletedAssetIds, setDeletedAssetIds] = useState<Set<string>>(new Set());
  const [renderNonce, setRenderNonce] = useState(0);
  const [garageScans, setGarageScans] = useState<any[]>([]);
  const [selectedScan, setSelectedScan] = useState<any>(null);

  // Connectivity and Synchronization Status State Engine
  const [isBrowserOnline, setIsBrowserOnline] = useState(typeof navigator !== 'undefined' ? navigator.onLine : true);
  const [isFirestoreSynced, setIsFirestoreSynced] = useState(true);
  const [wasOffline, setWasOffline] = useState(false);
  const [showConnectedToast, setShowConnectedToast] = useState(false);

  useEffect(() => {
    const handleOnline = () => setIsBrowserOnline(true);
    const handleOffline = () => setIsBrowserOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  useEffect(() => {
    if (!isBrowserOnline || !isFirestoreSynced) {
      setWasOffline(true);
    } else if (wasOffline) {
      setShowConnectedToast(true);
      const timer = setTimeout(() => {
        setShowConnectedToast(false);
        setWasOffline(false);
      }, 4000);
      return () => clearTimeout(timer);
    }
  }, [isBrowserOnline, isFirestoreSynced, wasOffline]);

  // Listen for garage scans (Admin sees ALL scans, user sees their own)
  useEffect(() => {
    if (!authReady) return;

    let q;
    if (isAdminUser) {
      q = query(collection(db, 'garage_scans'));
    } else if (user) {
      q = query(
        collection(db, 'garage_scans'), 
        where('userId', '==', user.uid)
      );
    } else {
      q = query(
        collection(db, 'garage_scans'), 
        orderBy('timestamp', 'desc'), 
        limit(5)
      );
    }

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const scans = snapshot.docs.map(doc => ({ ...(doc.data() as any), id: doc.id }));
      // Sort manually to avoid needing composite index for where + orderBy
      const sortedScans = scans.sort((a: any, b: any) => {
        const timeA = a.timestamp?.seconds || 0;
        const timeB = b.timestamp?.seconds || 0;
        return timeB - timeA;
      });
      setGarageScans(isAdminUser || user ? sortedScans : sortedScans.slice(0, 5));
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'garage_scans');
    });
    return () => unsubscribe();
  }, [user, isAdminUser, authReady]);

  useEffect(() => {
    // Hide splash screen after auth is ready and a small delay for smooth transition
    if (authReady) {
      const timer = setTimeout(() => setShowSplash(false), 800);
      return () => clearTimeout(timer);
    }
  }, [authReady]);
  const [showSocialFunnel, setShowSocialFunnel] = useState(false);
  const [cart, setCart] = useState<any[]>([]);
  const [activeFilter, setActiveFilter] = useState<'all' | 'new' | 'premium'>('all');
  const [activeCategory, setActiveCategory] = useState<CategoryType | 'all'>('all');
  const [adminConsoleTab, setAdminConsoleTab] = useState<'carts' | 'customers' | 'inventory' | 'vin_checks'>('carts');
  const [isRegistryLogsOpen, setIsRegistryLogsOpen] = useState(false);
  const [garageSearchQuery, setGarageSearchQuery] = useState('');

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (u) => {
      setUser(u);
      setAuthReady(true);
      if (u) {
        // Fetch user document from Firestore 'users' collection to set userRole
        const userRef = doc(db, 'users', u.uid);
        try {
          const userSnap = await getDoc(userRef);
          let fetchedRole = 'user';
          if (userSnap.exists()) {
            fetchedRole = userSnap.data()?.role || 'user';
          } else if (u.email?.toLowerCase() === ADMIN_EMAIL) {
            fetchedRole = 'admin';
          }
          setUserRole(fetchedRole);

          // Update user profile document in Firestore while preserving existing fields like 'role'
          await setDoc(userRef, {
            uid: u.uid,
            email: u.email,
            displayName: u.displayName,
            photoURL: u.photoURL,
            lastActiveAt: new Date().toISOString(),
            ...(userSnap.exists() ? {} : { createdAt: serverTimestamp(), role: fetchedRole })
          }, { merge: true });
        } catch (error) {
          console.warn("Could not fetch user role from Firestore:", error);
          const fallbackRole = u.email?.toLowerCase() === ADMIN_EMAIL ? 'admin' : 'user';
          setUserRole(fallbackRole);
        }
      } else {
        setUserRole(null);
      }
    });
    return () => unsubscribe();
  }, []);

  // Real-time listener for changes in user role in Firestore
  useEffect(() => {
    if (!user) {
      setUserRole(null);
      return;
    }
    const userRef = doc(db, 'users', user.uid);
    const unsubscribe = onSnapshot(userRef, (snap) => {
      if (snap.exists()) {
        const roleInDoc = snap.data()?.role;
        if (roleInDoc) {
          setUserRole(roleInDoc);
        }
      }
    }, (err) => {
      console.warn("User role snapshot error:", err);
    });
    return () => unsubscribe();
  }, [user]);

  // Route protection: If a regular user tries to navigate to /admin or view 'admin', automatically redirect to home page
  useEffect(() => {
    if (!authReady) return;

    const pathname = window.location.pathname;
    const isTargetingAdmin = pathname === '/admin' || pathname.startsWith('/admin') || currentView === 'admin';

    if (isTargetingAdmin && !isAdminUser) {
      if (window.location.pathname !== '/') {
        window.history.replaceState({}, '', '/');
      }
      if (currentView !== 'store') {
        setCurrentView('store');
      }
      setNotification({
        message: "Access restricted: /admin is reserved for administrators.",
        type: 'info'
      });
    }
  }, [authReady, isAdminUser, currentView, userRole]);

  // Real-time Listings
  useEffect(() => {
    if (!authReady) return;

    // Listen to the base listings collection directly to avoid complex multi-field 'or' query constraints inside the sandbox iframe (which require non-existent composite indexes)
    const q = query(collection(db, 'listings'));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      setIsFirestoreSynced(!snapshot.metadata.fromCache);
      const allData = snapshot.docs
        .map(doc => ({ ...(doc.data() as any), id: doc.id }))
        .filter(item => !deletedAssetIds.has(item.id));
      const adminEmail = ADMIN_EMAIL;
      
      let filteredData;
      if (user?.email?.toLowerCase() === adminEmail) {
        // Admin sees everything
        filteredData = allData;
      } else if (user) {
        // Logged-in user sees published items OR their own items
        filteredData = allData.filter((item: any) => 
          item.status === 'published' || item.sellerId === user.uid
        );
      } else {
        // Guests only see published items
        filteredData = allData.filter((item: any) => 
          item.status === 'published'
        );
      }
      
      // Sort: Cars (AUTOMOBILE category) show at the absolute top. Underneath, sort all by newest first.
      filteredData.sort((a: any, b: any) => {
        const aIsAuto = a.categoryType === 'AUTOMOBILE';
        const bIsAuto = b.categoryType === 'AUTOMOBILE';
        
        if (aIsAuto && !bIsAuto) return -1;
        if (!aIsAuto && bIsAuto) return 1;
        
        // Secondary sort: newest first
        const aTime = a.createdAt?.seconds ? a.createdAt.seconds * 1000 : (a.orderDate ? new Date(a.orderDate).getTime() : 0);
        const bTime = b.createdAt?.seconds ? b.createdAt.seconds * 1000 : (b.orderDate ? new Date(b.orderDate).getTime() : 0);
        return bTime - aTime;
      });
      
      setListings(filteredData);
    }, (error) => {
      console.error("Listings Snapshot Error:", error);
      handleFirestoreError(error, OperationType.LIST, 'listings');
    });
    return () => unsubscribe();
  }, [user, authReady, deletedAssetIds]);

  // Real-time Requests (Cart)
  useEffect(() => {
    if (!user) {
      setCart([]);
      return;
    }
    let q;
    if (isAdminUser) {
      q = query(collection(db, 'requests'));
    } else {
      q = query(collection(db, 'requests'), where('userId', '==', user.uid));
    }
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({ ...doc.data(), docId: doc.id }));
      // Sort manually for now
      setCart(data.sort((a: any, b: any) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0)));
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'requests');
    });
    return () => unsubscribe();
  }, [user, userRole]);

  const apparelList = listings.filter(l => 
    (l.siloType === 'wardrobe' || 
     [CategoryType.FABRICS, CategoryType.APPAREL, CategoryType.ACCESSORIES, CategoryType.FOOTWEAR, CategoryType.SEWING_SERVICES].includes(l.categoryType)) && 
    (isAdminUser || l.status === 'published' || !l.status || l.sellerId === user?.uid)
  );
  const autoList = listings.filter(l => 
    l.siloType === 'garage' && (isAdminUser || l.status === 'published' || !l.status || l.sellerId === user?.uid)
  );
  const jerseyList = listings.filter(l => 
    (l.siloType === 'jersey' || l.category === 'JERSEY' || l.categoryType === CategoryType.JERSEY) && 
    (isAdminUser || l.status === 'published' || !l.status || l.sellerId === user?.uid)
  );

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [listingFormInitialData, setListingFormInitialData] = useState<any>(null);
  const [checkoutItem, setCheckoutItem] = useState<any | null>(null);
  const [specifyingItem, setSpecifyingItem] = useState<any | null>(null);
  const [itemSpecs, setItemSpecs] = useState({ color: '', size: '', quantity: '1', phone: '', notes: '', address: '', fullName: '', email: '', customDeliveryDays: '' });
  const [deliveryPlan, setDeliveryPlan] = useState<string | null>(null);
  const [currentOrderPhone, setCurrentOrderPhone] = useState<string | null>(null);
  const [isGeneratingPlan, setIsGeneratingPlan] = useState(false);
  const [checkoutImmediate, setCheckoutImmediate] = useState(false);
  const [cachedPlans, setCachedPlans] = useState<Record<string, string>>({});
  const [notification, setNotification] = useState<{message: string, type: 'success' | 'info'} | null>(null);

  const isJerseySilo = activeSilo === 'jersey';

  const showComingSoon = (feature: string) => {
    setNotification({
      message: `${feature} module is coming soon`,
      type: 'info'
    });
  };

  useEffect(() => {
    if (notification) {
      const timer = setTimeout(() => setNotification(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [notification]);

  const handleOrderAction = async (item: any, customization?: any) => {
    setItemSpecs(prev => ({
      ...prev,
      fullName: user?.displayName || '',
      email: user?.email || '',
      ...customization
    }));
    setSpecifyingItem(item);
    setCheckoutImmediate(true);
  };

  const handleItemAction = async (
    item: any, 
    customizationInput?: any, 
    status: 'pending' | 'paid' = 'pending',
    isImmediateOverride?: boolean
  ) => {
    if (!user) {
      try {
        await signInWithGoogle();
      } catch (e) {
        console.error("Login failed", e);
      }
      return;
    }

    const isImmediate = isImmediateOverride !== undefined ? isImmediateOverride : checkoutImmediate;

    // Use customizationInput or itemSpecs appropriately
    // If customizationInput has fullName or address, it is actually the itemSpecs submitted from the specification form!
    const isFromForm = customizationInput && (customizationInput.fullName !== undefined || customizationInput.address !== undefined);
    const specsToUse = isFromForm ? customizationInput : itemSpecs;

    // Correctly define customization field
    let finalCustomization = null;
    if (isFromForm) {
      // Build a clean customization excluding the delivery details
      const { fullName, email, phone, address, customDeliveryDays, quantity, ...restCustomization } = customizationInput;
      if (Object.values(restCustomization).some(v => v !== '')) {
        finalCustomization = restCustomization;
      }
    } else {
      finalCustomization = customizationInput || item.customization || (Object.values(itemSpecs).some(v => v !== '' && v !== '1') ? itemSpecs : null);
    }

    const alreadyInCart = cart.find(c => c.listingId === item.id && JSON.stringify(c.customization) === JSON.stringify(finalCustomization));
    
    if (alreadyInCart && !customizationInput) { // Only prevent if no customization changes
      setNotification({
        message: `${item.title} is already queued`,
        type: 'info'
      });
      return;
    }

    const orderId = `TRN-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;
    const qty = parseInt(specsToUse.quantity || '1') || 1;
    const finalPrice = item.price * qty;

    const deliveryDaysStr = specsToUse.customDeliveryDays;
    const customDays = deliveryDaysStr !== undefined && deliveryDaysStr !== null && String(deliveryDaysStr).trim() !== '' ? parseInt(String(deliveryDaysStr)) : null;

    const newRequest: any = {
      orderId,
      listingId: item.id || 'studio-custom',
      userId: user.uid,
      title: item.title || 'Custom Project',
      sku: item.siloType === 'garage' ? (item.sku || item.autoDetails?.vin || '') : (customizationInput?.selectedUtnTag || specsToUse?.selectedUtnTag || getUtnTag(item)),
      price: finalPrice,
      siloType: item.siloType || activeSilo,
      status: status,
      customization: finalCustomization,
      deliveryDetails: item.deliveryDetails || (isImmediate ? { 
        fullName: specsToUse.fullName || user.displayName || '',
        email: specsToUse.email || user.email || '',
        address: specsToUse.address || '',
        phone: specsToUse.phone || ''
      } : null),
      orderDate: item.orderDate || new Date().toISOString(),
      createdAt: serverTimestamp()
    };

    if (customDays !== null && !isNaN(customDays)) {
      newRequest.customDeliveryDays = customDays;
    }

    try {
      const docRef = await addDoc(collection(db, 'requests'), newRequest);
      const message = status === 'paid' 
        ? `Order placed for ${item.title}`
        : activeSilo === 'garage' 
          ? `Inspection requested for ${item.title}` 
          : `${item.title} added to cart`;
      
      setNotification({
        message,
        type: 'success'
      });

      if (isImmediate) {
        setCheckoutItem({ ...newRequest, docId: docRef.id });
      }
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, 'requests');
    }
  };

  const handleConfirmSpecs = () => {
    if (specifyingItem) {
      const currentSpecs = { ...itemSpecs };
      const wasImmediate = checkoutImmediate;
      
      handleItemAction(specifyingItem, currentSpecs, 'pending', wasImmediate);
      setSpecifyingItem(null);
    }
  };

  const handleRemoveFromCart = async (docId: string) => {
    try {
      if (!user) {
        setNotification({
          message: "Please sign in to delete request log items",
          type: 'info'
        });
        return;
      }
      
      const item = cart.find(c => c.docId === docId);
      const isOwner = item && item.userId === user.uid;
      const isAdmin = isAdminUser;
      
      if (!isAdmin && !isOwner) {
        setNotification({
          message: "Permission denied: You can only remove your own requests",
          type: 'info'
        });
        return;
      }

      await deleteDoc(doc(db, 'requests', docId));
      setNotification({
        message: "Request removed from log",
        type: 'info'
      });
    } catch (error: any) {
      console.error("Remove from cart failed:", error);
      const isPermissionDenied = error?.code === 'permission-denied' || String(error).includes('permission-denied');
      setNotification({
        message: isPermissionDenied ? "Permission denied to remove request" : "Failed to remove request",
        type: 'info'
      });
    }
  };

  const handlePaymentSuccess = async (docId: string) => {
    const item = cart.find(c => c.docId === docId);
    if (!item) return;
    
    // Prevent multiple calls for the same submitted item
    if (item.status === 'payment_submitted' || item.status === 'paid') return;

    try {
      // Set status to 'payment_submitted' requiring admin confirmation
      await updateDoc(doc(db, 'requests', docId), { status: 'payment_submitted' });

      setNotification({
        message: "Payment submitted! We will approve order if payment is confirmed.",
        type: 'success'
      });

      // Show post-checkout social funnel modal popup
      setShowSocialFunnel(true);

    } catch (error: any) {
      console.error("Payment status update error:", error);
      try {
        await updateDoc(doc(db, 'requests', docId), { status: 'payment_submitted' });
        setNotification({
          message: "Payment submitted! We will approve order if payment is confirmed.",
          type: 'success'
        });
        setShowSocialFunnel(true);
      } catch (fallbackError) {
        handleFirestoreError(fallbackError, OperationType.UPDATE, `requests/${docId}`);
      }
    }
  };

  const handleAdminConfirmPayment = async (docId: string) => {
    const item = cart.find(c => c.docId === docId);
    if (!item) return;

    try {
      await updateDoc(doc(db, 'requests', docId), { status: 'paid' });

      fetch('/api/orders/trigger-confirmation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ docId, orderData: item })
      }).then(async (response) => {
        if (response.ok) {
          const resData = await response.json();
          if (resData.estimatedDeliveryDate) {
            await updateDoc(doc(db, 'requests', docId), {
              estimatedDeliveryDate: resData.estimatedDeliveryDate,
              customDeliveryDays: resData.customDeliveryDays !== undefined ? resData.customDeliveryDays : (item.customDeliveryDays || null)
            });
          }
        }
      }).catch(err => console.error("Admin trigger confirmation error:", err));

      setNotification({
        message: `Payment confirmed for Order #${item.orderId || 'TRN'}! Status marked as Paid.`,
        type: 'success'
      });
    } catch (error: any) {
      console.error("Failed to confirm payment:", error);
      handleFirestoreError(error, OperationType.UPDATE, `requests/${docId}`);
    }
  };

  const handleGeneratePlan = async (item: any) => {
    const phone = item.customization?.phone || item.deliveryDetails?.phone || null;
    console.log(`[Protocol] Item extracted phone:`, phone, item.customization, item.deliveryDetails);
    
    // Check cache first
    if (cachedPlans[item.orderId]) {
      setDeliveryPlan(cachedPlans[item.orderId]);
      setCurrentOrderPhone(phone);
      return;
    }

    setIsGeneratingPlan(true);
    setDeliveryPlan(null);
    setCurrentOrderPhone(phone);
    try {
      const plan = await generateDeliveryEmail({
        orderId: item.orderId,
        itemTitle: item.title,
        price: item.price,
        userName: user?.displayName || 'Customer',
        itemType: item.siloType,
        customization: item.customization
      });
      
      setDeliveryPlan(plan);
      setCachedPlans(prev => ({ ...prev, [item.orderId]: plan }));

      // Deliver protocol via multiple channels
      const phoneNumber = item.customization?.phone;

      // 1. Send actual email via server-side API
      if (user?.email) {
        fetch('/api/send-delivery-email', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            to: user.email,
            subject: `Protocol: Your Uncle Tee Delivery Plan #${item.orderId}`,
            html: `<div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
              ${plan.split('\n').map(line => line.startsWith('#') ? `<h2>${line.replace(/#/g, '')}</h2>` : `<p>${line}</p>`).join('')}
            </div>`,
            orderId: item.orderId
          })
        }).catch(e => console.error("Email send failed", e));
      }

      // 2. WhatsApp Notification (Triggered manually in UI or via link)
      // Since we don't have Twilio, we handle this through the UI with wa.me deep links
      
      setNotification({
        message: `Delivery Protocol Transmitted to Your Email`,
        type: 'info'
      });
    } catch (e) {
      console.error(e);
      setNotification({
        message: "Plan generated but transmission failed",
        type: 'info'
      });
    } finally {
      setIsGeneratingPlan(false);
    }
  };

  const handleDeleteAsset = async (id: string) => {
    try {
      if (!user) {
        setNotification({
          message: "Please sign in to delete inventory items",
          type: 'info'
        });
        return;
      }

      // 1. Clear Database Reference FIRST
      await deleteDoc(doc(db, 'listings', id));

      // 2. Frontend State Update after successful Firebase confirmation
      setDeletedAssetIds(prev => {
        const next = new Set(prev);
        next.add(id);
        return next;
      });
      setListings(prev => prev.filter(item => item.id !== id));
      
      // 3. Prevent Cache Ghosting: increment renderNonce to trigger clean re-renders
      setRenderNonce(prev => prev + 1);

      setNotification({
        message: "Asset removed from inventory",
        type: 'info'
      });
    } catch (error: any) {
      console.error("Delete asset failed:", error);
      const isPermissionDenied = error?.code === 'permission-denied' || String(error).includes('permission-denied');
      setNotification({
        message: isPermissionDenied ? "Permission denied: Only the seller or admin can delete this asset" : "Failed to delete asset",
        type: 'info'
      });
    }
  };

  const handleDeleteScan = async (id: string) => {
    try {
      if (!user) {
        setNotification({
          message: "Please sign in to delete scan logs",
          type: 'info'
        });
        return;
      }

      // 1. Clear Database Reference FIRST
      await deleteDoc(doc(db, 'garage_scans', id));

      // 2. Frontend State Update for scans after successful Firebase confirmation
      setGarageScans(prev => prev.filter(scan => scan.id !== id));
      setRenderNonce(prev => prev + 1);
      
      setNotification({
        message: "Scan record deleted",
        type: 'info'
      });
    } catch (error: any) {
      console.error("Delete scan failed:", error);
      const isPermissionDenied = error?.code === 'permission-denied' || String(error).includes('permission-denied');
      setNotification({
        message: isPermissionDenied ? "Permission denied to delete this scan" : "Failed to delete scan",
        type: 'info'
      });
    }
  };

  const generateSku = () => {
    const chars = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    let randomPart = '';
    for (let i = 0; i < 4; i++) {
      randomPart += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return `#TAG-${randomPart}`;
  };

  const handleAddAsset = async (newAsset: any, category: 'wardrobe' | 'garage' | 'jersey') => {
    if (!user) {
      setNotification({
        message: "Authentication required for upload",
        type: 'info'
      });
      return;
    }

    try {
      if (listingFormInitialData && listingFormInitialData.id) {
        // We are updating!
        const { id, createdAt, sellerId, ...cleanAsset } = newAsset;
        
        // Remove undefined values to prevent Firestore error
        const cleanPayload = Object.fromEntries(
          Object.entries(cleanAsset).filter(([_, v]) => v !== undefined)
        );

        const skuToSave = newAsset.sku || listingFormInitialData.sku || generateSku();

        await updateDoc(doc(db, 'listings', listingFormInitialData.id), {
          ...cleanPayload,
          sku: skuToSave,
          siloType: category,
          updatedAt: serverTimestamp()
        });

        setActiveSilo(category);
        setCurrentView('store');
        setIsDialogOpen(false);
        setListingFormInitialData(null);

        setNotification({
          message: "Success: Asset Updated in " + category.charAt(0).toUpperCase() + category.slice(1),
          type: 'success'
        });
      } else {
        // We are creating a brand new listing!
        const skuToSave = newAsset.sku || generateSku();
        const assetData = {
          ...newAsset,
          sku: skuToSave,
          sellerId: user.uid,
          siloType: category,
          status: 'published',
          createdAt: serverTimestamp()
        };

        const customId = newAsset.id || doc(collection(db, 'listings')).id;
        const finalAsset = {
          ...assetData,
          id: customId
        };
        await setDoc(doc(db, 'listings', customId), finalAsset);
        
        setActiveSilo(category);
        setCurrentView('store');
        setIsDialogOpen(false);
        
        setNotification({
          message: "Success: Asset Published to " + category.charAt(0).toUpperCase() + category.slice(1),
          type: 'success'
        });
      }
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, 'listings');
    }
  };

  const handleClearAll = async () => {
    if (!user) {
      setNotification({
        message: "Please sign in to modify inventory items",
        type: 'info'
      });
      return;
    }

    const targetList = activeSilo === 'wardrobe' ? apparelList : activeSilo === 'garage' ? autoList : jerseyList;
    if (targetList.length === 0) {
      setNotification({
        message: `No items in ${activeSilo} to remove`,
        type: 'info'
      });
      return;
    }

    if (!confirm(`Are you sure you want to remove eligible items from your ${activeSilo} inventory?`)) {
      return;
    }

    const isAdmin = isAdminUser;
    
    // Filter target items to only those that the user is allowed to delete
    const deletableList = targetList.filter(item => {
      if (isAdmin) return true;
      if (!item.sellerId) return true; // Anyone signed in can delete unowned items
      return item.sellerId === user.uid;
    });

    if (deletableList.length === 0) {
      setNotification({
        message: "You do not have permission to delete any of the currently displayed items",
        type: 'info'
      });
      return;
    }

    const originalDeletedIds = new Set(deletedAssetIds);
    const originalListings = [...listings];
    const deletableIds = new Set(deletableList.map(item => item.id));

    try {
      // Optimistically update UI
      setDeletedAssetIds(prev => {
        const next = new Set(prev);
        deletableList.forEach(item => next.add(item.id));
        return next;
      });
      setListings(prev => prev.filter(item => !deletableIds.has(item.id)));

      // Perform deletions individually with their own try-catches to avoid fail-fast Promise.all issues
      let deletedCount = 0;
      let failedCount = 0;

      for (const item of deletableList) {
        try {
          await deleteDoc(doc(db, 'listings', item.id));
          deletedCount++;
        } catch (err) {
          console.error(`Failed to delete individual listing ${item.id}:`, err);
          failedCount++;
        }
      }

      setRenderNonce(prev => prev + 1);

      if (failedCount > 0) {
        setNotification({
          message: `Removed ${deletedCount} item(s). Failed to remove ${failedCount} item(s) due to permissions.`,
          type: 'info'
        });
      } else {
        setNotification({
          message: `${deletedCount} item(s) successfully removed from your ${activeSilo} inventory`,
          type: 'success'
        });
      }
    } catch (error) {
      // Revert matches
      setDeletedAssetIds(originalDeletedIds);
      setListings(originalListings);
      console.error("Bulk delete failed:", error);
      setNotification({
        message: "Inventory purge failed",
        type: 'info'
      });
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
      <SplashScreen isLoading={showSplash} />
      <Navigation 
        currentView={currentView} 
        onToggleView={(view) => {
          if (view === 'admin') {
            if (!isAdminUser) {
              window.history.replaceState({}, '', '/');
              setCurrentView('store');
              setNotification({
                message: "Access restricted: /admin is reserved for administrators.",
                type: 'info'
              });
              return;
            }
            window.history.pushState({}, '', '/admin');
            setCurrentView('admin');
          } else {
            const targetPath = view === 'store' ? '/' : `/${view}`;
            window.history.pushState({}, '', targetPath);
            setCurrentView(view);
          }
        }} 
        onComingSoon={showComingSoon}
        activeSilo={activeSilo}
        onSiloChange={(s) => {
          if (s === 'bidding') {
            setCurrentView('bidding');
            window.history.pushState({}, '', '/bidding');
          } else {
            setActiveSilo(s);
            if (currentView !== 'store') {
              setCurrentView('store');
              window.history.pushState({}, '', '/');
            }
          }
        }}
        userRole={userRole}
        isAdmin={isAdminUser}
        onOpenPostingModal={() => setIsDialogOpen(true)}
        cartCount={cart.length}
      />

      <AnimatePresence>
        {authError && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[200] flex items-center justify-center bg-slate-950/80 backdrop-blur-md p-4 overflow-y-auto"
          >
            <motion.div
              initial={{ scale: 0.95, y: 20, opacity: 0 }}
              animate={{ scale: 1, y: 0, opacity: 1 }}
              exit={{ scale: 0.95, y: 20, opacity: 0 }}
              className="bg-white border border-slate-200 w-full max-w-2xl rounded-3xl p-6 sm:p-8 shadow-2xl relative my-8"
            >
              <button 
                onClick={() => setAuthError(null)}
                className="absolute top-4 right-4 sm:top-6 sm:right-6 h-8 w-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-slate-800 transition-all flex items-center justify-center"
              >
                <X className="w-4 h-4" />
              </button>

              <div className="flex flex-col gap-5">
                <div className="flex items-center gap-4">
                  <div className="h-14 w-14 rounded-2xl bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-600 shrink-0 shadow-sm animate-pulse">
                    <ShieldAlert className="w-7 h-7" />
                  </div>
                  <div>
                    <span className="text-[10px] font-black tracking-widest text-amber-600 uppercase">Authentication Configuration Needed</span>
                    <h3 className="text-xl font-bold uppercase tracking-tight text-slate-950 mt-0.5 font-sans">Firebase Provider Constraint</h3>
                  </div>
                </div>

                <div className="p-4 bg-slate-50 border border-slate-100 rounded-2xl">
                  <p className="text-xs font-mono text-slate-600 leading-relaxed overflow-x-auto whitespace-pre-wrap">
                    {authError?.code || authError?.message || String(authError)}
                  </p>
                </div>

                <div className="space-y-4">
                  <div className="flex gap-3">
                    <div className="h-6 w-6 rounded-lg bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 shrink-0 text-xs font-bold font-mono">1</div>
                    <div>
                      <h4 className="text-xs font-bold uppercase tracking-wider text-slate-800 font-sans">Allow User Sign-Up (Identity Platform)</h4>
                      <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                        In your Google Cloud Console, navigate to <strong>Identity Platform</strong> → <strong>Settings</strong> → <strong>User Actions</strong>, and confirm that <strong>"Allow users to sign up"</strong> is checked and enabled.
                      </p>
                    </div>
                  </div>

                  <div className="flex gap-3">
                    <div className="h-6 w-6 rounded-lg bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 shrink-0 text-xs font-bold font-mono">2</div>
                    <div>
                      <h4 className="text-xs font-bold uppercase tracking-wider text-slate-800 font-sans">Enable Anonymous Sign-In (Firebase)</h4>
                      <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                        In your Firebase Project Console, go to <strong>Authentication</strong> → <strong>Sign-in method</strong>, click <strong>"Add new provider"</strong>, select <strong>"Anonymous"</strong>, and make sure it is <strong>Enabled</strong>.
                      </p>
                    </div>
                  </div>

                  <div className="flex gap-3">
                    <div className="h-6 w-6 rounded-lg bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 shrink-0 text-xs font-bold font-mono">3</div>
                    <div>
                      <h4 className="text-xs font-bold uppercase tracking-wider text-slate-800 font-sans">Use Google Account Sign-In (Alternative)</h4>
                      <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                        Alternatively, click on <strong>"Connect Google"</strong> in the navigation header to sign in using real Google credentials, bypassing guest-system provider configurations entirely.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="pt-4 border-t border-slate-100 flex flex-col sm:flex-row gap-2 justify-end">
                  <button 
                    onClick={() => setAuthError(null)}
                    className="px-4 py-3 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-bold uppercase tracking-widest transition-all"
                  >
                    Acknowledge
                  </button>
                  <button 
                    onClick={async () => {
                      setAuthError(null);
                      try {
                        await signInWithGoogle();
                      } catch (e) {
                        console.error(e);
                      }
                    }}
                    className="px-4 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold uppercase tracking-widest transition-all shadow-md flex items-center justify-center gap-2"
                  >
                     Connect Google ➔
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}

        {notification && (
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            onClick={() => setNotification(null)}
            className="fixed top-20 right-8 z-[100] flex items-center gap-3 bg-slate-900 text-white px-6 py-4 rounded-2xl shadow-2xl border border-slate-800 cursor-pointer hover:bg-slate-800 transition-all active:scale-95"
          >
            <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-xs font-bold uppercase tracking-widest">{notification.message}</span>
            <X className="w-3 h-3 ml-2 text-slate-500" />
          </motion.div>
        )}

        {/* Browser offline or Firestore sync status banner removed per user request while keeping background offline caching active */}

        {/* Back Online Connection Restored confirmation */}
        {showConnectedToast && (
          <motion.div
            initial={{ opacity: 0, y: 50, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 50, scale: 0.95 }}
            className="fixed bottom-6 left-6 z-[60] flex items-center gap-3 bg-slate-900 border border-slate-800 backdrop-blur text-white pl-4 pr-5 py-3 rounded-2xl shadow-2xl font-sans"
          >
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-500">
              <Wifi className="w-4 h-4 text-emerald-400 font-bold" />
            </div>
            <div className="text-left">
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Connection Restored</p>
              <p className="text-xs font-bold text-slate-200">Database changes synced online</p>
            </div>
            <div className="ml-2 flex items-center justify-center">
              <span className="relative flex h-2 w-2">
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      
      <main className="flex-1 mt-16 max-w-7xl mx-auto w-full flex flex-col md:flex-row bg-white border-x border-slate-200 shadow-xl min-h-[calc(100vh-4rem)] relative">
        {/* Sidebar Structure */}
        <aside className={cn(
          "w-full md:w-64 lg:w-72 shrink-0 border-b md:border-b-0 md:border-r border-slate-200 bg-slate-50/30 p-6 flex flex-col gap-8 md:sticky md:top-16 md:h-[calc(100vh-4rem)] md:overflow-y-auto transition-all",
          "hidden md:flex"
        )}>
          <SidebarContent 
            activeSilo={currentView === 'bidding' ? 'bidding' : activeSilo}
            onSiloChange={(s) => {
              if (s === 'bidding') {
                setCurrentView('bidding');
              } else {
                setActiveSilo(s);
                setCurrentView('store');
              }
            }}
            activeCategory={activeCategory}
            onCategoryChange={setActiveCategory}
            activeFilter={activeFilter}
            onFilterChange={setActiveFilter}
            isDialogOpen={isDialogOpen}
            setIsDialogOpen={setIsDialogOpen}
            handleAddAsset={handleAddAsset}
            currentView={currentView}
            initialData={listingFormInitialData}
            onOpenChange={(open) => {
              if (!open) setListingFormInitialData(null);
            }}
            isAdmin={isAdminUser}
            userRole={userRole}
          />
        </aside>

      {/* Content Section */}
        <section className="flex-1 p-4 md:p-8 bg-white min-w-0 relative pb-32 md:pb-16">
          <AnimatePresence mode="wait">
            {(currentView === 'profile' || currentView === 'security' || currentView === 'preferences') && (
              <motion.div
                key="profile"
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.98 }}
              >
                <ProfileSettings
                  user={user}
                  onNotification={setNotification}
                  onReturnToStore={() => setCurrentView('store')}
                />
              </motion.div>
            )}

            {currentView === 'transactions' && (
              <motion.div
                key="transactions"
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.98 }}
              >
                <TransactionHub
                  cart={cart}
                  user={user}
                  isAdminUser={isAdminUser}
                  onReturnToStore={() => setCurrentView('store')}
                />
              </motion.div>
            )}

            {currentView === 'store' && (
              <motion.div
                key="store"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
              >
                {/* Live Distress Bidding spectacle ticker indicator */}
                <LiveBiddingBanner onJoinBidding={() => setCurrentView('bidding')} />
                {/* Fixed FAB for adding product */}
                {!isJerseySilo && isAdminUser && (
                  <div className="fixed bottom-6 right-6 z-[100] md:hidden">
                    <Dialog open={isDialogOpen} onOpenChange={(open) => {
                      setIsDialogOpen(open);
                      if (!open) setListingFormInitialData(null);
                    }}>
                      <DialogTrigger
                        render={
                          <motion.button 
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={() => setIsDialogOpen(true)}
                            className="w-14 h-14 bg-indigo-600 text-white rounded-full flex items-center justify-center shadow-2xl shadow-indigo-200/40 active:scale-90 transition-all hover:bg-slate-900"
                            title="Add Listing"
                          >
                            <Plus className="w-6 h-6" />
                          </motion.button>
                        }
                      />
                      <DialogContent className="max-w-[95vw] md:max-w-5xl bg-transparent border-none shadow-none p-0 overflow-hidden outline-none">
                        <ListingForm onAddAsset={handleAddAsset} initialData={listingFormInitialData} />
                      </DialogContent>
                    </Dialog>
                  </div>
                )}
                <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 gap-6">
                  <div className="space-y-4">
                    <div className="md:hidden space-y-4 bg-slate-50/50 p-4 rounded-3xl border border-slate-100">
                      <div className="flex items-center justify-between gap-2 mb-2">
                        <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-400">Select Studio Mode</h3>
                        <div className="h-px flex-1 bg-slate-200 ml-4" />
                      </div>
                      <SiloSwitcher 
                        activeSilo={activeSilo} 
                        onSiloChange={(silo) => {
                          if (silo === 'bidding') {
                            setCurrentView('bidding');
                          } else {
                            setActiveSilo(silo);
                            setActiveCategory('all');
                          }
                        }}
                        activeCategory={activeCategory}
                        onCategoryChange={setActiveCategory}
                      />
                      <div className="flex items-center justify-between gap-3 pt-2">
                        <Dialog open={isSidebarOpen} onOpenChange={setIsSidebarOpen}>
                          <DialogTrigger
                            render={
                              <button 
                                onClick={() => setIsSidebarOpen(true)}
                                className="flex-1 flex items-center justify-center gap-3 px-4 py-3.5 bg-white border border-slate-200 text-slate-800 rounded-2xl text-[11px] font-black uppercase tracking-widest hover:bg-slate-50 transition-all shadow-sm active:scale-95"
                              >
                                <SlidersHorizontal className="w-4 h-4 text-indigo-600" />
                                <span>Browse Categories</span>
                              </button>
                            }
                          />
                        <DialogContent className="max-w-[90vw] rounded-3xl p-6 bg-white border-none overflow-y-auto max-h-[80vh]">
                          <SidebarContent 
                            activeSilo={activeSilo}
                            onSiloChange={(s) => { 
                              if (s === 'bidding') {
                                setCurrentView('bidding');
                              } else {
                                setActiveSilo(s);
                                setCurrentView('store');
                              }
                              setIsSidebarOpen(false); 
                            }}
                            activeCategory={activeCategory}
                            onCategoryChange={(c) => { setActiveCategory(c); setIsSidebarOpen(false); }}
                            activeFilter={activeFilter}
                            onFilterChange={(f) => { setActiveFilter(f); setIsSidebarOpen(false); }}
                            isDialogOpen={isDialogOpen}
                            setIsDialogOpen={setIsDialogOpen}
                            handleAddAsset={handleAddAsset}
                            currentView={currentView}
                            initialData={listingFormInitialData}
                            onOpenChange={(open) => {
                              if (!open) setListingFormInitialData(null);
                            }}
                            isAdmin={isAdminUser}
                            userRole={userRole}
                          />
                        </DialogContent>
                      </Dialog>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <h1 className="text-4xl md:text-5xl font-light text-slate-900 leading-tight italic tracking-tight font-sans">
                      {activeSilo === 'wardrobe' ? (activeCategory === 'all' ? "Uncle Tee's Wardrobe" : activeCategory.charAt(0) + activeCategory.slice(1).toLowerCase().replace('_', ' ')) : activeSilo === 'garage' ? "Welcome to Uncle Tee Automobiles" : "Uncle Tee's Pitch"}
                    </h1>
                    {activeSilo === 'garage' && (
                      <p className="text-indigo-600 text-xs md:text-sm font-black uppercase tracking-[0.3em] italic">"The future begins here"</p>
                    )}
                    <div className="flex items-center gap-3">
                      <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.6)]" />
                      <p className="text-slate-500 text-[10px] uppercase font-black tracking-[0.2em]">
                        { (activeSilo === 'wardrobe' ? apparelList : activeSilo === 'garage' ? autoList : jerseyList).length > 0 
                          ? `${activeCategory === 'all' ? 'All' : activeCategory} Inventory • ${activeSilo.toUpperCase()} NODE`
                          : "Awaiting Inventory Upload • System Ready"
                        }
                      </p>
                    </div>
                  </div>
                </div>
                    {activeSilo === 'wardrobe' && (
                      <div className="smooth-scroll-x py-4 mb-6 -mx-6 px-6 md:mx-0 md:px-0 gap-3 border-b border-slate-100 flex overflow-x-auto">
                        {[
                          { id: 'all', label: 'All Essentials' },
                          { id: CategoryType.FABRICS, label: 'Fabrics' },
                          { id: CategoryType.APPAREL, label: 'Apparel' },
                          { id: CategoryType.FOOTWEAR, label: 'Footwear' },
                          { id: CategoryType.ACCESSORIES, label: 'Accessories' },
                          { id: CategoryType.SEWING_SERVICES, label: 'Sewing' },
                        ].map((cat) => (
                          <button
                            key={cat.id}
                            onClick={() => setActiveCategory(cat.id as any)}
                            className={cn(
                              "whitespace-nowrap px-6 py-2.5 rounded-full text-[10px] font-black uppercase tracking-widest transition-all border shadow-sm",
                              activeCategory === cat.id 
                                ? "bg-slate-900 text-white border-slate-900 shadow-indigo-100" 
                                : "bg-white text-slate-500 border-slate-200 hover:border-slate-300"
                            )}
                          >
                            {cat.label}
                          </button>
                        ))}
                      </div>
                    )}
                    <div className="flex items-center justify-between gap-4">
                      <div className="flex border border-slate-200 rounded-md overflow-hidden bg-white shadow-sm h-10 w-fit text-slate-500">
                        <button className="px-4 border-r border-slate-200 bg-slate-50"><LayoutGrid className="w-4 h-4" /></button>
                        <button className="px-4"><ListIcon className="w-4 h-4" /></button>
                      </div>
                    </div>
                  </div>

                <div className={cn("grid grid-cols-1 gap-8 pb-20", !isJerseySilo && activeSilo !== 'garage' && "lg:grid-cols-2")}>
                  {isJerseySilo ? (
                    <div className="lg:col-span-2">
                       <JerseyStudio key={`jersey-studio-${renderNonce}`} onAddToCart={(item) => handleItemAction(item, item.customization)} />
                    </div>
                  ) : activeSilo === 'garage' ? (
                    <div className="lg:col-span-2 space-y-12">
                      <GarageHub 
                        selectedScan={selectedScan}
                        onResetScan={() => setSelectedScan(null)}
                        onAddToListing={(specs, images) => {
                          const limitedImages = images.slice(0, 12);
                          setListingFormInitialData({
                            category: CategoryType.AUTOMOBILE,
                            title: `${specs.year} ${specs.make} ${specs.model}`,
                            make: specs.make,
                            model: specs.model,
                            year: specs.year,
                            vin: specs.vin,
                            media: limitedImages.map(url => ({ url, type: 'image' }))
                          });
                          setNotification({
                            message: `VIN Profile Locked for ${specs.make} ${specs.model}`,
                            type: 'success'
                          });
                          setIsDialogOpen(true);
                        }}
                      />

                      {/* Collapsible Registry Logs Dropdown */}
                      {garageScans.length > 0 && (
                        <div className="pt-8 border-t border-slate-200">
                          <button 
                            type="button"
                            onClick={() => setIsRegistryLogsOpen(!isRegistryLogsOpen)}
                            className="w-full flex items-center justify-between p-5 bg-white border border-slate-200 rounded-3xl shadow-sm hover:border-indigo-300 transition-all group cursor-pointer"
                          >
                            <div className="flex items-center gap-4 text-left">
                              <div className="p-3 bg-indigo-50 text-indigo-600 rounded-2xl group-hover:bg-indigo-600 group-hover:text-white transition-colors">
                                <FileText className="w-5 h-5" />
                              </div>
                              <div>
                                <div className="flex flex-wrap items-center gap-3">
                                  <h3 className="text-xl font-black italic tracking-tighter uppercase text-slate-900">Registry Logs</h3>
                                  <span className="px-3 py-1 bg-indigo-100 text-indigo-800 text-[10px] font-black rounded-full uppercase tracking-wider">
                                    {garageScans.length} Saved {garageScans.length === 1 ? 'Scan' : 'Scans'}
                                  </span>
                                </div>
                                <p className="text-xs text-slate-500 font-medium mt-0.5">Click to expand or collapse your saved VIN check history</p>
                              </div>
                            </div>
                            <div className="flex items-center gap-3">
                              <span className="text-xs font-bold text-indigo-600 uppercase tracking-widest hidden sm:inline">
                                {isRegistryLogsOpen ? 'Minimize History' : 'View History Dropdown'}
                              </span>
                              <div className="p-2 bg-slate-100 rounded-xl group-hover:bg-indigo-50 text-slate-600 group-hover:text-indigo-600 transition-colors">
                                {isRegistryLogsOpen ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                              </div>
                            </div>
                          </button>

                          <AnimatePresence>
                            {isRegistryLogsOpen && (
                              <motion.div 
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: 'auto' }}
                                exit={{ opacity: 0, height: 0 }}
                                className="overflow-hidden pt-6"
                              >
                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                                  {garageScans.map((scan, i) => (
                                    <motion.div 
                                      initial={{ opacity: 0, y: 15 }}
                                      animate={{ opacity: 1, y: 0 }}
                                      key={scan.id || `scan-${i}`} 
                                      onClick={() => {
                                        setSelectedScan(scan);
                                        window.scrollTo({ top: 0, behavior: 'smooth' });
                                      }}
                                      className="bg-white border border-slate-200 hover:border-indigo-300 hover:shadow-lg active:scale-[0.98] cursor-pointer rounded-[2rem] p-6 shadow-sm transition-all group relative"
                                    >
                                      <div className="flex justify-between items-start mb-4">
                                        <div className="space-y-1">
                                          <p className="text-[9px] font-black text-indigo-600 uppercase tracking-widest leading-none mb-1">{scan.specs?.make || 'AUTOMOBILE'}</p>
                                          <h4 className="font-bold text-slate-900 leading-tight tracking-tight">{scan.specs?.year || ''} {scan.specs?.model || 'Vehicle'}</h4>
                                        </div>
                                        <div className="flex items-center gap-2">
                                          {(isAdminUser || (user && (!scan.userId || scan.userId === user.uid))) && (
                                            <button 
                                              onClick={(e) => {
                                                e.stopPropagation();
                                                handleDeleteScan(scan.id);
                                              }}
                                              className="p-1.5 bg-red-50 text-red-500 rounded-xl hover:bg-red-100 transition-colors z-10"
                                              title="Delete Scan Log"
                                            >
                                              <Trash2 className="w-4 h-4" />
                                            </button>
                                          )}
                                          <div className="p-2 bg-slate-50 rounded-xl group-hover:bg-indigo-50 transition-colors">
                                            <Car className="w-4 h-4 text-slate-400 group-hover:text-indigo-600" />
                                          </div>
                                        </div>
                                      </div>
                                      <div className="space-y-2 mb-4">
                                        <p className="text-[10px] font-mono font-bold text-slate-600 bg-slate-50 p-2.5 rounded-xl truncate tracking-widest border border-slate-100">{scan.vin}</p>
                                      </div>
                                      <div className="flex items-center justify-between pt-4 border-t border-slate-100">
                                        <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">
                                          {scan.timestamp?.toDate ? scan.timestamp.toDate().toLocaleString([], {month: 'short', day: 'numeric', hour: '2-digit', minute:'2-digit'}) : 'Just now'}
                                        </span>
                                        <span className="text-[9px] font-extrabold text-indigo-600 uppercase group-hover:underline">Load Report &rarr;</span>
                                      </div>
                                    </motion.div>
                                  ))}
                                </div>
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </div>
                      )}
                      
                      {/* Active Inventory with Interactive Search Bar */}
                      <div className="pt-12 border-t border-slate-200 space-y-8">
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                          <div>
                            <h3 className="text-2xl font-black italic tracking-tighter uppercase leading-none border-l-4 border-indigo-600 pl-4 text-slate-900">Active Inventory</h3>
                            <p className="text-slate-500 text-xs font-medium mt-1 ml-5">Browse Uncle Tee Automobiles verified vehicle listings</p>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="px-3.5 py-1.5 bg-indigo-50 text-indigo-700 border border-indigo-100 text-[10px] font-black rounded-full uppercase tracking-wider">
                              {autoList.length} Vehicles Available
                            </span>
                          </div>
                        </div>

                        {/* Inventory Search Input */}
                        <div className="relative max-w-2xl">
                          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                          <Input
                            value={garageSearchQuery}
                            onChange={(e) => setGarageSearchQuery(e.target.value)}
                            placeholder="Search cars by name, make, model, year, or VIN..."
                            className="pl-12 pr-10 h-13 bg-white border-slate-200 text-slate-900 text-sm font-medium rounded-2xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 shadow-sm"
                          />
                          {garageSearchQuery && (
                            <button 
                              onClick={() => setGarageSearchQuery('')}
                              className="absolute right-4 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-600 rounded-lg"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          )}
                        </div>

                        {/* Search Results / Inventory Grid */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                          {(() => {
                            const filteredAutoList = autoList.filter((item: any) => {
                              if (!garageSearchQuery.trim()) return true;
                              const q = garageSearchQuery.toLowerCase().trim();
                              const title = (item.title || '').toLowerCase();
                              const make = (item.make || '').toLowerCase();
                              const model = (item.model || '').toLowerCase();
                              const year = (item.year || '').toString();
                              const vin = (item.autoDetails?.vin || item.vin || '').toLowerCase();
                              const category = (item.category || '').toLowerCase();
                              return title.includes(q) || make.includes(q) || model.includes(q) || year.includes(q) || vin.includes(q) || category.includes(q);
                            });

                            if (filteredAutoList.length > 0) {
                              return filteredAutoList.map((item: any, i: number) => (
                                <motion.div
                                  key={item.id || `auto-${i}`}
                                  initial={{ opacity: 0, scale: 0.98 }}
                                  animate={{ opacity: 1, scale: 1 }}
                                  transition={{ duration: 0.2 }}
                                >
                                  <ListingCard 
                                    listing={item as any} 
                                    type="garage" 
                                    onDelete={() => handleDeleteAsset(item.id)}
                                    onEdit={() => {
                                      setListingFormInitialData(item);
                                      setIsDialogOpen(true);
                                    }}
                                    onAction={(customization) => handleItemAction(item, customization)}
                                    onOrder={(customization) => handleOrderAction(item, customization)}
                                  />
                                </motion.div>
                              ));
                            }

                            return (
                              <div className="md:col-span-2 py-16 px-6 border-2 border-dashed border-indigo-200/80 rounded-[2.5rem] flex flex-col items-center justify-center text-center space-y-6 bg-gradient-to-b from-indigo-50/40 via-white to-slate-50/50 shadow-sm">
                                <div className="p-4 bg-indigo-100/70 text-indigo-600 rounded-full">
                                  <Car className="w-10 h-10" />
                                </div>
                                <div className="max-w-xl space-y-3">
                                  <h4 className="text-slate-900 font-black uppercase tracking-tight text-base md:text-lg">
                                    {garageSearchQuery ? "Search Not Found" : "No Vehicles Posted Yet"}
                                  </h4>
                                  <p className="text-slate-700 font-medium text-xs md:text-sm leading-relaxed">
                                    {garageSearchQuery 
                                      ? 'Search not found but you can chat 08138642942 on WhatsApp to place your request if desired car or check on our instagram page to explore more options handle @uncleteeautomobiles'
                                      : 'No vehicles currently posted in Uncle Tee Automobiles.'
                                    }
                                  </p>
                                </div>

                                {garageSearchQuery && (
                                  <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
                                    <a
                                      href={`https://wa.me/2348138642942?text=${encodeURIComponent(`Hello Uncle Tee Automobiles, I searched for "${garageSearchQuery}" on your store and would like to place a custom vehicle request.`)}`}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs uppercase tracking-wider rounded-xl flex items-center gap-2 shadow-md transition-all active:scale-95"
                                    >
                                      <MessageCircle className="w-4 h-4" />
                                      Chat on WhatsApp (08138642942)
                                    </a>
                                    <a
                                      href="https://instagram.com/uncleteeautomobiles"
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="px-5 py-2.5 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-black text-xs uppercase tracking-wider rounded-xl flex items-center gap-2 shadow-md transition-all active:scale-95"
                                    >
                                      <Instagram className="w-4 h-4" />
                                      Instagram @uncleteeautomobiles
                                    </a>
                                    <button 
                                      onClick={() => setGarageSearchQuery('')}
                                      className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs uppercase tracking-wider rounded-xl transition-all"
                                    >
                                      Clear Search
                                    </button>
                                  </div>
                                )}
                              </div>
                            );
                          })()}
                        </div>
                      </div>
                    </div>
                  ) : (() => {
                    let list = activeSilo === 'wardrobe' ? apparelList : autoList;
                    
                    if (activeSilo === 'wardrobe' && activeCategory !== 'all') {
                      list = list.filter((item: any) => item.categoryType === activeCategory);
                    }
                    
                    // Sort by date manually since we removed it from the query for safety
                    list = [...list].sort((a, b) => {
                      const dateA = a.createdAt?.seconds || 0;
                      const dateB = b.createdAt?.seconds || 0;
                      return dateB - dateA;
                    });

                    if (activeFilter === 'premium') {
                      list = list.filter((item: any) => activeSilo === 'wardrobe' ? item.price > 1000 : item.price > 150000);
                    } else if (activeFilter === 'new') {
                      // Just mock new arrivals by showing the last 2 items
                      list = list.slice(0, 2);
                    }

                    return list.length > 0 ? (
                      list.map((item: any, i: number) => (
                        <ListingCard 
                          key={item.id || `listing-${i}`} 
                          listing={item as any} 
                          type={activeSilo as 'wardrobe' | 'garage' | 'jersey'} 
                          onDelete={() => handleDeleteAsset(item.id)}
                          onEdit={() => {
                            setListingFormInitialData(item);
                            setIsDialogOpen(true);
                          }}
                          onAction={(customization) => handleItemAction(item, customization)}
                          onOrder={(customization) => handleOrderAction(item, customization)}
                        />
                      ))
                    ) : (
                      <div className="lg:col-span-2 py-32 border-2 border-dashed border-slate-100 rounded-[2rem] flex flex-col items-center justify-center text-center space-y-6">
                        <div className="w-16 h-16 bg-slate-50 rounded-2xl flex items-center justify-center shadow-inner">
                          <Plus className={cn("text-slate-200", activeFilter !== 'all' ? "w-8 h-8" : "w-12 h-12")} />
                        </div>
                        {activeFilter !== 'all' ? (
                          <>
                            <div>
                              <h3 className="text-xl font-bold text-slate-900 tracking-tight">No Items Match Filters</h3>
                              <p className="text-slate-400 text-xs mt-2 max-w-xs mx-auto">Try adjusting your filters or upload new assets to see them here.</p>
                            </div>
                            <button 
                              onClick={() => setActiveFilter('all')}
                              className="px-8 py-3 text-indigo-600 font-bold uppercase tracking-widest hover:underline text-xs"
                            >
                              Clear Filters
                            </button>
                          </>
                        ) : (
                          <>
                            <div>
                              <h3 className="text-xl font-bold text-slate-900 tracking-tight">No Inventory Detected</h3>
                              <p className="text-slate-400 text-xs mt-2 max-w-xs mx-auto">Access the management panel in the sidebar to begin your first transmission.</p>
                            </div>
                            {isAdminUser ? (
                              <Dialog open={isDialogOpen} onOpenChange={(open) => {
                                setIsDialogOpen(open);
                                if (!open) setListingFormInitialData(null);
                              }}>
                                <DialogTrigger
                                  render={
                                    <button onClick={() => setIsDialogOpen(true)} className="px-8 py-3 bg-indigo-600 text-white rounded-xl text-xs font-bold uppercase tracking-widest hover:bg-slate-900 transition-all shadow-lg shadow-indigo-100 font-sans">
                                      Upload My First Asset
                                    </button>
                                  }
                                />
                                <DialogContent className="max-w-5xl bg-transparent border-none shadow-none p-0 overflow-visible">
                                  <ListingForm onAddAsset={handleAddAsset} initialData={listingFormInitialData} />
                                </DialogContent>
                              </Dialog>
                            ) : (
                              <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">New inventory arriving shortly.</p>
                            )}
                          </>
                        )}
                      </div>
                    );
                  })()}
                </div>
              </motion.div>
            )}

            {currentView === 'collection' && (
              <motion.div
                key="collection"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-12"
              >
                <div className="space-y-2">
                  <h1 className="text-5xl font-light text-slate-900 leading-tight italic tracking-tight">The Showcase</h1>
                  <p className="text-slate-500 text-[10px] uppercase font-black tracking-[0.2em]">Curated High-Value Collections by Uncle Tee</p>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  { (activeSilo === 'wardrobe' ? apparelList : activeSilo === 'garage' ? autoList : jerseyList).length > 0 ? (
                    (activeSilo === 'wardrobe' ? apparelList : activeSilo === 'garage' ? autoList : jerseyList).slice(0, 3).map((item: any, i: number) => (
                      <div key={item.id || `collection-${i}`} className="aspect-square bg-slate-100 rounded-2xl border border-slate-200 flex flex-col items-center justify-center p-8 text-center group cursor-pointer hover:border-indigo-600 transition-all overflow-hidden relative">
                          {item.images && item.images.length > 0 ? (
                            <>
                              <img 
                                src={item.images[0].thumbnailUrl || item.images[0].url} 
                                alt="" 
                                loading="lazy"
                                className="absolute inset-0 w-full h-full object-cover transition-opacity" 
                                referrerPolicy="no-referrer"
                              />
                              <div className="absolute inset-0 bg-slate-900/60 group-hover:bg-slate-900/40 transition-colors" />
                            </>
                          ) : (
                            <Zap className="w-12 h-12 text-slate-300 mb-4 group-hover:text-indigo-600 group-hover:scale-110 transition-all" />
                          )}
                        <h3 className={cn("font-bold text-lg relative z-10", item.images?.length > 0 ? "text-white" : "text-slate-900")}>{item.title}</h3>
                        <p className={cn("text-xs mt-2 relative z-10 font-bold", item.images?.length > 0 ? "text-slate-200" : "text-slate-500")}>Premium {activeSilo.toUpperCase()}</p>
                        
                        <div className="absolute inset-0 flex items-center justify-center translate-y-full group-hover:translate-y-0 transition-transform duration-300 z-20">
                          <button 
                            onClick={(e) => {
                              e.stopPropagation();
                              handleOrderAction(item);
                            }}
                            className="bg-white text-slate-900 px-6 py-3 rounded-xl font-bold uppercase tracking-widest text-[10px] shadow-2xl hover:bg-indigo-600 hover:text-white transition-all transform hover:scale-105 flex items-center gap-2"
                          >
                            <ShoppingBag className="w-3.5 h-3.5" />
                            Place Order Now
                          </button>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="col-span-3 py-10 text-center text-slate-400 text-sm">No highlights yet. Upload products to populate your showcase.</div>
                  )}
                </div>
              </motion.div>
            )}

            {currentView === 'bidding' && (
              <motion.div
                key="bidding"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
              >
                <DistressBidding 
                  onBack={() => setCurrentView('store')} 
                  isAdmin={isAdminUser}
                  userRole={userRole}
                  onNavigateView={(view: any, silo?: any) => {
                    setCurrentView(view);
                    if (silo) setActiveSilo(silo);
                  }}
                />
              </motion.div>
            )}

            {currentView === 'orders' && (
              <motion.div
                key="orders"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-12 pb-16"
              >
                <div className="flex flex-col md:flex-row md:items-end justify-between mb-6 gap-6">
                  <div className="space-y-2">
                    <h1 className="text-5xl font-light text-slate-900 leading-tight italic tracking-tight">Active Requests</h1>
                  <p className="text-slate-500 text-[10px] uppercase font-black tracking-[0.2em]">Pending inspections and payment transmissions</p>
                  </div>
                  <div className="flex gap-4">
                    {cart.some(item => item.status !== 'paid') && (
                      <div className="flex items-center gap-2 bg-indigo-50 px-4 py-2 rounded-lg border border-indigo-100">
                        <span className="text-[9px] font-black uppercase text-indigo-600 tracking-widest">Awaiting Settlement</span>
                      </div>
                    )}
                    <button 
                      onClick={async () => {
                        if (!user) {
                          setNotification({
                            message: "Please sign in to clear ledger items",
                            type: 'info'
                          });
                          return;
                        }
                        if (confirm('Clear eligible requests from ledger?')) {
                          const isAdmin = isAdminUser;
                          const deletableRequests = cart.filter(item => isAdmin || item.userId === user.uid);
                          
                          if (deletableRequests.length === 0) {
                            setNotification({
                              message: "No owned requests found to clear",
                              type: 'info'
                            });
                            return;
                          }

                          let deletedCount = 0;
                          let failedCount = 0;

                          for (const item of deletableRequests) {
                            try {
                              await deleteDoc(doc(db, 'requests', item.docId));
                              deletedCount++;
                            } catch (err) {
                              console.error(`Failed to delete request ${item.docId}:`, err);
                              failedCount++;
                            }
                          }

                          if (failedCount > 0) {
                            setNotification({
                              message: `Cleared ${deletedCount} requests. Failed on ${failedCount} items due to permissions.`,
                              type: 'info'
                            });
                          } else {
                            setNotification({
                              message: `Ledger successfully cleared of ${deletedCount} request(s)`,
                              type: 'success'
                            });
                          }
                        }
                      }}
                      className="text-[10px] font-bold text-slate-400 hover:text-red-500 uppercase tracking-widest px-4 py-2 border border-slate-100 rounded-lg hover:border-red-100 hover:bg-red-50 transition-all font-sans"
                    >
                      Clear Log
                    </button>
                    <button 
                      onClick={handleClearAll}
                      className="text-[10px] font-bold text-red-500 hover:text-red-700 uppercase tracking-widest px-4 py-2 border border-red-100 rounded-lg hover:bg-red-50 transition-all font-sans"
                    >
                      Wipe Inventory
                    </button>
                  </div>
                </div>

                <div className="border border-slate-100 rounded-2xl shadow-sm bg-white overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left min-w-[1000px] border-separate border-spacing-0">
                      <thead className="bg-slate-50 border-b border-slate-100 italic text-[10px] font-bold text-slate-500 uppercase tracking-widest font-sans">
                      <tr>
                        <th className="px-6 py-4">Reference</th>
                        <th className="px-6 py-4">Asset</th>
                        {isAdminUser && <th className="px-6 py-4">Customer Details</th>}
                        <th className="px-6 py-4">Category</th>
                        <th className="px-6 py-4">Status</th>
                        <th className="px-6 py-4">Specs</th>
                        <th className="px-6 py-4 text-right">Value</th>
                        <th className="px-6 py-4 text-right">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-sm font-sans">
                      { cart.length > 0 ? (
                        cart.map((item: any, i: number) => (
                          <tr key={item.docId || `cart-${i}`} className="hover:bg-slate-50/50 transition-colors group">
                            <td className="px-6 py-4 font-mono text-xs text-indigo-600 font-bold">{item.orderId}</td>
                            <td className="px-6 py-4 font-bold text-slate-900">
                              <div>{item.title}</div>
                              {item.sku && (
                                <div className="text-[10px] text-indigo-600 font-mono font-bold uppercase mt-1">
                                  SKU: {item.sku}
                                </div>
                              )}
                              {item.customization && (
                                <div className="text-[10px] text-amber-600 font-bold uppercase mt-1">
                                  Kit: {item.customization.name} #{item.customization.number}
                                </div>
                              )}
                            </td>
                            {isAdminUser && (
                              <td className="px-6 py-4">
                                <div className="text-[10px] text-slate-900 font-black uppercase truncate max-w-[150px]">
                                  {item.deliveryDetails?.fullName || 'Unknown User'}
                                </div>
                                <div className="text-[9px] text-slate-500 font-bold truncate max-w-[150px]">
                                  {item.deliveryDetails?.email || 'N/A'}
                                </div>
                                <div className="text-[8px] text-slate-400 truncate max-w-[150px]">
                                  {item.deliveryDetails?.phone || 'No Phone'}
                                </div>
                              </td>
                            )}
                            <td className="px-6 py-4 text-slate-500 uppercase text-[10px] font-bold tracking-tighter">{item.siloType}</td>
                             <td className="px-6 py-4">
                               {item.status === 'paid' ? (
                                 <div className="flex flex-col items-start gap-2">
                                   <span className="bg-emerald-50 text-emerald-600 text-[10px] font-bold px-2 py-0.5 rounded uppercase font-mono flex items-center gap-1.5 w-fit">
                                     <CheckCircle2 className="w-3 h-3" /> Paid
                                   </span>
                                   {item.estimatedDeliveryDate && (
                                     <div className="text-[10px] text-slate-500 font-bold mt-1">
                                       Est. Delivery: <span className="text-slate-950 font-mono font-black">{new Date(item.estimatedDeliveryDate).toLocaleDateString()}</span>
                                     </div>
                                   )}
                                    {isAdminUser && (
                                     <div className="mt-2 flex flex-col gap-1 bg-slate-100/50 p-2 rounded-lg border border-slate-200">
                                       <span className="text-[9px] font-black uppercase text-indigo-600 tracking-wider">Update Delivery Schedule</span>
                                       <div className="flex items-center gap-1.5">
                                         <input 
                                           type="date"
                                           className="text-[10px] border border-slate-300 rounded px-1.5 py-1 bg-white font-mono focus:outline-none focus:border-indigo-500"
                                           onChange={(e) => {
                                             item._tempDelayDate = e.target.value;
                                           }}
                                         />
                                         <button
                                           onClick={async (e) => {
                                             if (!item._tempDelayDate) {
                                               setNotification({ message: "Please select a schedule date first", type: 'info' });
                                               return;
                                             }
                                             try {
                                               setNotification({ message: "Reprogramming delivery schedule...", type: 'info' });
                                               
                                               // 1. Proactively update Firestore document directly from the authenticated client
                                               const requestDocRef = doc(db, 'requests', item.docId);
                                               await updateDoc(requestDocRef, { estimatedDeliveryDate: item._tempDelayDate });

                                               // 2. Call server-side API for notification alerts dispatch
                                               const response = await fetch('/api/orders/update-delivery-date', {
                                                 method: 'POST',
                                                 headers: { 'Content-Type': 'application/json' },
                                                 body: JSON.stringify({ 
                                                   docId: item.docId, 
                                                   newDeliveryDate: item._tempDelayDate,
                                                   orderData: item
                                                 })
                                               });
                                               const data = await response.json();
                                               if (response.ok) {
                                                  setNotification({ message: "rescheduled successfully & alerts dispatched!", type: 'success' });
                                               } else {
                                                 throw new Error(data.error);
                                               }
                                             } catch (err: any) {
                                               console.error(err);
                                               setNotification({ message: err?.message || "Delay configuration error", type: 'info' });
                                             }
                                           }}
                                           className="bg-indigo-600 hover:bg-slate-900 text-white font-bold text-[9px] py-1 px-2 rounded uppercase tracking-wider transition-all"
                                         >
                                           Save
                                         </button>
                                       </div>
                                     </div>
                                   )}
                                   <button 
                                     onClick={() => handleGeneratePlan(item)}
                                     disabled={isGeneratingPlan}
                                     className="text-[9px] font-black uppercase text-indigo-600 hover:underline tracking-widest disabled:opacity-50"
                                   >
                                     {isGeneratingPlan ? "Configuring Plan..." : "View Delivery Email"}
                                   </button>
                                 </div>
                               ) : item.status === 'bid_placed' ? (
                                 <span className="bg-indigo-50 text-indigo-700 text-[10px] font-bold px-2.5 py-1 rounded-lg uppercase font-mono border border-indigo-100 shadow-sm inline-flex items-center gap-1">
                                   💸 Offer Placed
                                 </span>
                               ) : item.status === 'payment_submitted' ? (
                                 <div className="flex flex-col items-start gap-1">
                                   <span className="bg-amber-50 text-amber-700 text-[10px] font-bold px-2.5 py-1 rounded-lg uppercase font-mono border border-amber-200 shadow-sm inline-flex items-center gap-1">
                                     <Zap className="w-3 h-3 text-amber-500" /> Payment Submitted
                                   </span>
                                   <span className="text-[9px] text-amber-700 font-bold max-w-[170px] leading-tight">
                                     We will approve order if payment is confirmed
                                   </span>
                                 </div>
                               ) : item.status === 'callback_request' ? (
                                 <span className="bg-amber-50 text-amber-700 text-[10px] font-bold px-2.5 py-1 rounded-lg uppercase font-mono border border-amber-100 shadow-sm inline-flex items-center gap-1">
                                   📞 Call Request
                                 </span>
                               ) : (
                                 <span className="bg-amber-50 text-amber-600 text-[10px] font-bold px-2 py-0.5 rounded uppercase font-mono">Pending</span>
                               )}
                             </td>
                            <td className="px-6 py-4">
                              {item.customization && (
                                <div className="flex flex-col gap-1 max-w-[180px]">
                                  {item.customization.notes && (
                                     <p className="text-[10px] font-bold text-slate-700 leading-relaxed mt-1" title={item.customization.notes}>"{item.customization.notes}"</p>
                                  )}
                                  {item.customization.name ? (
                                    <span className="text-[10px] text-slate-500 font-bold uppercase truncate">Kit: <span className="text-slate-900">{item.customization.name} #{item.customization.number}</span></span>
                                  ) : (
                                    <>
                                      {item.customization.color && (
                                        <span className="text-[10px] text-slate-500 font-bold uppercase truncate">Color: <span className="text-slate-900">{item.customization.color}</span></span>
                                      )}
                                      {item.customization.size && (
                                        <span className="text-[10px] text-slate-500 font-bold uppercase truncate">Size: <span className="text-slate-900">{item.customization.size}</span></span>
                                      )}
                                      {item.customization.quantity && item.customization.quantity !== '1' && (
                                        <span className="text-[10px] text-slate-500 font-bold uppercase">Qty: <span className="text-slate-900">{item.customization.quantity}</span></span>
                                      )}
                                    </>
                                  )}
                                </div>
                              )}
                            </td>
                            <td className="px-6 py-4 text-right font-black text-slate-900 italic">₦{item.price?.toLocaleString()}</td>
                            <td className="px-6 py-4 text-right">
                              <div className="flex items-center justify-end gap-3">
                                {isAdminUser && item.status !== 'paid' && item.status !== 'completed' ? (
                                  <button 
                                    onClick={() => handleAdminConfirmPayment(item.docId)}
                                    className="bg-emerald-600 hover:bg-emerald-700 text-white text-[9px] font-bold uppercase tracking-widest px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 shadow-sm"
                                  >
                                    <CheckCircle2 className="w-3.5 h-3.5" /> Confirm Payment ✓
                                  </button>
                                ) : (!isAdminUser && item.status !== 'paid' && item.status !== 'completed' && item.status !== 'payment_submitted' && item.status !== 'bid_placed' && item.status !== 'callback_request') ? (
                                  <button 
                                    onClick={() => setCheckoutItem(item)}
                                    className="bg-indigo-600 text-white text-[9px] font-bold uppercase tracking-widest px-3 py-1.5 rounded-lg hover:bg-slate-900 transition-all flex items-center gap-2"
                                  >
                                    <CreditCard className="w-3 h-3" /> Pay Now
                                  </button>
                                ) : (!isAdminUser && item.status === 'payment_submitted') ? (
                                  <span className="text-[9px] font-bold text-amber-700 bg-amber-50 px-2.5 py-1 rounded-lg border border-amber-200">
                                    Awaiting Admin Approval
                                  </span>
                                ) : null}
                                <button 
                                  onClick={() => handleRemoveFromCart(item.docId)}
                                  className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
                                  title="Delete item from cart"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan={isAdminUser ? 8 : 7} className="px-6 py-24 text-center">
                            <div className="flex flex-col items-center gap-4">
                              <div className="w-12 h-12 bg-slate-50 rounded-full flex items-center justify-center">
                                <Zap className="w-6 h-6 text-slate-200" />
                              </div>
                              <p className="text-slate-400 text-xs font-bold uppercase tracking-widest">No Active Requests Captured</p>
                              <button 
                                onClick={() => setCurrentView('store')}
                                className="text-[10px] text-indigo-600 font-black uppercase tracking-widest hover:underline"
                              >
                                Return to Gallery
                              </button>
                            </div>
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </motion.div>
            )}

            {currentView === 'admin' && isAdminUser && (
              <motion.div
                key="admin"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-8"
              >
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-slate-200">
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <span className="bg-amber-100 text-amber-800 text-[9px] font-black uppercase px-2.5 py-1 rounded-full tracking-wider border border-amber-200 flex items-center gap-1">
                        <ShieldAlert className="w-3 h-3 text-amber-600" /> Firestore Admin Role Verified
                      </span>
                    </div>
                    <h1 className="text-4xl font-black text-slate-900 tracking-tight">Administrator Console</h1>
                    <p className="text-slate-500 text-xs font-medium mt-1">
                      Manage platform inventory, review registered customer accounts, and examine cumulative purchase metrics.
                    </p>
                  </div>

                  <div className="flex flex-wrap items-center gap-3">
                    <button
                      onClick={() => setIsDialogOpen(true)}
                      className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold uppercase tracking-widest px-4 py-2.5 rounded-xl shadow-md transition-all flex items-center gap-2 font-sans"
                    >
                      <Plus className="w-4 h-4" /> Post New Asset
                    </button>
                    <button
                      onClick={() => setCurrentView('orders')}
                      className="bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold uppercase tracking-widest px-4 py-2.5 rounded-xl shadow-md transition-all flex items-center gap-2 font-sans"
                    >
                      View All Requests
                    </button>
                  </div>
                </div>

                {/* Sub-navigation Tabs inside Admin Console */}
                <div className="flex flex-wrap items-center gap-3 bg-white p-2 rounded-2xl border border-slate-200 w-fit">
                  <button
                    onClick={() => setAdminConsoleTab('carts')}
                    className={`px-5 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all flex items-center gap-2 ${
                      adminConsoleTab === 'carts'
                        ? 'bg-slate-900 text-white shadow-md'
                        : 'bg-transparent text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    <ShoppingCart className="w-4 h-4" /> All User Carts ({cart.length})
                  </button>
                  <button
                    onClick={() => setAdminConsoleTab('customers')}
                    className={`px-5 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all flex items-center gap-2 ${
                      adminConsoleTab === 'customers'
                        ? 'bg-slate-900 text-white shadow-md'
                        : 'bg-transparent text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    <Users className="w-4 h-4" /> Customer Breakdown & Hub
                  </button>
                  <button
                    onClick={() => setAdminConsoleTab('inventory')}
                    className={`px-5 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all flex items-center gap-2 ${
                      adminConsoleTab === 'inventory'
                        ? 'bg-slate-900 text-white shadow-md'
                        : 'bg-transparent text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    <PackageCheck className="w-4 h-4" /> Store Inventory & Overview
                  </button>
                  <button
                    onClick={() => setAdminConsoleTab('vin_checks')}
                    className={`px-5 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all flex items-center gap-2 ${
                      adminConsoleTab === 'vin_checks'
                        ? 'bg-slate-900 text-white shadow-md'
                        : 'bg-transparent text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    <Car className="w-4 h-4" /> All User VIN Checks ({garageScans.length})
                  </button>
                </div>

                {adminConsoleTab === 'carts' ? (
                  <div className="space-y-8">
                    {/* Admin Cart Overview Metrics */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                      <div className="p-5 bg-slate-900 text-white rounded-2xl shadow-sm border border-slate-800">
                        <p className="text-[10px] font-bold uppercase text-slate-400 tracking-wider">Total User Cart Items</p>
                        <h3 className="text-3xl font-black mt-2">{cart.length}</h3>
                        <p className="text-[10px] text-slate-400 mt-1">Logged requests across all customers</p>
                      </div>
                      <div className="p-5 bg-white rounded-2xl shadow-sm border border-slate-200">
                        <p className="text-[10px] font-bold uppercase text-slate-400 tracking-wider">Unique Customers</p>
                        <h3 className="text-3xl font-black text-slate-900 mt-2">
                          {new Set(cart.map(c => c.deliveryDetails?.email || c.userId || 'anonymous')).size}
                        </h3>
                        <p className="text-[10px] text-indigo-600 font-bold mt-1">Active customer accounts</p>
                      </div>
                      <div className="p-5 bg-white rounded-2xl shadow-sm border border-slate-200">
                        <p className="text-[10px] font-bold uppercase text-slate-400 tracking-wider">Awaiting Settlement</p>
                        <h3 className="text-3xl font-black text-amber-600 mt-2">
                          {cart.filter(c => c.status !== 'paid').length}
                        </h3>
                        <p className="text-[10px] text-slate-400 mt-1">Pending payments / verification</p>
                      </div>
                      <div className="p-5 bg-white rounded-2xl shadow-sm border border-slate-200">
                        <p className="text-[10px] font-bold uppercase text-slate-400 tracking-wider">Total Cart Gross Value</p>
                        <h3 className="text-3xl font-black text-emerald-600 mt-2">
                          ₦{cart.reduce((sum, item) => sum + (item.price || 0), 0).toLocaleString()}
                        </h3>
                        <p className="text-[10px] text-slate-400 mt-1">Combined cart ledger value</p>
                      </div>
                    </div>

                    {/* Master User Carts Table */}
                    <div className="border border-slate-200 rounded-2xl shadow-sm bg-white overflow-hidden p-6 space-y-6">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <div>
                          <h3 className="text-lg font-bold text-slate-900">Customer Add-To-Carts & Weekly Reminder Prompts</h3>
                          <p className="text-xs text-slate-500 font-medium">Full view of all assets currently added to cart by users, with weekly WhatsApp and Email reminder dispatch controls.</p>
                        </div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <button 
                            onClick={() => {
                              const pendingItems = cart.filter(c => c.status !== 'paid');
                              if (pendingItems.length === 0) {
                                setNotification({ message: "No pending cart items to remind customers about", type: 'info' });
                                return;
                              }
                              setNotification({ message: `Weekly reminder prompts generated for ${pendingItems.length} pending user cart item(s)`, type: 'success' });
                            }}
                            className="text-[10px] font-bold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 uppercase tracking-widest px-3 py-2 border border-emerald-200 rounded-lg transition-all font-sans flex items-center gap-1.5"
                          >
                            <MessageCircle className="w-3.5 h-3.5 text-emerald-600" /> Weekly Reminders Ready ({cart.filter(c => c.status !== 'paid').length})
                          </button>
                          <button 
                            onClick={async () => {
                              if (confirm('Clear all user cart requests from ledger?')) {
                                for (const item of cart) {
                                  try {
                                    await deleteDoc(doc(db, 'requests', item.docId));
                                  } catch (err) {
                                    console.error('Failed to clear cart item', err);
                                  }
                                }
                                setNotification({ message: 'Cart ledger cleared', type: 'success' });
                              }
                            }}
                            className="text-[10px] font-bold text-red-500 hover:text-red-700 uppercase tracking-widest px-3 py-2 border border-red-100 rounded-lg hover:bg-red-50 transition-all font-sans"
                          >
                            Clear All Carts
                          </button>
                        </div>
                      </div>

                      {/* Info Banner on Weekly Reminders */}
                      <div className="p-4 bg-indigo-50/60 rounded-xl border border-indigo-100 text-xs text-indigo-950 flex flex-col sm:flex-row sm:items-center justify-between gap-3 font-sans">
                        <div className="space-y-1">
                          <div className="font-bold flex items-center gap-2 text-indigo-900">
                            <Zap className="w-4 h-4 text-indigo-600" /> Weekly Cart Reminders Enabled
                          </div>
                          <p className="text-[11px] text-slate-600 leading-relaxed">
                            As Admin, you can send weekly direct WhatsApp prompts or Email reminders to any user account with pending items in their cart with 1 click below.
                          </p>
                        </div>
                      </div>

                      <div className="overflow-x-auto">
                        <table className="w-full text-left min-w-[950px] border-separate border-spacing-0">
                          <thead className="bg-slate-50 border-b border-slate-200 italic text-[10px] font-bold text-slate-500 uppercase tracking-widest font-sans">
                            <tr>
                              <th className="px-4 py-3">Ref ID</th>
                              <th className="px-4 py-3">Asset Requested</th>
                              <th className="px-4 py-3">Customer Profile</th>
                              <th className="px-4 py-3">Category / Silo</th>
                              <th className="px-4 py-3">Status</th>
                              <th className="px-4 py-3">Item Specs</th>
                              <th className="px-4 py-3 text-right">Value</th>
                              <th className="px-4 py-3 text-right">Admin & Reminder Actions</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100 text-xs font-sans">
                            {cart.length > 0 ? (
                              cart.map((item: any, i: number) => (
                                <tr key={item.docId || `cart-${i}`} className="hover:bg-slate-50/50 transition-colors">
                                  <td className="px-4 py-4 font-mono text-xs text-indigo-600 font-bold">{item.orderId || `REQ-${i+1}`}</td>
                                  <td className="px-4 py-4 font-bold text-slate-900">
                                    <div>{item.title}</div>
                                    {item.sku && (
                                      <div className="text-[10px] text-indigo-600 font-mono font-bold uppercase mt-0.5">
                                        SKU: {item.sku}
                                      </div>
                                    )}
                                    {item.customization && (
                                      <div className="text-[10px] text-amber-600 font-bold uppercase mt-0.5">
                                        Kit: {item.customization.name} #{item.customization.number}
                                      </div>
                                    )}
                                  </td>
                                  <td className="px-4 py-4">
                                    <div className="text-[11px] text-slate-900 font-black uppercase truncate max-w-[160px]">
                                      {item.deliveryDetails?.fullName || item.userName || 'Customer'}
                                    </div>
                                    <div className="text-[10px] text-indigo-600 font-bold truncate max-w-[160px]">
                                      {item.deliveryDetails?.email || item.userEmail || 'N/A'}
                                    </div>
                                    <div className="text-[9px] text-slate-400 font-mono truncate max-w-[160px]">
                                      {item.deliveryDetails?.phone || item.phone || 'No Phone'}
                                    </div>
                                  </td>
                                  <td className="px-4 py-4 text-slate-500 uppercase text-[10px] font-bold tracking-tighter">{item.siloType || 'store'}</td>
                                  <td className="px-4 py-4">
                                    {item.status === 'paid' ? (
                                      <span className="bg-emerald-50 text-emerald-600 text-[10px] font-bold px-2 py-0.5 rounded uppercase font-mono flex items-center gap-1 w-fit">
                                        <CheckCircle2 className="w-3 h-3" /> Paid
                                      </span>
                                    ) : (
                                      <span className="bg-amber-50 text-amber-700 text-[10px] font-bold px-2 py-0.5 rounded uppercase font-mono flex items-center gap-1 w-fit">
                                        <Zap className="w-3 h-3 text-amber-500" /> Pending
                                      </span>
                                    )}
                                    {item.estimatedDeliveryDate && (
                                      <div className="text-[9px] text-slate-500 font-bold mt-1">
                                        Est: <span className="font-mono">{new Date(item.estimatedDeliveryDate).toLocaleDateString()}</span>
                                      </div>
                                    )}
                                  </td>
                                  <td className="px-4 py-4 text-slate-600 text-[11px]">
                                    {item.specs ? (
                                      <div className="space-y-0.5 text-[10px]">
                                        {item.specs.color && <div><span className="font-bold">Color:</span> {item.specs.color}</div>}
                                        {item.specs.size && <div><span className="font-bold">Size:</span> {item.specs.size}</div>}
                                        {item.specs.quantity && <div><span className="font-bold">Qty:</span> {item.specs.quantity}</div>}
                                      </div>
                                    ) : (
                                      <span className="text-slate-400 text-[10px]">Standard</span>
                                    )}
                                  </td>
                                  <td className="px-4 py-4 text-right font-black text-slate-900 text-sm">
                                    ₦{item.price?.toLocaleString()}
                                  </td>
                                  <td className="px-4 py-4 text-right">
                                    <div className="flex items-center justify-end gap-1.5 flex-wrap">
                                      {(item.deliveryDetails?.phone || item.phone) && (
                                        <a 
                                          href={`https://wa.me/${(item.deliveryDetails?.phone || item.phone).replace(/[^0-9]/g, '')}?text=${encodeURIComponent(
                                            `Hello ${item.deliveryDetails?.fullName || item.userName || 'Customer'},\n\nThis is a friendly weekly reminder regarding your cart item: "${item.title}" (Price: ₦${item.price?.toLocaleString()}).\n\nPlease log in to complete your payment or review your cart!\n\nThank you!`
                                          )}`}
                                          target="_blank"
                                          rel="noopener noreferrer"
                                          className="px-2 py-1 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200 rounded text-[9px] font-bold uppercase tracking-wider transition-all flex items-center gap-1"
                                          title="Send WhatsApp Weekly Cart Reminder"
                                        >
                                          <MessageCircle className="w-3 h-3 text-emerald-600" /> WA
                                        </a>
                                      )}
                                      {(item.deliveryDetails?.email || item.userEmail) && (
                                        <a 
                                          href={`mailto:${item.deliveryDetails?.email || item.userEmail}?subject=${encodeURIComponent(
                                            `Weekly Reminder: Item in your Cart (${item.title})`
                                          )}&body=${encodeURIComponent(
                                            `Hi ${item.deliveryDetails?.fullName || item.userName || 'Customer'},\n\nThis is your weekly reminder for item(s) in your cart:\n\n- ${item.title} (₦${item.price?.toLocaleString()})\n\nPlease log in to complete your checkout.\n\nBest regards,\nStore Admin`
                                          )}`}
                                          className="px-2 py-1 bg-indigo-50 text-indigo-700 hover:bg-indigo-100 border border-indigo-200 rounded text-[9px] font-bold uppercase tracking-wider transition-all flex items-center gap-1"
                                          title="Send Email Weekly Cart Reminder"
                                        >
                                          <Mail className="w-3 h-3 text-indigo-600" /> Email
                                        </a>
                                      )}
                                      {item.status !== 'paid' && (
                                        <button 
                                          onClick={async () => {
                                            try {
                                              await updateDoc(doc(db, 'requests', item.docId), { status: 'paid' });
                                              setNotification({ message: 'Request marked as Paid', type: 'success' });
                                            } catch (err) {
                                              console.error('Update status failed', err);
                                            }
                                          }}
                                          className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded text-[9px] font-bold uppercase tracking-wider transition-colors"
                                        >
                                          Mark Paid
                                        </button>
                                      )}
                                      <button 
                                        onClick={async () => {
                                          if (confirm(`Remove ${item.title} from user cart?`)) {
                                            try {
                                              await deleteDoc(doc(db, 'requests', item.docId));
                                              setNotification({ message: 'Item removed from cart', type: 'info' });
                                            } catch (err) {
                                              console.error('Delete request error', err);
                                            }
                                          }
                                        }}
                                        className="p-1.5 text-slate-400 hover:text-red-500 transition-colors rounded-lg hover:bg-red-50"
                                        title="Remove from cart"
                                      >
                                        <Trash2 className="w-4 h-4" />
                                      </button>
                                    </div>
                                  </td>
                                </tr>
                              ))
                            ) : (
                              <tr>
                                <td colSpan={8} className="p-12 text-center text-slate-400 font-bold uppercase text-xs">
                                  No user cart requests currently in system ledger
                                </td>
                              </tr>
                            )}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </div>
                ) : adminConsoleTab === 'customers' ? (
                  <TransactionHub
                    cart={cart}
                    user={user}
                    isAdminUser={isAdminUser}
                    onReturnToStore={() => setCurrentView('store')}
                  />
                ) : adminConsoleTab === 'vin_checks' ? (
                  <div className="space-y-6">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                      <div>
                        <h3 className="text-xl font-black text-slate-900 tracking-tight flex items-center gap-2">
                          <ShieldAlert className="w-5 h-5 text-indigo-600" />
                          User VIN Checks Audit Directory
                        </h3>
                        <p className="text-xs text-slate-500 font-medium mt-1">
                          Complete record of all vehicle identification checks run by registered users and guests across Uncle Tee Automobiles.
                        </p>
                      </div>
                      <div className="px-4 py-2 bg-indigo-50 border border-indigo-100 rounded-xl">
                        <span className="text-xs font-black text-indigo-700 uppercase tracking-wider">
                          Total Logged Scans: {garageScans.length}
                        </span>
                      </div>
                    </div>

                    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                      <div className="overflow-x-auto">
                        <table className="w-full text-left text-xs text-slate-700">
                          <thead className="bg-slate-900 text-white uppercase font-black tracking-wider text-[10px]">
                            <tr>
                              <th className="px-6 py-4">User Details</th>
                              <th className="px-6 py-4">VIN Number</th>
                              <th className="px-6 py-4">Vehicle Specs</th>
                              <th className="px-6 py-4">Title Condition</th>
                              <th className="px-6 py-4">Scan Timestamp</th>
                              <th className="px-6 py-4 text-right">Admin Actions</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100">
                            {garageScans.length > 0 ? (
                              garageScans.map((scan, idx) => (
                                <tr key={scan.id || idx} className="hover:bg-slate-50 transition-colors">
                                  <td className="px-6 py-4 font-medium">
                                    <p className="font-bold text-slate-900">{scan.userEmail || scan.userId || 'Anonymous User'}</p>
                                    <p className="text-[10px] text-slate-400 font-mono">ID: {scan.userId ? scan.userId.substring(0, 10) + '...' : 'Guest Session'}</p>
                                  </td>
                                  <td className="px-6 py-4 font-mono font-bold text-indigo-600">
                                    <div className="flex items-center gap-2">
                                      <span>{scan.vin}</span>
                                      <button 
                                        onClick={() => {
                                          navigator.clipboard.writeText(scan.vin);
                                          setNotification({ message: 'VIN copied to clipboard!', type: 'success' });
                                        }}
                                        className="p-1 text-slate-400 hover:text-indigo-600 transition-colors"
                                        title="Copy VIN"
                                      >
                                        <Copy className="w-3.5 h-3.5" />
                                      </button>
                                    </div>
                                  </td>
                                  <td className="px-6 py-4">
                                    <p className="font-bold text-slate-900">{scan.specs?.year || ''} {scan.specs?.make || ''} {scan.specs?.model || 'Vehicle'}</p>
                                    <p className="text-[10px] text-slate-500 uppercase">{scan.specs?.transmission || 'Automatic'} • {scan.specs?.engineSize || 'Engine'}</p>
                                  </td>
                                  <td className="px-6 py-4">
                                    <span className={`px-2.5 py-1 rounded-full text-[9px] font-black uppercase tracking-wider ${
                                      scan.history?.status === 'clean' ? 'bg-emerald-100 text-emerald-800' :
                                      scan.history?.status === 'salvage' || scan.history?.status === 'damaged' ? 'bg-rose-100 text-rose-800' :
                                      'bg-amber-100 text-amber-800'
                                    }`}>
                                      {scan.history?.status || 'verified'}
                                    </span>
                                  </td>
                                  <td className="px-6 py-4 text-slate-500 text-[11px] font-mono">
                                    {scan.timestamp?.toDate ? scan.timestamp.toDate().toLocaleString() : 'Recent'}
                                  </td>
                                  <td className="px-6 py-4 text-right">
                                    <div className="flex items-center justify-end gap-2">
                                      <button
                                        onClick={() => {
                                          setSelectedScan(scan);
                                          setCurrentView('store');
                                          setActiveSilo('garage');
                                          window.scrollTo({ top: 0, behavior: 'smooth' });
                                        }}
                                        className="px-3 py-1.5 bg-indigo-600 text-white hover:bg-indigo-700 rounded-lg text-[10px] font-black uppercase tracking-wider transition-colors"
                                      >
                                        Inspect Report
                                      </button>
                                      <button
                                        onClick={() => handleDeleteScan(scan.id)}
                                        className="p-1.5 bg-red-50 text-red-600 hover:bg-red-100 rounded-lg transition-colors"
                                        title="Delete Scan Log"
                                      >
                                        <Trash2 className="w-4 h-4" />
                                      </button>
                                    </div>
                                  </td>
                                </tr>
                              ))
                            ) : (
                              <tr>
                                <td colSpan={6} className="px-6 py-16 text-center text-slate-400 font-bold uppercase tracking-wider">
                                  No VIN scan logs recorded yet
                                </td>
                              </tr>
                            )}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-8">
                    {/* Admin Overview Metrics */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                      <div className="p-5 bg-slate-900 text-white rounded-2xl shadow-sm border border-slate-800">
                        <p className="text-[10px] font-bold uppercase text-slate-400 tracking-wider">Total Store Assets</p>
                        <h3 className="text-3xl font-black mt-2">{listings.length}</h3>
                        <p className="text-[10px] text-slate-400 mt-1">Active inventory in Firestore index</p>
                      </div>
                      <div className="p-5 bg-white rounded-2xl shadow-sm border border-slate-200">
                        <p className="text-[10px] font-bold uppercase text-slate-400 tracking-wider">Pending Orders & Bids</p>
                        <h3 className="text-3xl font-black text-slate-900 mt-2">{cart.length}</h3>
                        <p className="text-[10px] text-indigo-600 font-bold mt-1">Customer requests logged</p>
                      </div>
                      <div className="p-5 bg-white rounded-2xl shadow-sm border border-slate-200">
                        <p className="text-[10px] font-bold uppercase text-slate-400 tracking-wider">Verified Admin Role</p>
                        <h3 className="text-xl font-black text-amber-600 uppercase mt-2">admin</h3>
                        <p className="text-[10px] text-slate-400 mt-1 truncate">users/{user?.uid}</p>
                      </div>
                      <div className="p-5 bg-white rounded-2xl shadow-sm border border-slate-200">
                        <p className="text-[10px] font-bold uppercase text-slate-400 tracking-wider">Database Status</p>
                        <h3 className="text-xl font-black text-emerald-600 mt-2">Connected</h3>
                        <p className="text-[10px] text-slate-400 mt-1">Firestore & Firebase Auth</p>
                      </div>
                    </div>

                    {/* Recent Customer Requests Table */}
                    <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-6">
                      <div className="flex items-center justify-between">
                        <h3 className="text-lg font-bold text-slate-900">Recent Customer Requests</h3>
                        <button
                          onClick={() => setAdminConsoleTab('carts')}
                          className="text-xs font-bold text-indigo-600 hover:underline uppercase tracking-wider"
                        >
                          Open All Carts ➔
                        </button>
                      </div>
                      {cart.length > 0 ? (
                        <div className="overflow-x-auto">
                          <table className="w-full text-left text-xs">
                            <thead className="bg-slate-50 text-[10px] font-bold uppercase tracking-wider text-slate-500 border-b border-slate-200">
                              <tr>
                                <th className="p-3">Reference</th>
                                <th className="p-3">Asset Name</th>
                                <th className="p-3">Customer Email</th>
                                <th className="p-3">Status</th>
                                <th className="p-3 text-right">Value</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                              {cart.slice(0, 5).map((item, idx) => (
                                <tr key={item.docId || idx} className="hover:bg-slate-50">
                                  <td className="p-3 font-mono text-indigo-600 font-bold">{item.orderId}</td>
                                  <td className="p-3 font-bold text-slate-900">{item.title}</td>
                                  <td className="p-3 text-slate-600">{item.deliveryDetails?.email || 'N/A'}</td>
                                  <td className="p-3">
                                    <span className="bg-amber-50 text-amber-700 px-2 py-0.5 rounded text-[10px] font-bold uppercase">
                                      {item.status || 'Pending'}
                                    </span>
                                  </td>
                                  <td className="p-3 text-right font-black text-slate-900">₦{item.price?.toLocaleString()}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      ) : (
                        <div className="p-8 text-center bg-slate-50 rounded-xl border border-dashed border-slate-200">
                          <p className="text-xs text-slate-500 font-bold uppercase">No active customer requests logged yet</p>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </motion.div>
            )}

            {currentView === 'about' && (
              <motion.div
                key="about"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
              >
                <AboutUs />
              </motion.div>
            )}
          </AnimatePresence>
        </section>
      </main>

      {/* Order Specification Modal */}
      <Dialog open={!!specifyingItem} onOpenChange={(open) => {
        if (!open) {
          setSpecifyingItem(null);
          setCheckoutImmediate(false);
          setItemSpecs({ color: '', size: '', quantity: '1', phone: '', notes: '', address: '', fullName: '', email: '', customDeliveryDays: '' });
        }
      }}>
        <DialogContent className="max-w-md bg-white border-none shadow-2xl p-0 overflow-hidden rounded-[2rem]">
          <div className="bg-slate-900 px-8 py-10 text-white relative">
            <div className="absolute top-6 right-6">
              <button 
                onClick={() => setSpecifyingItem(null)}
                className="w-8 h-8 flex items-center justify-center rounded-full bg-white/10 hover:bg-white/20 transition-all"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="space-y-1">
              <div className="flex items-center gap-2 mb-2">
                <SlidersHorizontal className="w-5 h-5 text-indigo-400" />
                <p className="text-[10px] uppercase font-black tracking-[0.2em] text-indigo-400">
                  {checkoutImmediate ? "Immediate Checkout Protocol" : "Order Specifications"}
                </p>
              </div>
              <h2 className="text-3xl font-light italic tracking-tight">{specifyingItem?.title}</h2>
              {specifyingItem && specifyingItem.siloType !== 'garage' && (
                <div className="inline-flex items-center gap-1.5 bg-indigo-500/20 border border-indigo-500/30 px-2.5 py-1 rounded-full text-[10px] font-mono font-black text-indigo-300 uppercase tracking-widest mt-2 w-fit">
                  Item Tag ID: {getUtnTag(specifyingItem)}
                </div>
              )}
            </div>
          </div>
          
          <div className="p-8 space-y-6 overflow-y-auto max-h-[55vh]">
            {checkoutImmediate && (
              <div className="space-y-6 pb-6 border-b border-slate-100">
                <div className="flex items-center gap-2 mb-4">
                  <div className="h-4 w-1 bg-indigo-600 rounded-full" />
                  <h3 className="text-xs font-black uppercase tracking-widest text-slate-900">Delivery Details</h3>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2 col-span-2">
                    <Label className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Full Name</Label>
                    <Input 
                      placeholder="e.g. John Doe" 
                      value={itemSpecs.fullName}
                      onChange={(e) => setItemSpecs(prev => ({ ...prev, fullName: e.target.value }))}
                      className="bg-slate-50 border-none h-11 text-sm font-bold focus:ring-1 focus:ring-indigo-600"
                    />
                  </div>
                  <div className="space-y-2 col-span-2">
                    <Label className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Email Address</Label>
                    <Input 
                      type="email"
                      placeholder="e.g. john@example.com" 
                      value={itemSpecs.email}
                      onChange={(e) => setItemSpecs(prev => ({ ...prev, email: e.target.value }))}
                      className="bg-slate-50 border-none h-11 text-sm font-bold focus:ring-1 focus:ring-indigo-600"
                    />
                  </div>
                  <div className="space-y-2 col-span-2">
                    <Label className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Phone Number</Label>
                    <Input 
                      placeholder="e.g. +234 813 000 0000" 
                      value={itemSpecs.phone}
                      onChange={(e) => setItemSpecs(prev => ({ ...prev, phone: e.target.value }))}
                      className="bg-slate-50 border-none h-11 text-sm font-bold focus:ring-1 focus:ring-indigo-600"
                    />
                  </div>
                  <div className="space-y-2 col-span-2">
                    <Label className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Delivery Address</Label>
                    <textarea 
                      placeholder="Enter your full street address, city, and state..."
                      value={itemSpecs.address}
                      onChange={(e) => setItemSpecs(prev => ({ ...prev, address: e.target.value }))}
                      className="w-full bg-slate-50 border-none rounded-xl p-4 text-sm font-medium focus:ring-1 focus:ring-indigo-600 min-h-[80px] outline-none"
                    />
                  </div>
                  <div className="space-y-2 col-span-2">
                    <Label className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Custom Delivery (Days Override - Optional)</Label>
                    <Input 
                      type="number"
                      placeholder="Default is 5 days for Watches, Jerseys, Moissanite Diamonds, Accessories" 
                      value={itemSpecs.customDeliveryDays}
                      onChange={(e) => setItemSpecs(prev => ({ ...prev, customDeliveryDays: e.target.value }))}
                      className="bg-slate-50 border-none h-11 text-sm font-bold focus:ring-1 focus:ring-indigo-600"
                    />
                  </div>
                </div>
              </div>
            )}

            <div className="flex items-center gap-2 mb-4">
              <div className="h-4 w-1 bg-slate-200 rounded-full" />
              <h3 className="text-xs font-black uppercase tracking-widest text-slate-900">Customization</h3>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Preferred Color</Label>
                <Input 
                  placeholder="e.g. Navy Blue" 
                  value={itemSpecs.color}
                  onChange={(e) => setItemSpecs(prev => ({ ...prev, color: e.target.value }))}
                  className="bg-slate-50 border-none h-11 text-sm font-bold focus:ring-1 focus:ring-indigo-600"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Selected Size</Label>
                <Input 
                  placeholder="e.g. XL / 42" 
                  value={itemSpecs.size}
                  onChange={(e) => setItemSpecs(prev => ({ ...prev, size: e.target.value }))}
                  className="bg-slate-50 border-none h-11 text-sm font-bold focus:ring-1 focus:ring-indigo-600"
                />
              </div>
              <div className="space-y-2 col-span-2">
                <Label className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Quantity</Label>
                <div className="flex items-center gap-4">
                  <Input 
                    type="number"
                    min="1"
                    value={itemSpecs.quantity}
                    onChange={(e) => setItemSpecs(prev => ({ ...prev, quantity: e.target.value }))}
                    className="bg-slate-50 border-none h-11 text-sm font-bold focus:ring-1 focus:ring-indigo-600 w-24"
                  />
                  <p className="text-xs text-slate-400 italic">Expected Total: <span className="text-slate-900 font-black">₦{((specifyingItem?.price || 0) * (parseInt(itemSpecs.quantity) || 1)).toLocaleString()}</span></p>
                </div>
              </div>
              {!checkoutImmediate && (
                <div className="space-y-2 col-span-2">
                  <Label className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Phone Number for Notifications</Label>
                  <Input 
                    placeholder="e.g. +234 813 000 0000" 
                    value={itemSpecs.phone}
                    onChange={(e) => setItemSpecs(prev => ({ ...prev, phone: e.target.value }))}
                    className="bg-slate-50 border-none h-11 text-sm font-bold focus:ring-1 focus:ring-indigo-600"
                  />
                  <p className="text-[8px] text-slate-400 uppercase font-bold tracking-tighter">Required for real-time delivery SMS</p>
                </div>
              )}
              <div className="space-y-2 col-span-2">
                <Label className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Additional Notes</Label>
                <textarea 
                  placeholder="Any special requests or details..."
                  value={itemSpecs.notes}
                  onChange={(e) => setItemSpecs(prev => ({ ...prev, notes: e.target.value }))}
                  className="w-full bg-slate-50 border-none rounded-xl p-4 text-sm font-medium focus:ring-1 focus:ring-indigo-600 min-h-[100px] outline-none"
                />
              </div>
            </div>
          </div>

          <div className="p-8 pt-4 border-t border-slate-50 flex gap-3 bg-slate-50/50">
            <Button 
              variant="ghost" 
              onClick={() => setSpecifyingItem(null)}
              className="flex-1 rounded-xl font-bold uppercase tracking-widest text-[10px] h-12"
            >
              Cancel
            </Button>
            <Button 
              onClick={handleConfirmSpecs}
              className="flex-[2] bg-slate-900 text-white rounded-xl font-bold uppercase tracking-widest text-[10px] h-12 shadow-xl shadow-slate-100 hover:scale-[1.02] transition-transform"
            >
              {checkoutImmediate ? "Confirm & Place Order Now" : "Confirm & Add to Cart"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delivery Plan Modal */}
      <Dialog open={!!deliveryPlan || isGeneratingPlan} onOpenChange={(open) => {
        if (!open) {
          setDeliveryPlan(null);
          setIsGeneratingPlan(false);
          setCurrentOrderPhone(null);
        }
      }}>
        <DialogContent className="max-w-2xl bg-white border-none shadow-2xl p-0 overflow-hidden rounded-[2rem]">
          <div className="bg-slate-900 p-12 text-white relative">
            <div className="absolute top-8 right-8">
              <button 
                onClick={() => setDeliveryPlan(null)}
                className="w-10 h-10 flex items-center justify-center rounded-full bg-white/10 hover:bg-white/20 transition-all font-sans"
              >
                <X className="w-5 h-5 font-sans" />
              </button>
            </div>
            <div className="space-y-2">
              <Zap className="w-10 h-10 text-indigo-400 mb-6" />
              <h2 className="text-4xl font-light italic tracking-tight">Delivery Communication</h2>
              <p className="text-indigo-300 text-[10px] uppercase font-black tracking-[0.2em]">Live Order Logistics Protocol</p>
            </div>
          </div>
          
          <div className="p-12 bg-white max-h-[60vh] overflow-y-auto">
            {isGeneratingPlan ? (
              <div className="flex flex-col items-center justify-center py-20 text-center">
                <div className="w-16 h-16 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mb-6"></div>
                <h3 className="text-xl font-bold text-slate-900 tracking-tight">Generating Protocol</h3>
                <p className="text-slate-400 text-xs mt-2">Uncle Tee's concierge is drafting your custom delivery plan...</p>
              </div>
            ) : (
              <div className="prose prose-slate max-w-none">
                <div className="markdown-body text-slate-600 leading-relaxed font-sans">
                  <Markdown>{deliveryPlan}</Markdown>
                </div>
                
                <div className="mt-12 pt-8 border-t border-slate-100 flex items-center justify-between gap-4 flex-wrap">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-emerald-50 flex items-center justify-center">
                      <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                    </div>
                    <div>
                      <p className="text-[10px] font-black uppercase text-slate-900 tracking-widest">Protocol Shared</p>
                      <p className="text-[9px] text-slate-400">A copy of this has been transmitted to your email.</p>
                    </div>
                  </div>
                  
                  <div className="flex gap-3 items-center">
                    {!currentOrderPhone ? (
                      <div className="flex items-center gap-2 bg-slate-50 p-1 pl-3 rounded-xl border border-slate-100">
                        <span className="text-[9px] font-bold text-slate-400 uppercase tracking-tighter">No Phone:</span>
                        <Input 
                          placeholder="Enter Phone" 
                          className="w-32 h-8 text-[10px] bg-white border-slate-200"
                          onBlur={(e) => setCurrentOrderPhone(e.target.value)}
                        />
                      </div>
                    ) : (
                      <Button 
                        onClick={() => {
                          const message = encodeURIComponent(`UNCLE TEE NIGERIA: Your Delivery Protocol for Order #${deliveryPlan?.match(/Order #([A-Z0-9-]+)/)?.[1] || 'Order'} is ready.\n\n${deliveryPlan?.substring(0, 800)}...`);
                          window.open(`https://wa.me/${currentOrderPhone.replace(/\D/g, '')}?text=${message}`, '_blank');
                        }}
                        className="bg-emerald-500 text-white hover:bg-emerald-600 rounded-xl px-6 font-sans font-bold uppercase tracking-widest text-[9px] flex items-center gap-2"
                      >
                        <MessageCircle className="w-3 h-3" />
                        Send to WhatsApp
                      </Button>
                    )}
                    <Button 
                      onClick={() => setDeliveryPlan(null)}
                      className="bg-slate-900 text-white rounded-xl px-8 font-sans font-bold uppercase tracking-widest text-[10px]"
                    >
                      Close Log
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Transaction Status Bar */}
      <footer className="min-h-[2.5rem] bg-slate-900 text-slate-400 text-[10px] flex flex-col md:flex-row items-center px-4 md:px-8 py-3 md:py-0 justify-between z-50 gap-4 md:gap-0">
        <div className="flex flex-wrap items-center justify-center md:justify-start gap-4 md:gap-8">
          <div className="flex items-center gap-2 font-medium tracking-tight">
            <div className="h-2 w-2 rounded-full bg-emerald-500"></div> UNCLE TEE NIGERIA • OFFICIAL STORE
          </div>
          <div className="hidden sm:flex items-center gap-2 font-medium tracking-tight">
            <div className="h-2 w-2 rounded-full bg-indigo-500"></div> SECURE PAYMENT GATEWAY ACTIVE
          </div>
        </div>
        <div className="flex items-center gap-6">
          <div className="hidden lg:flex items-center gap-4 border-r border-slate-800 pr-6">
            <a href="https://wa.me/2348138642942" target="_blank" rel="noreferrer" className="text-slate-500 hover:text-green-500 transition-colors"><MessageCircle className="w-4 h-4" /></a>
            <a href="https://instagram.com/uncleteeautomobiles" target="_blank" rel="noreferrer" className="text-slate-500 hover:text-pink-600 transition-colors"><Instagram className="w-4 h-4" /></a>
            <a href="https://instagram.com/uncleteeee.ng" target="_blank" rel="noreferrer" className="text-slate-500 hover:text-pink-600 transition-colors"><Instagram className="w-4 h-4" /></a>
            <a href="https://tiktok.com/@uncleteeautos" target="_blank" rel="noreferrer" className="text-slate-500 hover:text-white transition-colors"><Music2 className="w-4 h-4" /></a>
          </div>
          <div className="uppercase font-bold tracking-widest flex items-center gap-6 text-center">
            <span className="hidden md:inline">24/7 SUPPORT</span>
            <span className="text-slate-500">© 2020 UNCLE TEE NIGERIA</span>
          </div>
        </div>
      </footer>

      {/* Global Modals & Components */}
      <ChatBox />
      
      <SocialFunnelModal isOpen={showSocialFunnel} onClose={() => setShowSocialFunnel(false)} />

      <Dialog open={!!checkoutItem} onOpenChange={(open) => !open && setCheckoutItem(null)}>
        <DialogContent className="max-w-lg bg-transparent border-none shadow-none p-0 overflow-visible">
          {checkoutItem && (
            <PaymentModal 
              item={checkoutItem} 
              onClose={() => setCheckoutItem(null)} 
              onSuccess={() => handlePaymentSuccess(checkoutItem.docId)}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
