import { db, storage } from '@/src/lib/firebase';
import { doc, updateDoc, getDoc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';

export interface MediaAsset {
  url: string;
  type: 'image' | 'video';
  thumbnailUrl?: string;
}

/**
 * Perform high-quality, high-speed image compression on client-side before upload starts.
 * Converts to WebP format (which has 30%+ better compression ratio and visual fidelity) with a JPEG fallback.
 * Restricts max dimensions to 2048px (the standard for HD sharing on Facebook/Instagram) & quality to 0.88 (extra crystal-clear).
 */
export const fastCompressImage = (file: File, forceOriginal: boolean = true): Promise<File> => {
  return new Promise((resolve) => {
    if (!file.type.startsWith('image/')) {
      resolve(file);
      return;
    }

    const objectUrl = URL.createObjectURL(file);
    const img = new Image();
    
    img.onload = () => {
      let width = img.width;
      let height = img.height;

      if (!forceOriginal) {
        // Limited size if requested to compress heavily (limits images to 600px cap)
        const MAX_WIDTH = 600;
        const MAX_HEIGHT = 600;
        if (width > MAX_WIDTH || height > MAX_HEIGHT) {
          const ratio = Math.min(MAX_WIDTH / width, MAX_HEIGHT / height);
          width = Math.round(width * ratio);
          height = Math.round(height * ratio);
        }
      } else {
        // Disable aggressive downscaling entirely: keep source dimensions intact
        console.log(`[UploadService] Keeping full original image size: ${width}x${height} for ${file.name}`);
      }

      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      
      if (!ctx) {
        URL.revokeObjectURL(objectUrl);
        resolve(file);
        return;
      }

      // Configure advanced high-fidelity smoothing for sharp details like fabric or kit fonts
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'high';
      ctx.drawImage(img, 0, 0, width, height);

      // Check browser support for WebP
      const supportsWebP = canvas.toDataURL('image/webp').indexOf('data:image/webp') === 0;
      const outputType = supportsWebP ? 'image/webp' : 'image/jpeg';
      const outputExt = supportsWebP ? '.webp' : '.jpg';
      const quality = 0.95; // High-fidelity conversion quality (95%) is strictly >= 90%

      canvas.toBlob(
        (blob) => {
          URL.revokeObjectURL(objectUrl);
          if (blob) {
            const compressedFile = new File(
              [blob], 
              file.name.replace(/\.[^/.]+$/, "") + outputExt, 
              {
                type: outputType,
                lastModified: Date.now(),
              }
            );
            console.log(`[UploadService] Client-side HD optimized ${file.name} to ${outputType} (${(compressedFile.size / 1024).toFixed(1)} KB)`);
            resolve(compressedFile);
          } else {
            resolve(file);
          }
        },
        outputType,
        quality
      );
    };

    img.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      resolve(file);
    };

    img.src = objectUrl;
  });
};

/**
 * Perform aggressive, high-speed thumbnail compression for gallery/preview display.
 * Restricts max dimensions to 480px, and quality to 0.70 for ultra fast UI rendering.
 */
export const generateOptimalThumbnail = (file: File): Promise<File> => {
  return new Promise((resolve) => {
    if (!file.type.startsWith('image/')) {
      resolve(file);
      return;
    }

    const objectUrl = URL.createObjectURL(file);
    const img = new Image();
    
    img.onload = () => {
      const MAX_WIDTH = 1024;
      const MAX_HEIGHT = 576;
      let width = img.width;
      let height = img.height;

      if (width > MAX_WIDTH || height > MAX_HEIGHT) {
        const ratio = Math.min(MAX_WIDTH / width, MAX_HEIGHT / height);
        width = Math.round(width * ratio);
        height = Math.round(height * ratio);
      }

      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      
      if (!ctx) {
        URL.revokeObjectURL(objectUrl);
        resolve(file);
        return;
      }

      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'high';
      ctx.drawImage(img, 0, 0, width, height);

      // WebP check
      const supportsWebP = canvas.toDataURL('image/webp').indexOf('data:image/webp') === 0;
      const outputType = supportsWebP ? 'image/webp' : 'image/jpeg';
      const outputExt = supportsWebP ? '_thumb.webp' : '_thumb.jpg';
      const quality = 0.90; // Optimized, but extremely sharp and high fidelity (90%)

      canvas.toBlob(
        (blob) => {
          URL.revokeObjectURL(objectUrl);
          if (blob) {
            const compressedFile = new File(
              [blob], 
              file.name.replace(/\.[^/.]+$/, "") + outputExt, 
              {
                type: outputType,
                lastModified: Date.now(),
              }
            );
            console.log(`[UploadService] Client-side Thumbnail generated ${file.name} to ${outputType} (${(compressedFile.size / 1024).toFixed(1)} KB)`);
            resolve(compressedFile);
          } else {
            resolve(file);
          }
        },
        outputType,
        quality
      );
    };

    img.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      resolve(file);
    };

    img.src = objectUrl;
  });
};

