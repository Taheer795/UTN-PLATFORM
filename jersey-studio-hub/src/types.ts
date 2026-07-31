export enum CategoryType {
  FABRICS = 'FABRICS',
  APPAREL = 'APPAREL',
  ACCESSORIES = 'ACCESSORIES',
  FOOTWEAR = 'FOOTWEAR',
  SEWING_SERVICES = 'SEWING_SERVICES',
  AUTOMOBILE = 'AUTOMOBILE',
  JERSEY = 'JERSEY'
}

export interface FabricDetails {
  type: string; // Yards, Laces, Menlace, Adire, Atampha, Lafaya, veils, bridal wears
  yards: string;
}

export interface FootwearDetails {
  type: string;
  size: string;
}

export interface SewingDetails {
  serviceType: 'MEN' | 'WOMEN';
  measurements: string;
  styleDescription: string;
}

export interface ApparelDetails {
  type: string; // Jallabs, Abayas
  gender: 'MALE' | 'FEMALE' | 'UNISEX';
  size: string;
  brand: string;
  condition: string;
}

export interface AccessoryDetails {
  type: string; // Watches, Caps
  brand: string;
}

export interface JerseyDetails {
  team: string;
  season: string;
  sport: 'football' | 'baseball' | 'rugby';
  baseColor: string;
  type: string; // Home, Away, Third, etc.
  sizes: string[];
}

export interface AutoDetails {
  vin: string;
  make: string;
  model: string;
  year: number;
  mileage: number;
  transmission: string;
  fuelType: string;
  condition?: string;
  isRegistered?: string;
  negotiable?: boolean;
  phone?: string;
}

export interface MediaAsset {
  url: string;
  type: 'image' | 'video';
  thumbnailUrl?: string; // For videos
  tempId?: string; // For identifying temporary local uploads during background sync
}

export interface Listing {
  id: string;
  title: string;
  description: string;
  price: number;
  images: MediaAsset[];
  media?: MediaAsset[]; // Transition field
  tags: string[];
  categoryType: CategoryType;
  subCategory?: string;
  fabricDetails?: FabricDetails;
  footwearDetails?: FootwearDetails;
  sewingDetails?: SewingDetails;
  apparelDetails?: ApparelDetails;
  accessoryDetails?: AccessoryDetails;
  autoDetails?: AutoDetails;
  jerseyDetails?: JerseyDetails;
  siloType: 'wardrobe' | 'garage' | 'jersey';
  status?: 'published' | 'draft' | 'archived' | 'sold';
  sku?: string;
}
