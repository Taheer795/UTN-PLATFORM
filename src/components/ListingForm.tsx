import React, { useState, useRef, useEffect } from 'react';
import { db, auth, storage, uploadFile, uploadFileWithProgress, handleFirestoreError, OperationType, signInWithGoogle } from '@/src/lib/firebase';
import heic2any from 'heic2any';
import { doc, getDoc, setDoc, deleteDoc, serverTimestamp } from 'firebase/firestore';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { 
  Shirt, 
  Car, 
  Star, 
  Upload, 
  ArrowRight, 
  X, 
  Plus, 
  Scissors, 
  Watch, 
  Footprints, 
  Layers, 
  Video, 
  Image as ImageIcon, 
  Loader2,
  CheckCircle2,
  SlidersHorizontal
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { CategoryType, Listing, MediaAsset } from '@/src/types';
import { cn } from '@/src/lib/utils';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  fastCompressImage, 
  generateOptimalThumbnail,
  generateCatalogueDisplayImage,
  getTinyBase64FallbackVal, 
  backgroundUploadManager 
} from '@/src/services/uploadService';

interface ListingFormProps {
  onAddAsset: (asset: any, silo: 'wardrobe' | 'garage' | 'jersey') => void;
  initialData?: any;
}

const readFileAsDataURL = (file: Blob | File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = (err) => reject(err);
    reader.readAsDataURL(file);
  });
};

const resizeAndCompressImage = (file: File): Promise<Blob | File> => {
  return new Promise((resolve) => {
    if (!file.type.startsWith('image/')) {
      resolve(file);
      return;
    }

    const img = new Image();
    const objectUrl = URL.createObjectURL(file);
    
    img.onload = () => {
      URL.revokeObjectURL(objectUrl);
      
      const MAX_WIDTH2048 = 2048;
      let width = img.width;
      let height = img.height;

      if (width > MAX_WIDTH2048) {
        height = Math.round((height * MAX_WIDTH2048) / width);
        width = MAX_WIDTH2048;
      }

      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;

      const ctx = canvas.getContext('2d');
      if (!ctx) {
        resolve(file);
        return;
      }

      ctx.drawImage(img, 0, 0, width, height);

      // Compress to JPEG format with 90% quality optimized client-side
      canvas.toBlob(
        (blob) => {
          if (blob) {
            const compressedFile = new File([blob], file.name.replace(/\.[^/.]+$/, "") + ".jpg", {
              type: 'image/jpeg',
              lastModified: Date.now()
            });
            resolve(compressedFile);
          } else {
            resolve(file);
          }
        },
        'image/jpeg',
        0.90
      );
    };

    img.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      resolve(file);
    };

    img.src = objectUrl;
  });
};

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