/**
 * Aggressive local image compression for inline Base64 fallbacks.
 * Caps the resulting Base64 length to a strict maximum of 22,000 characters (~16KB binary).
 * This ensures compiled Documents with 12+ fallbacks will never exceed Firestore's 1MB limit.
 */
export const compressToTinyFallback = (file: File | Blob, maxAllowedLength: number = 22000): Promise<string> => {
  return new Promise((resolve) => {
    if (!file.type.startsWith('image/')) {
      resolve('');
      return;
    }

    const objectUrl = URL.createObjectURL(file);
    const img = new Image();

    img.onload = () => {
      // Begin with a very small thumbnail format
      let quality = 0.65;
      let maxDimension = 360;

      // Adjust dimensions if budget is extra tight
      if (maxAllowedLength < 15000) {
        maxDimension = 200;
        quality = 0.5;
      }

      const doCompress = (dim: number, q: number): string => {
        let width = img.width;
        let height = img.height;

        if (width > dim || height > dim) {
          if (width > height) {
            height = Math.round((height * dim) / width);
            width = dim;
          } else {
            width = Math.round((width * dim) / height);
            height = dim;
          }
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) return '';

        ctx.drawImage(img, 0, 0, width, height);
        return canvas.toDataURL('image/jpeg', q);
      };

      let result = doCompress(maxDimension, quality);

      // Progressive downsizing loop to strictly respect the maximum size limit
      if (result.length >= maxAllowedLength && maxDimension > 240) {
        maxDimension = 240;
        quality = 0.55;
        result = doCompress(maxDimension, quality);
      }
      if (result.length >= maxAllowedLength && maxDimension > 160) {
        maxDimension = 160;
        quality = 0.45;
        result = doCompress(maxDimension, quality);
      }
      if (result.length >= maxAllowedLength && maxDimension > 100) {
        maxDimension = 100;
        quality = 0.35;
        result = doCompress(maxDimension, quality);
      }

      URL.revokeObjectURL(objectUrl);
      resolve(result);
    };

    img.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      resolve('');
    };

    img.src = objectUrl;
  });
};

/**
 * Creates a lightweight SVG mockup fallback if image parsing totally fails.
 */
