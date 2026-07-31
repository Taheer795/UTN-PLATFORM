import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function getUtnTag(listing: any, index?: number): string {
  if (!listing) return 'UTN UNKNOWN 000';
  let categoryStr = 'WDRB'; // default
  
  const isAuto = listing.siloType === 'garage' || listing.categoryType === 'AUTOMOBILE' || (listing as any).category === 'AUTOMOBILE' || !!listing.autoDetails;
  const isJersey = listing.siloType === 'jersey' || listing.categoryType === 'JERSEY' || (listing as any).category === 'JERSEY' || !!listing.jerseyDetails;
  
  if (isAuto) {
    categoryStr = 'CARS';
  } else if (isJersey) {
    categoryStr = 'JRSY';
  } else {
    const titleLower = (listing.title || '').toLowerCase();
    const subCatLower = (listing.subCategory || '').toLowerCase();
    
    if (titleLower.includes('cap') || subCatLower.includes('cap') || titleLower.includes('hat') || subCatLower.includes('hat')) {
      categoryStr = 'CAPS';
    } else if (titleLower.includes('lace') || subCatLower.includes('lace')) {
      categoryStr = 'LACE';
    } else if (titleLower.includes('yard') || subCatLower.includes('yard')) {
      categoryStr = 'YARDS';
    } else {
      categoryStr = 'CLTH';
    }
  }

  let suffix = '';
  if (listing.sku) {
    suffix = listing.sku.replace('#TAG-', '').replace('#', '').toUpperCase();
  } else if (listing.id) {
    suffix = listing.id.substring(0, 4).toUpperCase();
  } else {
    suffix = '000';
  }

  if (index !== undefined && index !== null) {
    const slideNum = String(index + 1).padStart(3, '0');
    suffix = `${suffix}-${slideNum}`;
  }
  
  return `UTN ${categoryStr} ${suffix}`;
}