export default function ListingForm({ onAddAsset, initialData }: ListingFormProps) {
  const [category, setCategory] = useState<CategoryType | null>(initialData?.category || null);
  const [useOriginalQuality, setUseOriginalQuality] = useState<{ [key: string]: boolean }>({});
  const [imageUploadSize, setImageUploadSizeState] = useState<'original' | 'compressed'>(() => {
    const saved = localStorage.getItem('imageUploadSize');
    return (saved === 'original' || saved === 'compressed') ? saved : 'original';
  });

  const setImageUploadSize = (val: 'original' | 'compressed') => {
    setImageUploadSizeState(val);
    localStorage.setItem('imageUploadSize', val);
    window.dispatchEvent(new CustomEvent('imageUploadSizeChanged', { detail: val }));
  };

  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [notification, setNotification] = useState<React.ReactNode | null>(null);

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

  useEffect(() => {
    if (notification) {
      const timer = setTimeout(() => setNotification(null), 12000);
      return () => clearTimeout(timer);
    }
  }, [notification]);
  const [media, setMedia] = useState<MediaAsset[]>(initialData?.media || []);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);

  // Form states
  const [title, setTitle] = useState(initialData?.title || '');
  const [price, setPrice] = useState('');
  const [description, setDescription] = useState('');
  
  // New States for Smart Upload
  const [subCategory, setSubCategory] = useState('');
  const [yards, setYards] = useState('');
  const [measurements, setMeasurements] = useState('');
  const [styleDescription, setStyleDescription] = useState('');
  const [serviceType, setServiceType] = useState<'MEN' | 'WOMEN'>('MEN');
  
  // Apparel states
  const [gender, setGender] = useState<'MALE' | 'FEMALE' | 'UNISEX'>('UNISEX');
  const [size, setSize] = useState('');
  const [brand, setBrand] = useState('');
  const [condition, setCondition] = useState('');

  // Auto states
  const [vin, setVin] = useState(initialData?.vin || '');
  const [mileage, setMileage] = useState('');
  const [year, setYear] = useState(initialData?.year || '');
  const [make, setMake] = useState(initialData?.make || '');
  const [model, setModel] = useState(initialData?.model || '');
  const [transmission, setTransmission] = useState('Automatic');
  const [isRegistered, setIsRegistered] = useState('Registered');
  const [negotiable, setNegotiable] = useState(true);
  const [phone, setPhone] = useState('08138642942'); // prefill with standard Nigerian phone number/default or empty if custom

  // Jersey states
  const [team, setTeam] = useState('');
  const [season, setSeason] = useState('');
  const [jerseyType, setJerseyType] = useState('Home');
  const [sport, setSport] = useState<'football' | 'baseball' | 'rugby'>('football');
  const [baseColor, setBaseColor] = useState('#4f46e5');

  // Load and apply initialData changes (editing or VIN transition)
  useEffect(() => {
    if (initialData) {
      console.log('ListingForm: Loading initial data for editing or transition:', initialData);
      const currentCategory = initialData.categoryType || initialData.category || null;
      setCategory(currentCategory);
      setTitle(initialData.title || '');
      setPrice(initialData.price !== undefined ? String(initialData.price) : '');
      setDescription(initialData.description || '');
      setMedia(initialData.media || initialData.images || []);
      setSelectedTags(initialData.tags || []);
      setSubCategory(initialData.subCategory || '');
      
      if (initialData.fabricDetails) {
        setYards(initialData.fabricDetails.yards || '');
        setSubCategory(initialData.fabricDetails.type || '');
      }
      if (initialData.footwearDetails) {
        setSize(initialData.footwearDetails.size || '');
        setSubCategory(initialData.footwearDetails.type || '');
      }
      if (initialData.sewingDetails) {
        setServiceType(initialData.sewingDetails.serviceType || 'MEN');
        setMeasurements(initialData.sewingDetails.measurements || '');
        setStyleDescription(initialData.sewingDetails.styleDescription || '');
      }
      if (initialData.apparelDetails) {
        setSubCategory(initialData.apparelDetails.type || '');
        setBrand(initialData.apparelDetails.brand || '');
        setSize(initialData.apparelDetails.size || '');
        setCondition(initialData.apparelDetails.condition || '');
        setGender(initialData.apparelDetails.gender || 'UNISEX');
      }
      if (initialData.accessoryDetails) {
        setSubCategory(initialData.accessoryDetails.type || '');
        setBrand(initialData.accessoryDetails.brand || '');
      }
      if (initialData.autoDetails) {
        setMake(initialData.autoDetails.make || initialData.make || '');
        setModel(initialData.autoDetails.model || initialData.model || '');
        setYear(initialData.autoDetails.year !== undefined ? String(initialData.autoDetails.year) : (initialData.year || ''));
        setMileage(initialData.autoDetails.mileage !== undefined ? String(initialData.autoDetails.mileage) : '');
        setCondition(initialData.autoDetails.condition || '');
        setVin(initialData.autoDetails.vin || initialData.vin || '');
        setTransmission(initialData.autoDetails.transmission || 'Automatic');
        setIsRegistered(initialData.autoDetails.isRegistered || 'Registered');
        setPhone(initialData.autoDetails.phone || '08138642942');
        setNegotiable(initialData.autoDetails.negotiable !== undefined ? initialData.autoDetails.negotiable : true);
      }
      if (initialData.jerseyDetails) {
        setTeam(initialData.jerseyDetails.team || '');
        setSeason(initialData.jerseyDetails.season || '');
        setJerseyType(initialData.jerseyDetails.type || 'Home');
        setSport(initialData.jerseyDetails.sport || 'football');
        setBaseColor(initialData.jerseyDetails.baseColor || '#4f46e5');
        setSize(initialData.jerseyDetails.sizes ? initialData.jerseyDetails.sizes.join(', ') : '');
      }
    } else {
      // Clear form states if initialData becomes null
      setCategory(null);
      setTitle('');
      setPrice('');
      setDescription('');
      setMedia([]);
      setSelectedTags([]);
      setSubCategory('');
      setYards('');
      setSize('');
      setMeasurements('');
      setStyleDescription('');
      setServiceType('MEN');
      setGender('UNISEX');
      setBrand('');
      setCondition('');
      setVin('');
      setMileage('');
      setYear('');
      setMake('');
      setModel('');
      setTeam('');
      setSeason('');
    }
  }, [initialData]);

  // Sync registration status for automobiles if 'Brand New' or 'Foreign Used' is selected
  useEffect(() => {
    if (category === CategoryType.AUTOMOBILE && (condition === 'Brand New' || condition === 'Foreign Used')) {
      setIsRegistered('Not Registered');
    }
  }, [condition, category]);

  // Initialize Selected Local Files with progressive status tracking (compressing, uploading, ready, error, progress)
  const [selectedLocalFiles, setSelectedLocalFiles] = useState<{ id: string; file: File; preview: string; status: 'compressing' | 'uploading' | 'ready' | 'error'; progress?: number; url?: string; thumbnailUrl?: string; sizeKB?: number }[]>([]);

  const formRef = useRef<HTMLFormElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const uploadPromisesRef = useRef<{ [key: string]: Promise<string> }>({});

  // Directly handle media area click
  const handleOpenUppy = () => {
    if (!auth.currentUser) {
      setNotification(
        <div className="flex flex-col items-center gap-2 font-sans text-xs">
          <span>Please connect to publish assets.</span>
          <div className="flex items-center gap-2 mt-1">
            <button
              type="button"
              onClick={() => signInWithGoogle().catch(console.error)}
              className="px-2.5 py-1 bg-indigo-600 hover:bg-indigo-700 text-white rounded text-[9px] font-bold tracking-wider transition-colors uppercase outline-none"
            >
              Sign In with Google
            </button>
          </div>
        </div>
      );
      return;
    }
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const filesArray = Array.from(files);
    const batchTotalFiles = Math.max(1, selectedLocalFiles.length + filesArray.length);
    console.log(`Direct Picker: Selected ${filesArray.length} files (total ${batchTotalFiles}). Doing client-side canvas optimization and uploading directly to ImgBB for images...`);

    // Process all files in parallel for instant client-side representation like Jiji & AliExpress
    filesArray.forEach(async (file) => {
      const itemId = Math.random().toString(36).substring(2, 9);
      const initialPreview = URL.createObjectURL(file);

      // Immediately append files with 'compressing' state so previews populate instantly
      setSelectedLocalFiles(prev => [
        ...prev,
        {
          id: itemId,
          file: file,
          preview: initialPreview,
          status: 'compressing',
          sizeKB: file.size / 1024
        }
      ]);

      try {
        let finalFile: Blob | File = file;
        const isImage = file.type.startsWith('image/');
        let displayOptimizedFile: File | null = null;

        if (isImage) {
          console.log(`[File Change] Generating 1200px sharp WebP catalogue display version & preserving high-res original for ${file.name}`);
          displayOptimizedFile = await generateCatalogueDisplayImage(file);
        } else if (file.type.startsWith('video/') && file.size > 200 * 1024 * 1024) {
          throw new Error(`Video is too large (${(file.size / 1024 / 1024).toFixed(1)}MB). Limit is 200MB.`);
        }

        const finalPreview = initialPreview;

        // Put file in 'uploading' status
        setSelectedLocalFiles(prev => prev.map(item => {
          if (item.id === itemId) {
            return {
              id: itemId,
              file: finalFile as File,
              preview: finalPreview,
              status: 'uploading' as const,
              progress: 0,
              sizeKB: finalFile.size / 1024
            };
          }
          return item;
        }));

        let uploadPromise: Promise<{ url: string; thumbnailUrl: string }>;

        if (isImage && displayOptimizedFile) {
          console.log(`[File Change] Initiating upload of original & display version to ImgBB for ${file.name}...`);
          let lastProgress = 0;
          
          const uploadSingle = async () => {
            const [dispUrl, origUrl] = await Promise.all([
              uploadToImgBB(displayOptimizedFile!, displayOptimizedFile!.name, (statusProgress) => {
                const roundedProgress = Math.round(statusProgress * 0.5);
                if (roundedProgress - lastProgress >= 5) {
                  lastProgress = roundedProgress;
                  setSelectedLocalFiles(prev => prev.map(item => item.id === itemId ? { ...item, progress: roundedProgress } : item));
                }
              }),
              uploadToImgBB(file, file.name, (statusProgress) => {
                const roundedProgress = Math.round(50 + statusProgress * 0.5);
                if (roundedProgress - lastProgress >= 5 || roundedProgress === 100) {
                  lastProgress = roundedProgress;
                  setSelectedLocalFiles(prev => prev.map(item => item.id === itemId ? { ...item, progress: roundedProgress } : item));
                }
              })
            ]);
            return { url: origUrl || dispUrl, thumbnailUrl: dispUrl || origUrl };
          };

          uploadPromise = uploadSingle();
        } else {
          // For non-images (videos, etc.) upload to Firebase Storage
          const userId = auth.currentUser?.uid || 'guest';
          const storagePath = `listings/${userId}/${Date.now()}-${file.name}`;
          console.log(`[File Change] Initiating background pre-upload of video to Firebase Storage for ${file.name}...`);
          let lastProgress = 0;
          uploadPromise = uploadFileWithProgress(storagePath, finalFile as File, (statusProgress) => {
            const roundedProgress = Math.round(statusProgress);
            if (roundedProgress - lastProgress >= 5 || roundedProgress === 100) {
              lastProgress = roundedProgress;
              setSelectedLocalFiles(prev => prev.map(item => {
                if (item.id === itemId) {
                  return {
                    ...item,
                    progress: roundedProgress
                  };
                }
                return item;
              }));
            }
          }).then(url => ({ url, thumbnailUrl: url }));
        }

        // Store active Promise in our component reference so that Submit button can await it if needed
        uploadPromisesRef.current[itemId] = uploadPromise.then(res => res.url);

        // Await background completion
        const resultUrls = await uploadPromise;

        // Await complete! Mark as ready and cache the direct URLs
        setSelectedLocalFiles(prev => prev.map(item => {
          if (item.id === itemId) {
            return {
              ...item,
              status: 'ready' as const,
              url: resultUrls.url,
              thumbnailUrl: resultUrls.thumbnailUrl
            };
          }
          return item;
        }));
        
        console.log(`Background upload success for ${file.name}: Original: ${resultUrls.url}, Display: ${resultUrls.thumbnailUrl}`);

      } catch (err: any) {
        console.warn(`File pipeline failed for ${file.name}. Generating safe tiny inline fallback preview...`, err);
        
        try {
          const totalCount = batchTotalFiles;
          const base64Url = await getTinyBase64FallbackVal(file, totalCount);
          if (base64Url) {
            console.log(`Successfully generated safe tiny inline fallback for ${file.name}`);
            
            // Register fallback in our promise tracker
            uploadPromisesRef.current[itemId] = Promise.resolve(base64Url);

            setSelectedLocalFiles(prev => prev.map(item => {
              if (item.id === itemId) {
                return {
                  ...item,
                  status: 'ready' as const,
                  url: base64Url,
                  thumbnailUrl: base64Url,
                  sizeKB: 15
                };
              }
              return item;
            }));
            return;
          }
        } catch (fallbackErr) {
          console.warn('Tiny fallback failed:', fallbackErr);
        }

        setSelectedLocalFiles(prev => prev.map(item => {
          if (item.id === itemId) {
            return {
              ...item,
              status: 'error' as const
            };
          }
          return item;
        }));
        setNotification(`Media pre-upload error for ${file.name}: ${err?.message || String(err)}`);
      }
    });

    // Reset picker
    e.target.value = '';
  };

  // Direct Binding for debugging as requested by user
  useEffect(() => {
    const publishBtn = document.getElementById('publish-asset-button');
    const uploadArea = document.getElementById('main-media-upload-area');

    const handlePublishClick = () => {
      console.log('Direct Binding: #publish-asset-button Clicked Successfully');
    };

    const handleUploadClick = () => {
      console.log('Direct Binding: #main-media-upload-area Clicked Successfully');
      handleOpenUppy();
    };

    if (publishBtn) {
      publishBtn.addEventListener('click', handlePublishClick);
      console.log('Direct event listener connected to #publish-asset-button');
    }

    if (uploadArea) {
      uploadArea.addEventListener('click', handleUploadClick);
      console.log('Direct event listener connected to #main-media-upload-area');
    }

    return () => {
      publishBtn?.removeEventListener('click', handlePublishClick);
      uploadArea?.removeEventListener('click', handleUploadClick);
    };
  }, [category, media.length]); // Re-bind if category changes structure

  // Draft Sync Logic
  useEffect(() => {
    const userId = auth.currentUser?.uid;
    if (!userId) return;
    
    const loadDraft = async () => {
      if (initialData) return; // Do not load draft if we have initial data from a search/transfer
      
      const docRef = doc(db, 'drafts', userId);
      try {
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          const draft = docSnap.data().formData;
          if (draft.title) setTitle(draft.title);
          if (draft.price) setPrice(draft.price);
          if (draft.description) setDescription(draft.description);
          // Force category selection for new products even if a draft exists
          // because users felt it auto-selected automotive too aggressively.
          // if (draft.category) setCategory(draft.category);
          setCategory(null); 
          if (draft.media) setMedia(draft.media);
          if (draft.selectedTags) setSelectedTags(draft.selectedTags);
          if (draft.subCategory) setSubCategory(draft.subCategory);
          if (draft.yards) setYards(draft.yards);
          if (draft.measurements) setMeasurements(draft.measurements);
          if (draft.styleDescription) setStyleDescription(draft.styleDescription);
          if (draft.serviceType) setServiceType(draft.serviceType);
          if (draft.gender) setGender(draft.gender);
          if (draft.size) setSize(draft.size);
          if (draft.brand) setBrand(draft.brand);
          if (draft.condition) setCondition(draft.condition);
          if (draft.vin) setVin(draft.vin);
          if (draft.mileage) setMileage(draft.mileage);
          if (draft.year) setYear(draft.year);
          if (draft.make) setMake(draft.make);
          if (draft.model) setModel(draft.model);
          if (draft.team) setTeam(draft.team);
          if (draft.season) setSeason(draft.season);
          if (draft.jerseyType) setJerseyType(draft.jerseyType);
          if (draft.sport) setSport(draft.sport);
          if (draft.baseColor) setBaseColor(draft.baseColor);
        }
      } catch (error) {
        handleFirestoreError(error, OperationType.GET, `drafts/${userId}`);
      }
    };
    loadDraft();
  }, []);

  useEffect(() => {
    const userId = auth.currentUser?.uid;
    if (!userId || loading || (initialData && initialData.id)) return;
    
    const saveDraft = async () => {
      const docRef = doc(db, 'drafts', userId);
      try {
        await setDoc(docRef, {
          userId,
          formData: { 
            title, price, description, category, media, selectedTags,
            subCategory, yards, measurements, styleDescription, serviceType,
            gender, size, brand, condition,
            vin, mileage, year, make, model,
            team, season, jerseyType, sport, baseColor
          },
          updatedAt: serverTimestamp()
        }, { merge: true });
      } catch (error) {
        handleFirestoreError(error, OperationType.WRITE, `drafts/${userId}`);
      }
    };

    const timeout = setTimeout(saveDraft, 2000);
    return () => clearTimeout(timeout);
  }, [title, price, description, category, media, selectedTags, subCategory, yards, measurements, styleDescription, serviceType, gender, size, brand, condition, vin, mileage, year, make, model, team, season, jerseyType, sport, baseColor, loading]);

  const toggleTag = (tag: string) => {
    setSelectedTags(prev => 
      prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]
    );
  };

  const removeMedia = (index: number) => {
    setMedia(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    
    console.log('Form submission started');

    const userId = auth.currentUser?.uid;
    if (!userId) {
      console.warn('Submission aborted: No user');
      setNotification(
        <div className="flex flex-col items-center gap-2 font-sans text-xs">
          <span>Sign In required to publish listings.</span>
          <div className="flex items-center gap-2 mt-1">
            <button
              type="button"
              onClick={() => signInWithGoogle().catch(console.error)}
              className="px-2.5 py-1 bg-indigo-600 hover:bg-indigo-700 text-white rounded text-[9px] font-bold tracking-wider transition-colors uppercase outline-none"
            >
              Sign In with Google
            </button>
          </div>
        </div>
      );
      return;
    }

    // If we are already loading, ignore
    if (loading) return;

    // Validate if any local files are still optimizing in background
    const stillCompressing = selectedLocalFiles.some(f => f.status === 'compressing');
    if (stillCompressing) {
      setNotification("Please wait a moment while we finish optimizing your selected files.");
      return;
    }

    // Validate if any local files had errors
    const hasErrors = selectedLocalFiles.some(f => f.status === 'error');
    if (hasErrors) {
      setNotification("Some of your selected files had preprocessing errors. Please remove them and select again.");
      return;
    }

    if (media.length === 0 && selectedLocalFiles.length === 0) {
      console.log('Submission aborted: No media assets');
      setNotification("Please select at least one image or video to post.");
      return;
    }
    
    setLoading(true);
    
    try {
      const uploadedMedia: MediaAsset[] = [...media];

      if (selectedLocalFiles.length > 0) {
        console.log(`[Submission] Processing ${selectedLocalFiles.length} local files...`);
        
        for (let i = 0; i < selectedLocalFiles.length; i++) {
          const local = selectedLocalFiles[i];
          const type = local.file.type.startsWith('video/') ? 'video' as const : 'image' as const;
          
          let originalUrl = '';
          let displayUrl = '';
          
          // Check if we already have a valid remote URL (not data: or blob:, starts with http)
          const isUrlRemote = local.url && 
            local.url.startsWith('http') && 
            !local.url.startsWith('data:') && 
            !local.url.includes('blob:');
            
          if (isUrlRemote) {
            originalUrl = local.url!;
            displayUrl = local.thumbnailUrl || local.url!;
            console.log(`[Submission] Reusing already uploaded URL for ${local.file.name}: orig=${originalUrl}, disp=${displayUrl}`);
          } else {
            if (type === 'image') {
              console.log(`[Submission] Generating display version & uploading image to ImgBB: ${local.file.name}`);
              setNotification(`Processing & uploading image ${i + 1} of ${selectedLocalFiles.length} to ImgBB...`);
              
              const displayFile = await generateCatalogueDisplayImage(local.file);
              const [origUrl, dispUrl] = await Promise.all([
                uploadToImgBB(local.file, local.file.name),
                uploadToImgBB(displayFile, displayFile.name)
              ]);
              originalUrl = origUrl || dispUrl;
              displayUrl = dispUrl || origUrl;
              console.log(`[Submission] ImgBB upload complete: orig=${originalUrl}, disp=${displayUrl}`);
            } else {
              // Upload the actual raw file directly to Firebase Storage right now for video files
              const storagePath = `listings/${userId}/${Date.now()}-${local.file.name}`;
              console.log(`[Submission] Uploading actual video file to Firebase Storage: ${local.file.name} to path ${storagePath}`);
              
              setNotification(`Uploading video ${i + 1} of ${selectedLocalFiles.length} to Cloud Storage...`);
              
              originalUrl = await uploadFileWithProgress(storagePath, local.file);
              displayUrl = originalUrl;
              console.log(`[Submission] Upload complete! Permanent download URL: ${originalUrl}`);
            }
          }

          uploadedMedia.push({
            url: originalUrl,
            type,
            thumbnailUrl: displayUrl
          });
        }
      }

      const silo: 'wardrobe' | 'garage' | 'jersey' = 
        category === CategoryType.AUTOMOBILE ? 'garage' : 
        category === CategoryType.JERSEY ? 'jersey' : 'wardrobe';

      // Keep ID stable across edit / transitions, or generate unique ID once
      const finalId = initialData?.id || Math.random().toString(36).substring(2, 11) + '-' + Date.now();

      const rawAsset: any = {
        id: finalId,
        title,
        price: parseFloat(price) || 0,
        description,
        tags: selectedTags,
        images: uploadedMedia,
        media: uploadedMedia,
        categoryType: category!,
        subCategory,
        fabricDetails: category === CategoryType.FABRICS ? { type: subCategory, yards } : undefined,
        footwearDetails: category === CategoryType.FOOTWEAR ? { type: subCategory, size } : undefined,
        sewingDetails: category === CategoryType.SEWING_SERVICES ? { serviceType, measurements, styleDescription } : undefined,
        apparelDetails: category === CategoryType.APPAREL ? { type: subCategory, brand, size, condition, gender } : undefined,
        accessoryDetails: category === CategoryType.ACCESSORIES ? { type: subCategory, brand } : undefined,
        autoDetails: category === CategoryType.AUTOMOBILE ? {
          make: title || 'Car',
          model: '',
          year: 2026,
          mileage: parseFloat(mileage) || 0,
          condition: condition || 'Used',
          vin: vin || '',
          transmission: transmission || 'Automatic',
          isRegistered: isRegistered || 'Registered',
          phone: phone || '',
          negotiable: negotiable || false
        } : undefined,
        jerseyDetails: category === CategoryType.JERSEY ? {
          team,
          season,
          sport,
          baseColor,
          type: jerseyType,
          sizes: size.split(',').map(s => s.trim())
        } : undefined,
        siloType: silo
      };

      // Remove undefined fields to prevent Firestore upload errors
      const newAsset = Object.fromEntries(
        Object.entries(rawAsset).filter(([_, v]) => v !== undefined)
      );

      // Instantly post to Firestore
      await onAddAsset(newAsset, silo);
      
      // Clear draft on success
      try {
        await deleteDoc(doc(db, 'drafts', userId));
      } catch (error) {
        console.warn('Draft cleanup failed', error);
      }

      // Evict object URLs
      selectedLocalFiles.forEach(local => {
        try {
          URL.revokeObjectURL(local.preview);
        } catch (e) {}
      });

      setSuccess(true);
      
      setTimeout(() => {
        setSuccess(false);
        setCategory(null);
        setMedia([]);
        setSelectedLocalFiles([]);
        setSelectedTags([]);
        
        // Clear all form states
        setTitle('');
        setPrice('');
        setDescription('');
        setBrand('');
        setSize('');
        setCondition('');
        setVin('');
        setMileage('');
        setYear('');
        setMake('');
        setModel('');
        setSubCategory('');
        setYards('');
        setMeasurements('');
        setStyleDescription('');
        setTeam('');
        setSeason('');
      }, 1500);
    } catch (error: any) {
      console.error('Submission error (detailed):', error);
      const errMsg = error?.message || String(error);
      setNotification(`Failed to publish asset: ${errMsg}`);
      try {
        handleFirestoreError(error, OperationType.WRITE, 'listings');
      } catch (e) {
        // Prevent rethrow from blocking state resets
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="border-none shadow-2xl bg-white rounded-[2rem] max-h-[90vh] flex flex-col overflow-hidden">
      <div className="flex-1 overflow-y-auto custom-scrollbar">
        <div className="p-6 md:p-10 pb-20">
          <AnimatePresence mode="wait">
            {!category ? (
              <motion.div
                key="selection"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 1.05 }}
                className="space-y-10 py-10"
              >
                <div className="text-center space-y-3">
                  <h2 className="text-4xl font-light italic tracking-tight text-slate-900">
                    {initialData?.id ? 'Update Asset Specs' : 'New Asset Transmission'}
                    {initialData?.sku && (
                      <span className="ml-3 text-sm font-mono font-black uppercase text-indigo-600 bg-indigo-55/40 border border-indigo-100 px-2.5 py-1 rounded inline-block align-middle not-italic">
                        SKU: {initialData.sku}
                      </span>
                    )}
                  </h2>
                  <p className="text-[10px] uppercase font-black tracking-[0.3em] text-slate-400">{initialData?.id ? 'Modify specifications to update your current listing' : 'Select business vertical to begin upload'}</p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 max-w-6xl mx-auto px-4">
                  {[
                    { id: CategoryType.FABRICS, label: 'Fabrics & Textiles', desc: 'Yards, Laces, Adire...', icon: Layers },
                    { id: CategoryType.APPAREL, label: 'Premium Apparel', desc: 'Jallabs, Abayas...', icon: Shirt },
                    { id: CategoryType.ACCESSORIES, label: 'Accessories', desc: 'Watches, Caps...', icon: Watch },
                    { id: CategoryType.FOOTWEAR, label: 'Footwear', desc: 'Luxury Shoes', icon: Footprints },
                    { id: CategoryType.SEWING_SERVICES, label: 'Sewing Services', desc: 'Custom Tailoring', icon: Scissors },
                    { id: CategoryType.AUTOMOBILE, label: 'Automotive', desc: 'Luxury Vehicles', icon: Car },
                    { id: CategoryType.JERSEY, label: 'Jersey Studio', desc: 'Custom Kits', icon: Star },
                  ].map((item) => (
                    <button
                      key={item.id}
                      onClick={() => {
                        setCategory(item.id);
                        setSubCategory('');
                      }}
                      className="group relative p-6 bg-slate-50 rounded-2xl border-2 border-transparent hover:border-indigo-600 transition-all text-center space-y-4"
                    >
                      <div className="w-12 h-12 bg-white rounded-xl shadow-md flex items-center justify-center mx-auto group-hover:scale-110 transition-transform">
                        <item.icon className="w-6 h-6 text-indigo-600" />
                      </div>
                      <div>
                        <h3 className="font-bold text-sm text-slate-900">{item.label}</h3>
                        <p className="text-[10px] text-slate-400 mt-1">{item.desc}</p>
                      </div>
                    </button>
                  ))}
                </div>
              </motion.div>
            ) : (
              <motion.form
                key="form"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                onSubmit={handleSubmit}
                ref={formRef}
                className="space-y-8"
              >
                <AnimatePresence>
                  {notification && (
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-amber-700 text-[10px] font-bold uppercase tracking-widest text-center"
                    >
                      {notification}
                    </motion.div>
                  )}
                </AnimatePresence>
                <div className="flex items-center justify-between mb-8">
                  <div className="flex items-center gap-4">
                    <button 
                      type="button" 
                      onClick={() => setCategory(null)}
                      className="p-2 hover:bg-slate-100 rounded-lg transition-colors group"
                      title="Change Category"
                    >
                      <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-indigo-600 rotate-180" />
                    </button>
                    <div>
                      <h3 className="text-[10px] uppercase tracking-widest font-black text-indigo-600">{initialData?.id ? 'Asset Revision Protocol' : 'Sequential Form Alpha'}</h3>
                      <p className="text-xl font-bold text-slate-900 tracking-tight">
                        {category === CategoryType.AUTOMOBILE ? 'Automotive Details' : 
                         category === CategoryType.JERSEY ? 'Jersey Studio' : 
                         category === CategoryType.FABRICS ? 'Fabric Specs' :
                         category === CategoryType.APPAREL ? 'Apparel Logistics' :
                         category === CategoryType.FOOTWEAR ? 'Footwear Details' :
                         category === CategoryType.SEWING_SERVICES ? 'Tailoring Protocol' : 'Accessory Specs'}
                      </p>
                    </div>
                  </div>
                  <div className="px-4 py-1.5 bg-indigo-50 rounded-full border border-indigo-100">
                    <span className="text-[9px] font-black uppercase text-indigo-600 tracking-widest">{category}</span>
                  </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
                  {/* Left Column: Asset Media */}
                  <div className="lg:col-span-5 space-y-6">
                    <h3 className="text-[10px] uppercase tracking-widest font-black text-indigo-600">Asset Media</h3>
                    <div className="space-y-4 relative z-10">
                      {/* Hidden native input for direct system access */}
                      <input 
                        type="file" 
                        ref={fileInputRef} 
                        onChange={handleFileChange} 
                        multiple 
                        accept=".heic, .jpg, .jpeg, .png, image/heic, video/*" 
                        className="hidden" 
                      />
                      {media.length === 0 && selectedLocalFiles.length === 0 ? (
                        <div 
                          id="main-media-upload-area"
                          className="group relative aspect-video border-2 border-dashed border-slate-200 rounded-2xl bg-slate-50 flex flex-col items-center justify-center cursor-pointer hover:border-indigo-400 hover:bg-slate-100/50 transition-all overflow-hidden pointer-events-auto"
                          onClick={handleOpenUppy}
                        >
                          <Upload className="w-8 h-8 text-slate-300 group-hover:text-indigo-500 mb-2 transition-colors" />
                          <span className="text-[10px] font-bold text-slate-400 group-hover:text-indigo-500 uppercase tracking-widest">Connect Media Gallery</span>
                          <p className="text-[8px] text-slate-400 mt-2">Direct System Access (Up to 1GB)</p>
                        </div>
                      ) : (
                        <div className="grid grid-cols-2 gap-3">
                          {media.map((item, i) => (
                            <div key={`media-${i}`} className="aspect-square rounded-xl border border-slate-100 overflow-hidden relative group">
                              <img src={item.thumbnailUrl || item.url} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                              <button 
                                type="button"
                                onClick={() => removeMedia(i)}
                                className="absolute top-1 right-1 p-1 bg-black/50 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                              >
                                <X className="w-3 h-3 text-white" />
                              </button>
                            </div>
                          ))}

                          {selectedLocalFiles.map((item) => (
                            <div key={item.id} className="aspect-square rounded-xl border border-slate-100 overflow-hidden relative group">
                              <img src={item.preview} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                              
                              {/* Background Optimization Real-time Overlay */}
                              {item.status === 'compressing' && (
                                <div className="absolute inset-x-0 bottom-0 bg-black/60 py-1 px-1.5 flex items-center justify-center gap-1 text-[8px] font-black text-white tracking-widest select-none z-10 animate-pulse">
                                  <Loader2 className="w-2.5 h-2.5 text-indigo-400 animate-spin" />
                                  <span>PREPARING...</span>
                                </div>
                              )}
                              
                              {item.status === 'uploading' && (
                                <div className="absolute inset-x-0 bottom-0 bg-black/60 py-1.5 px-2 flex items-center justify-between text-[8px] font-black text-white tracking-widest select-none z-10">
                                  <div className="flex items-center gap-1">
                                    <Loader2 className="w-2.5 h-2.5 text-indigo-400 animate-spin" />
                                    <span>UPLOADING</span>
                                  </div>
                                  <span>{item.progress ?? 0}%</span>
                                  <div className="absolute bottom-0 left-0 h-0.5 bg-indigo-500 transition-all duration-300" style={{ width: `${item.progress ?? 0}%` }} />
                                </div>
                              )}
                              
                              {item.status === 'ready' && (
                                <div className="absolute top-1.5 left-1.5 bg-emerald-500/90 border border-emerald-400/30 text-white rounded px-1.5 py-0.5 text-[7px] font-black tracking-widest uppercase z-10 shadow-sm hover:opacity-100 transition-all">
                                  {item.sizeKB ? `${item.sizeKB.toFixed(0)}KB` : 'READY'}
                                </div>
                              )}
                              
                              {item.status === 'error' && (
                                <div className="absolute inset-0 bg-rose-500/95 flex flex-col items-center justify-center text-[10px] font-bold text-white p-2 text-center z-10">
                                  <X className="w-5 h-5 mb-1" />
                                  <span>ERROR</span>
                                </div>
                              )}

                              <button 
                                type="button"
                                onClick={() => {
                                  setSelectedLocalFiles(prev => prev.filter(f => f.id !== item.id));
                                  try {
                                    URL.revokeObjectURL(item.preview);
                                  } catch (e) {}
                                }}
                                className="absolute top-1.5 right-1.5 p-1 bg-black/60 hover:bg-black/80 rounded-full opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity z-20 shadow-md"
                              >
                                <X className="w-3 h-3 text-white" />
                              </button>
                            </div>
                          ))}

                          <button 
                            id="manage-media-button"
                            type="button"
                            onClick={handleOpenUppy}
                            className={cn(
                              "aspect-square rounded-xl border border-dashed border-indigo-200 bg-indigo-50 flex flex-col items-center justify-center gap-1 hover:bg-indigo-100 transition-all pointer-events-auto",
                              (media.length + selectedLocalFiles.length) >= 12 && "hidden"
                            )}
                          >
                            <Plus className="w-4 h-4 text-indigo-500" />
                            <span className="text-[8px] font-black text-indigo-500 uppercase">Add More</span>
                          </button>
                        </div>
                      )}
                    </div>

                    <div className="pt-2">
                      <div className="p-4 bg-slate-50/80 rounded-2xl border-2 border-slate-100 flex items-center justify-between gap-4">
                        <div className="space-y-1">
                          <span className="text-[10px] font-black uppercase text-slate-800 tracking-wider block">Image Upload Size</span>
                          <span className="text-[8px] font-medium text-slate-400 block uppercase tracking-wide">Forcing original dimensions on iPhone and mobile uploads</span>
                        </div>
                        <select
                          value={imageUploadSize}
                          onChange={(e) => setImageUploadSize(e.target.value as 'original' | 'compressed')}
                          className="bg-white border-2 border-slate-100 text-[10px] font-black uppercase tracking-wider rounded-xl px-3 py-2 text-slate-800 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all cursor-pointer"
                        >
                          <option value="original">Full / Original image size</option>
                          <option value="compressed">Compressed (600px Limit)</option>
                        </select>
                      </div>
                    </div>

                    <div className="pt-6 space-y-4">
                      <h3 className="text-[10px] uppercase tracking-widest font-black text-indigo-600">Base Details</h3>
                      <div className="space-y-4">
                        <div className="space-y-2">
                          <Label className="text-[11px] font-bold text-slate-700">STORE TAGS (QUICK FILTERING)</Label>
                          <div className="flex flex-wrap gap-2">
                            {['NEW ARRIVAL', 'WEDDING WEAR', 'FRIDAY BEST', 'FEATURED', 'BEST SELLER'].map(tag => (
                              <button 
                                key={tag} 
                                type="button" 
                                onClick={() => toggleTag(tag)}
                                className={cn(
                                  "px-2 py-1 rounded text-[9px] font-bold transition-all uppercase tracking-tighter border",
                                  selectedTags.includes(tag)
                                    ? "bg-indigo-600 border-indigo-600 text-white shadow-md shadow-indigo-100"
                                    : "bg-slate-50 border-slate-200 text-slate-500 hover:bg-indigo-50 hover:border-indigo-200 hover:text-indigo-600"
                                )}
                              >
                                {tag}
                              </button>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Right Column: Specifications */}
                  <div className="lg:col-span-7 space-y-8">
                    {category === CategoryType.AUTOMOBILE ? (
                      <div className="space-y-6">
                        <div className="border-b border-slate-100 pb-4">
                          <h3 className="text-sm uppercase tracking-wider font-extrabold text-indigo-600 mb-1">Automobile Configuration</h3>
                          <p className="text-[10px] text-slate-400 uppercase font-bold">Standard Niger-Delta Garage Posting Schema</p>
                        </div>
                        
                        {/* Name of Car Field (Spacious & Large) */}
                        <div className="space-y-2 col-span-2">
                          <Label className="text-xs font-bold text-slate-800 uppercase tracking-wider">Name of Car</Label>
                          <Input 
                            placeholder="e.g. Toyota Camry 2021 XLE / Mercedes-Benz C305" 
                            className="input-geometric h-14 text-base px-4 py-3 font-semibold placeholder:text-slate-400 border border-slate-200 focus:border-indigo-500 rounded-xl w-full text-slate-900 bg-white"
                            required 
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                          />
                        </div>

                        {/* Mileage & Price fields */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <div className="space-y-2">
                            <Label className="text-xs font-bold text-slate-800 uppercase tracking-wider">Mileage (Kilometers/Miles)</Label>
                            <Input 
                              type="number"
                              placeholder="Odometer Mileage, e.g. 45000" 
                              className="input-geometric h-14 text-base px-4 py-3 font-mono border border-slate-200 focus:focus-within:border-indigo-500 rounded-xl w-full text-slate-900 bg-white"
                              required 
                              value={mileage}
                              onChange={(e) => setMileage(e.target.value)}
                            />
                          </div>
                          <div className="space-y-2">
                            <Label className="text-xs font-bold text-slate-800 uppercase tracking-wider">Valuation Price (₦)</Label>
                            <Input 
                              type="number"
                              placeholder="Price in Naira, e.g. 15000000" 
                              className="input-geometric h-14 text-base px-4 py-3 font-mono font-bold border border-slate-200 focus:focus-within:border-indigo-500 rounded-xl w-full text-slate-900 bg-white"
                              required 
                              value={price}
                              onChange={(e) => setPrice(e.target.value)}
                            />
                          </div>
                        </div>

                        {/* Condition & Transmission */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <div className="space-y-2">
                            <Label className="text-xs font-bold text-slate-800 uppercase tracking-wider">Vehicular Condition</Label>
                            <Select value={condition} onValueChange={setCondition}>
                              <SelectTrigger className="bg-white border border-slate-200 h-14 text-sm font-medium px-4 rounded-xl focus:ring-indigo-500 focus:border-indigo-500 text-slate-900 shadow-sm">
                                <SelectValue placeholder="Select Condition" />
                              </SelectTrigger>
                              <SelectContent className="bg-white border border-slate-200 rounded-xl shadow-lg z-[200]">
                                <SelectItem value="Brand New">Brand New</SelectItem>
                                <SelectItem value="Foreign Used">Foreign Used (Tokunbo)</SelectItem>
                                <SelectItem value="Local Used">Nigerian Used</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          <div className="space-y-2">
                            <Label className="text-xs font-bold text-slate-800 uppercase tracking-wider">Transmission Type</Label>
                            <Select value={transmission} onValueChange={setTransmission}>
                              <SelectTrigger className="bg-white border border-slate-200 h-14 text-sm font-medium px-4 rounded-xl focus:ring-indigo-500 focus:border-indigo-500 text-slate-900 shadow-sm">
                                <SelectValue placeholder="Select Transmission" />
                              </SelectTrigger>
                              <SelectContent className="bg-white border border-slate-200 rounded-xl shadow-lg z-[200]">
                                <SelectItem value="Automatic">Automatic</SelectItem>
                                <SelectItem value="Manual">Manual</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                        </div>

                        {/* VIN & Registered Status */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <div className={cn("space-y-2", (condition === 'Brand New' || condition === 'Foreign Used') && "md:col-span-2")}>
                            <Label className="text-xs font-bold text-slate-800 uppercase tracking-wider">VIN (17-CHARACTER IDENTIFIER)</Label>
                            <Input 
                              placeholder="Enter Chassis Number/VIN" 
                              className="input-geometric h-14 text-base px-4 py-3 uppercase font-mono border border-slate-200 focus:focus-within:border-indigo-500 rounded-xl w-full text-slate-900 bg-white"
                              maxLength={17} 
                              value={vin}
                              onChange={(e) => setVin(e.target.value)}
                            />
                          </div>
                          {condition !== 'Brand New' && condition !== 'Foreign Used' && (
                            <div className="space-y-2">
                              <Label className="text-xs font-bold text-slate-800 uppercase tracking-wider">Registration Status</Label>
                              <Select value={isRegistered} onValueChange={setIsRegistered}>
                                <SelectTrigger className="bg-white border border-slate-200 h-14 text-sm font-medium px-4 rounded-xl focus:ring-indigo-500 focus:border-indigo-500 text-slate-900 shadow-sm">
                                  <SelectValue placeholder="Is Registered?" />
                                </SelectTrigger>
                                <SelectContent className="bg-white border border-slate-200 rounded-xl shadow-lg z-[200]">
                                  <SelectItem value="Registered">Registered</SelectItem>
                                  <SelectItem value="Not Registered">Not Registered</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                          )}
                        </div>

                        {/* Phone Number & Negotiation */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
                          <div className="space-y-2">
                            <Label className="text-xs font-bold text-slate-800 uppercase tracking-wider">Seller Phone Number</Label>
                            <Input 
                              type="tel"
                              placeholder="e.g. 08138642942" 
                              className="input-geometric h-14 text-base px-4 py-3 font-mono border border-slate-200 focus:focus-within:border-indigo-500 rounded-xl w-full text-slate-900 bg-white"
                              required 
                              value={phone}
                              onChange={(e) => setPhone(e.target.value)}
                            />
                          </div>
                          <div className="flex items-center gap-3 bg-white border border-slate-200 p-4 rounded-xl h-14 mt-6 shadow-sm">
                            <input 
                              type="checkbox" 
                              id="negotiable-switch"
                              checked={negotiable}
                              onChange={(e) => setNegotiable(e.target.checked)}
                              className="w-5 h-5 accent-indigo-600 rounded text-indigo-600 focus:ring-indigo-500 border-slate-300"
                            />
                            <Label htmlFor="negotiable-switch" className="text-xs font-bold text-slate-700 cursor-pointer select-none">
                              Allow Pricing Bids / Negotiations
                            </Label>
                          </div>
                        </div>

                        {/* Description Area (Very Spacious) */}
                        <div className="space-y-2">
                          <Label className="text-xs font-bold text-slate-800 uppercase tracking-wider">Vehicle Public Description</Label>
                          <textarea 
                            className="w-full flex min-h-[140px] rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 focus:outline-none transition-all resize-none shadow-sm text-slate-900"
                            placeholder="Provide details on mechanical health, AC performance, wear and tear, and history..."
                            required
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                          />
                        </div>
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
                      <div className="col-span-1 md:col-span-2 space-y-6">
                        <h3 className="text-[10px] uppercase tracking-widest font-black text-indigo-600">Identification</h3>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                          <div className="md:col-span-2 space-y-2">
                            <Label className="text-[11px] font-bold text-slate-700">ASSET TITLE</Label>
                            <Input 
                              placeholder="e.g. Royal Blue Atampha / Rolex Datejust" 
                              className="input-geometric h-11" 
                              required 
                              value={title}
                              onChange={(e) => setTitle(e.target.value)}
                            />
                          </div>
                          <div className="space-y-2">
                            <Label className="text-[11px] font-bold text-slate-700">VALUATION (₦)</Label>
                            <Input 
                              type="number" 
                              placeholder="0.00" 
                              className="input-geometric h-11 font-mono" 
                              required 
                              value={price}
                              onChange={(e) => setPrice(e.target.value)}
                            />
                          </div>
                        </div>
                      </div>

                      <div className="col-span-1 md:col-span-2">
                        <h3 className="text-[10px] uppercase tracking-widest font-black text-indigo-600 mb-6">Vertical Specifications</h3>
                        
                        {category === CategoryType.FABRICS && (
                          <div className="grid grid-cols-2 gap-6">
                            <div className="space-y-2">
                              <Label className="text-[11px] font-bold text-slate-700">FABRIC TYPE</Label>
                              <Select value={subCategory} onValueChange={setSubCategory}>
                                <SelectTrigger className="bg-slate-100 border-none h-11">
                                  <SelectValue placeholder="Select Type" />
                                </SelectTrigger>
                                <SelectContent className="bg-white border-slate-200">
                                  {['Yards', 'Laces', 'Menlace', 'Adire', 'Atampha', 'Lafaya', 'Veils', 'Bridal Wears'].map(t => (
                                    <SelectItem key={t} value={t}>{t}</SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>
                            <div className="space-y-2">
                              <Label className="text-[11px] font-bold text-slate-700">YARDS / MEASUREMENT</Label>
                              <Input 
                                placeholder="e.g. 5 Yards" 
                                className="input-geometric h-11" 
                                value={yards}
                                onChange={(e) => setYards(e.target.value)}
                              />
                            </div>
                          </div>
                        )}

                        {category === CategoryType.APPAREL && (
                          <div className="grid grid-cols-2 gap-x-6 gap-y-6">
                            <div className="space-y-2">
                              <Label className="text-[11px] font-bold text-slate-700">SUB-CATEGORY</Label>
                              <Select value={subCategory} onValueChange={setSubCategory}>
                                <SelectTrigger className="bg-slate-100 border-none h-11">
                                  <SelectValue placeholder="Select" />
                                </SelectTrigger>
                                <SelectContent className="bg-white border-slate-200">
                                  <SelectItem value="Jallabs">Jallabs</SelectItem>
                                  <SelectItem value="Abayas">Abayas</SelectItem>
                                  <SelectItem value="Other">Other apparel</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                            <div className="space-y-2">
                              <Label className="text-[11px] font-bold text-slate-700">GENDER</Label>
                              <Select value={gender} onValueChange={(val: any) => setGender(val)}>
                                <SelectTrigger className="bg-slate-100 border-none h-11 transition-all">
                                  <SelectValue placeholder="Select" />
                                </SelectTrigger>
                                <SelectContent className="bg-white border-slate-200">
                                  <SelectItem value="MALE">Male</SelectItem>
                                  <SelectItem value="FEMALE">Female</SelectItem>
                                  <SelectItem value="UNISEX">Unisex</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                            <div className="space-y-2">
                              <Label className="text-[11px] font-bold text-slate-700">SIZE</Label>
                              <Input 
                                placeholder="e.g. XL" 
                                className="input-geometric h-11" 
                                value={size}
                                onChange={(e) => setSize(e.target.value)}
                              />
                            </div>
                            <div className="space-y-2">
                              <Label className="text-[11px] font-bold text-slate-700">BRAND</Label>
                              <Input 
                                placeholder="e.g. Hermès" 
                                className="input-geometric h-11" 
                                value={brand}
                                onChange={(e) => setBrand(e.target.value)}
                              />
                            </div>
                            <div className="space-y-2 col-span-2">
                              <Label className="text-[11px] font-bold text-slate-700">CONDITION</Label>
                              <Input 
                                placeholder="e.g. Brand New" 
                                className="input-geometric h-11" 
                                value={condition}
                                onChange={(e) => setCondition(e.target.value)}
                              />
                            </div>
                          </div>
                        )}

                        {category === CategoryType.ACCESSORIES && (
                          <div className="grid grid-cols-2 gap-6">
                            <div className="space-y-2">
                              <Label className="text-[11px] font-bold text-slate-700">ACCESSORY TYPE</Label>
                              <Select value={subCategory} onValueChange={setSubCategory}>
                                <SelectTrigger className="bg-slate-100 border-none h-11">
                                  <SelectValue placeholder="Select" />
                                </SelectTrigger>
                                <SelectContent className="bg-white border-slate-200">
                                  <SelectItem value="Watches">Watches</SelectItem>
                                  <SelectItem value="Caps">Caps</SelectItem>
                                  <SelectItem value="Other">Other</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                            <div className="space-y-2">
                              <Label className="text-[11px] font-bold text-slate-700">BRAND</Label>
                              <Input 
                                placeholder="e.g. Rolex" 
                                className="input-geometric h-11" 
                                value={brand}
                                onChange={(e) => setBrand(e.target.value)}
                              />
                            </div>
                          </div>
                        )}

                        {category === CategoryType.FOOTWEAR && (
                          <div className="grid grid-cols-2 gap-6">
                            <div className="space-y-2">
                              <Label className="text-[11px] font-bold text-slate-700">TYPE</Label>
                              <Input 
                                placeholder="e.g. Sneakers" 
                                className="input-geometric h-11" 
                                value={subCategory}
                                onChange={(e) => setSubCategory(e.target.value)}
                              />
                            </div>
                            <div className="space-y-2">
                              <Label className="text-[11px] font-bold text-slate-700">SIZE (EU/UK/US)</Label>
                              <Input 
                                placeholder="e.g. 42" 
                                className="input-geometric h-11" 
                                value={size}
                                onChange={(e) => setSize(e.target.value)}
                              />
                            </div>
                          </div>
                        )}

                        {category === CategoryType.SEWING_SERVICES && (
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-2">
                              <Label className="text-[11px] font-bold text-slate-700">SERVICE FOR</Label>
                              <Select value={serviceType} onValueChange={(val: any) => setServiceType(val)}>
                                <SelectTrigger className="bg-slate-100 border-none h-11">
                                  <SelectValue placeholder="Select" />
                                </SelectTrigger>
                                <SelectContent className="bg-white border-slate-200">
                                  <SelectItem value="MEN">Men's Wear</SelectItem>
                                  <SelectItem value="WOMEN">Women's Wear</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                            <div className="space-y-2">
                              <Label className="text-[11px] font-bold text-slate-700">MEASUREMENTS</Label>
                              <Input 
                                placeholder="e.g. Neck: 15, Chest: 40..." 
                                className="input-geometric h-11" 
                                value={measurements}
                                onChange={(e) => setMeasurements(e.target.value)}
                              />
                            </div>
                            <div className="space-y-2 col-span-1 md:col-span-2">
                              <Label className="text-[11px] font-bold text-slate-700">STYLE DESCRIPTION</Label>
                              <textarea 
                                className="w-full flex min-h-[80px] rounded-md border-none bg-slate-100 px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 transition-all resize-none"
                                placeholder="Describe the style requested..."
                                value={styleDescription}
                                onChange={(e) => setStyleDescription(e.target.value)}
                              />
                            </div>
                          </div>
                        )}

                        {category === CategoryType.JERSEY && (
                          <div className="grid grid-cols-2 gap-x-6 gap-y-6">
                            <div className="space-y-2">
                              <Label className="text-[11px] font-bold text-slate-700">SPORT TYPE</Label>
                              <Select value={sport} onValueChange={(val: any) => setSport(val)}>
                                <SelectTrigger className="bg-slate-100 border-none h-11 transition-all">
                                  <SelectValue placeholder="Select Sport" />
                                </SelectTrigger>
                                <SelectContent className="bg-white border-slate-200">
                                  <SelectItem value="football">Football (Soccer)</SelectItem>
                                  <SelectItem value="baseball">Baseball</SelectItem>
                                  <SelectItem value="rugby">Rugby</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                            <div className="space-y-2">
                              <Label className="text-[11px] font-bold text-slate-700">BASE KIT COLOR</Label>
                              <div className="flex gap-2">
                                <Input 
                                  type="color" 
                                  className="w-12 h-11 p-1 bg-slate-100 border-none cursor-pointer" 
                                  value={baseColor}
                                  onChange={(e) => setBaseColor(e.target.value)}
                                />
                                <Input 
                                  className="flex-1 input-geometric h-11 font-mono uppercase" 
                                  value={baseColor}
                                  onChange={(e) => setBaseColor(e.target.value)}
                                />
                              </div>
                            </div>
                            <div className="space-y-2">
                              <Label className="text-[11px] font-bold text-slate-700">TEAM / CLUB</Label>
                              <Input 
                                placeholder="e.g. Real Madrid" 
                                className="input-geometric h-11" 
                                value={team}
                                onChange={(e) => setTeam(e.target.value)}
                              />
                            </div>
                            <div className="space-y-2">
                              <Label className="text-[11px] font-bold text-slate-700">SEASON</Label>
                              <Input 
                                placeholder="e.g. 2024/25" 
                                className="input-geometric h-11" 
                                value={season}
                                onChange={(e) => setSeason(e.target.value)}
                              />
                            </div>
                            <div className="space-y-2">
                              <Label className="text-[11px] font-bold text-slate-700">TYPE</Label>
                              <Select value={jerseyType} onValueChange={(val: any) => setJerseyType(val)}>
                                <SelectTrigger className="bg-slate-100 border-none h-11 transition-all">
                                  <SelectValue placeholder="Select" />
                                </SelectTrigger>
                                <SelectContent className="bg-white border-slate-200">
                                  <SelectItem value="Home">Home</SelectItem>
                                  <SelectItem value="Away">Away</SelectItem>
                                  <SelectItem value="Third">Third</SelectItem>
                                  <SelectItem value="Special">Special</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                            <div className="space-y-2">
                              <Label className="text-[11px] font-bold text-slate-700">AVAILABLE SIZES (COMMA SEPARATED)</Label>
                              <Input 
                                placeholder="S, M, L, XL" 
                                className="input-geometric h-11" 
                                value={size}
                                onChange={(e) => setSize(e.target.value)}
                              />
                            </div>
                          </div>
                        )}


                      </div>

                      <div className="col-span-1 md:col-span-2 space-y-2">
                        <Label className="text-[11px] font-bold text-slate-700">PUBLIC DESCRIPTION</Label>
                        <textarea 
                          className="w-full flex min-h-[100px] rounded-md border-none bg-slate-100 px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none transition-all resize-none"
                          placeholder="Asset backstory and condition report..."
                          required
                          value={description}
                          onChange={(e) => setDescription(e.target.value)}
                        />
                      </div>
                    </div>
                    )}
                  </div>
                </div>

                <div className="flex justify-end gap-3 pt-8 border-t border-slate-100">
                  <button 
                    id="submit-reset-button"
                    type="button" 
                    onClick={() => {
                      console.log('Reset Button Clicked');
                      setCategory(null);
                      setMedia([]);
                      setSelectedTags([]);
                    }}
                    className="px-6 py-2.5 rounded-lg text-xs font-bold text-slate-400 hover:text-slate-800 transition-all uppercase tracking-widest pointer-events-auto"
                  >
                    Reset
                  </button>
                    <button 
                      id="publish-asset-button"
                      type="submit"
                      disabled={loading || success}
                      onClick={() => console.log('Publish Asset Button Clicked Manual')}
                      className={cn(
                        "action-button px-8 py-2.5 min-w-[200px] transition-all relative overflow-hidden pointer-events-auto",
                        success ? "bg-emerald-500 hover:bg-emerald-600 shadow-emerald-100" : "",
                        loading ? "cursor-wait opacity-80" : ""
                      )}
                    >
                      {loading && (
                        <motion.div 
                          className="absolute inset-x-0 bottom-0 h-1 bg-white/30 origin-left"
                          initial={{ scaleX: 0 }}
                          animate={{ scaleX: 1 }}
                          transition={{ duration: 15, ease: "linear" }}
                        />
                      )}
                      {loading ? (
                        <div className="flex flex-col items-center">
                          <span className="text-[10px]">TRANSMITTING...</span>
                        </div>
                      ) : success ? (
                        <div className="flex items-center gap-2">
                          <CheckCircle2 className="w-4 h-4" />
                          <span>{initialData?.id ? 'ASSET UPDATED' : 'ASSET PUBLISHED'}</span>
                        </div>
                      ) : initialData?.id ? 'UPDATE ASSET' : 'PUBLISH ASSET'}
                    </button>
                </div>
              </motion.form>
            )}
          </AnimatePresence>
        </div>
      </div>
    </Card>
  );
}