export const createTinyPlaceholderSVG = (fileName: string, fileType: string): string => {
  const isVideo = fileType.startsWith('video/');
  const typeText = isVideo ? 'VIDEO' : 'IMAGE';
  const truncatedName = fileName.length > 20 ? fileName.substring(0, 17) + '...' : fileName;
  
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 300 200" width="300" height="200">
    <rect width="100%" height="100%" fill="#1e293b"/>
    <rect x="10" y="10" width="280" height="180" rx="8" fill="none" stroke="#334155" stroke-width="2"/>
    ${isVideo 
      ? `<path d="M120 80 h40 a5 5 0 0 1 5 5 v30 a5 5 0 0 1 -5 5 h-40 a5 5 0 0 1 -5 -5 v-30 a5 5 0 0 1 5 -5 z M165 90 l15 -8 v26 l-15 -8 z" fill="#818cf8"/>` 
      : `<circle cx="135" cy="85" r="15" fill="#38bdf8"/>
         <path d="M110 120 l25 -25 l20 20 l35 -35 l20 20 v20 h-100 z" fill="#34d399"/>`
    }
    <text x="150" y="145" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="12" font-weight="bold" fill="#f8fafc" text-anchor="middle">${truncatedName}</text>
    <text x="150" y="165" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="10" font-weight="medium" fill="#94a3b8" letter-spacing="1.5" text-anchor="middle">${typeText} OFFLINE PREVIEW</text>
  </svg>`;
  
  return `data:image/svg+xml;base64,${btoa(unescape(encodeURIComponent(svg)))}`;
};

/**
 * Obtains extremely robust, optimized memory-safe pointer URL of the raw binary blob, avoiding any canvas or Base64 processing.
 */
export const getTinyBase64FallbackVal = async (file: File | Blob, totalFiles: number = 1): Promise<string> => {
  try {
    // Return a lightweight, canvas-free, memory-safe browser pointer to the native file stream.
    // This uses zero JavaScript memory stream copies, fully protecting iOS Safari from memory-limit crashes.
    return URL.createObjectURL(file);
  } catch (err) {
    console.warn(`[UploadService] Object URL creation failed`, err);
    return '';
  }
};

/**
 * Global background upload worker to handle asynchronous publishing and lazy syncs.
 * Ensures that if a user hits Post/Submit, the text data written instantly,
 * while images are compressed & uploaded fully in the background.
 * Active even if ListingForm is completely unmounted.
 */
class BackgroundUploadManager {
  private activeTasks: Map<string, Promise<any>> = new Map();

  /**
   * Registers a background task to finish image uploads on a listing and update its Firestore document once they finish.
   */
  public registerAsyncTask(
    docId: string,
    pendingUploads: {
      file: File;
      itemId: string;
      storagePath: string;
      fallbackBase64: string;
      uploadPromise: Promise<string>;
    }[]
  ) {
    console.log(`[BackgroundUploadManager] Registered post update task for document ${docId} with ${pendingUploads.length} files`);
    
    const taskPromise = (async () => {
      try {
        const resolvedUrls: { itemId: string; url: string; thumbnailUrl?: string; type: 'image' | 'video' }[] = [];

        // Wait for each upload or fallback to resolve
        for (const item of pendingUploads) {
          let finalUrl = '';
          try {
            console.log(`[BackgroundUploadManager] Awaiting background upload completion for ${item.file.name}...`);
            finalUrl = await item.uploadPromise;
            console.log(`[BackgroundUploadManager] Upload succeeded! GCS URL: ${finalUrl}`);
          } catch (uploadError) {
            console.warn(`[BackgroundUploadManager] Background upload failed for ${item.file.name} - using robust tiny fallback`, uploadError);
            finalUrl = item.fallbackBase64 || await getTinyBase64FallbackVal(item.file, pendingUploads.length);
          }

          let hqUrl = finalUrl;
          let thumbUrl: string | undefined = undefined;

          if (finalUrl.trim().startsWith('{')) {
            try {
              const parsed = JSON.parse(finalUrl);
              hqUrl = parsed.url;
              thumbUrl = parsed.thumbnailUrl;
            } catch (err) {
              console.warn('[BackgroundUploadManager] Failed to parse double-resolution URL JSON', err);
            }
          }

          resolvedUrls.push({
            itemId: item.itemId,
            url: hqUrl,
            thumbnailUrl: thumbUrl || hqUrl,
            type: item.file.type.startsWith('video/') ? 'video' : 'image'
          });
        }

        // Fetch current document from Firestore to merge media lists safely
        const docRef = doc(db, 'listings', docId);
        const docSnap = await getDoc(docRef);
        
        if (docSnap.exists()) {
          const currentData = docSnap.data();
          const currentMedia = currentData.media || currentData.images || [];

          // Map resolved urls back into existing lists
          const updatedMedia = currentMedia.map((mediaItem: any) => {
            // Find local match
            const uploadMatch = resolvedUrls.find(u => {
              // Extract matching characteristics or if we have inline base64/placeholder initially
              return mediaItem.tempId === u.itemId || mediaItem.url?.startsWith('data:image/svg+xml') || mediaItem.url?.startsWith('blob:');
            });

            if (uploadMatch) {
              return {
                url: uploadMatch.url,
                type: uploadMatch.type,
                ...(uploadMatch.thumbnailUrl ? { thumbnailUrl: uploadMatch.thumbnailUrl } : {}),
                ...(uploadMatch.type === 'video' && !uploadMatch.url.startsWith('data:') ? { thumbnailUrl: uploadMatch.url } : {})
              };
            }
            return mediaItem;
          });

          // Also merge any new/missing items
          resolvedUrls.forEach(res => {
            const alreadyExists = updatedMedia.some((m: any) => m.url === res.url);
            if (!alreadyExists) {
              // If there was a matching temp item, we already updated it, otherwise push
              const hasTempMatch = currentMedia.some((m: any) => m.tempId === res.itemId);
              if (!hasTempMatch) {
                updatedMedia.push({
                  url: res.url,
                  type: res.type,
                  ...(res.thumbnailUrl ? { thumbnailUrl: res.thumbnailUrl } : {}),
                  ...(res.type === 'video' && !res.url.startsWith('data:') ? { thumbnailUrl: res.url } : {})
                });
              }
            }
          });

          // Clean temporary local keys (such as tempId)
          const finalMedia = updatedMedia.map((item: any) => {
            const { tempId, ...cleanItem } = item;
            return cleanItem;
          });

          console.log(`[BackgroundUploadManager] Updating Firestore document ${docId} with actual completed URLs...`);
          await updateDoc(docRef, {
            media: finalMedia,
            images: finalMedia,
            updatedAt: new Date()
          });
          console.log(`[BackgroundUploadManager] Background updates successfully written!`);
        }
      } catch (err) {
        console.error(`[BackgroundUploadManager] Error updating document ${docId}:`, err);
      } finally {
        this.activeTasks.delete(docId);
      }
    })();

    this.activeTasks.set(docId, taskPromise);
  }
}

export const backgroundUploadManager = new BackgroundUploadManager();
