export interface BoundingBox {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface ShoppingAlternative {
  id: number;
  brand: string;
  name: string;
  price: number;
  imageUrl: string;
  storeUrl: string;
}

export interface DetectedItem {
  id: number;
  label: string;
  labelHe: string;
  category: string;
  /** Detector confidence, 0–1. */
  score: number;
  box: BoundingBox;
  ownedInCloset: boolean;
  matchingClosetItemId: number | null;
  similarClosetItemIds: number[];
  alternatives: ShoppingAlternative[];
}

export interface FeedPost {
  id: number;
  imageUrl: string;
  /** Smaller variant for the grid; falls back to imageUrl. */
  thumbnailUrl: string;
  title: string;
  photographer: string;
  /** Attribution link, required by the image provider's terms. */
  photographerUrl: string;
  sourceUrl: string;
  location: string;
  likes: number;
  aspectRatioWidth: number;
  aspectRatioHeight: number;
  isSaved: boolean;
  /** False while detection is still pending for this image. */
  isAnalyzed: boolean;
  detectedItems: DetectedItem[];
}

/** One page of the feed, plus the cursor that fetches the next. */
export interface FeedPage {
  items: FeedPost[];
  nextCursor: string | null;
  hasMore: boolean;
  totalCount: number;
}

/** A folder saved looks can be filed under, with its current size. */
export interface SavedFolder {
  name: string;
  count: number;
}

/** Folder names offered by default, matching the mockup. */
export const SAVED_FOLDERS = ['פריז', 'עבודה', 'ערב', 'קיץ'] as const;
