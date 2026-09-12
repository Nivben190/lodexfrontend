export interface ClosetItem {
  id: number;
  name: string;
  imageUrl: string;
  category: string;
  color: string;
  colorHex: string;
  season: string;
  brand: string;
  formality: string;
  isFavorite: boolean;
  /** Wanted rather than owned; drives the wardrobe's wishlist tab. */
  isWishlist: boolean;
  addedAt: string;
}

export interface CreateClosetItemRequest {
  /** Create straight into the wishlist rather than the closet. */
  isWishlist?: boolean;
  name: string;
  imageUrl: string;
  category: string;
  color: string;
  colorHex: string;
  season: string;
  brand: string;
  formality: string;
}

export const CLOSET_CATEGORIES = [
  'הכל',
  'חולצות',
  'מכנסיים',
  'ז׳קטים',
  'שמלות',
  'נעליים',
  'תיקים',
  'אביזרים'
] as const;

export const CLOSET_COLORS: { name: string; hex: string }[] = [
  { name: 'לבן', hex: '#F7F5F0' },
  { name: 'שחור', hex: '#1A1A1A' },
  { name: 'בז\'', hex: '#D8C9AE' },
  { name: 'חום', hex: '#8B5E3C' },
  { name: 'כחול', hex: '#3B5A7A' },
  { name: 'בורדו', hex: '#812D48' },
  { name: 'שמנת', hex: '#F0E9DC' },
  { name: 'אפור', hex: '#9A958D' },
  { name: 'קרם', hex: '#EFE6D8' }
];

export const CLOSET_SEASONS = ['כל השנה', 'קיץ', 'חורף', 'אביב', 'סתיו'] as const;
export const CLOSET_FORMALITY = ['יומיומי', 'אלגנט', 'ערב'] as const;
