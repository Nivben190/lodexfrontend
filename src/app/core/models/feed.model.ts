export interface BoundingBox {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface ShoppingAlternative {
  id: number;
  /** The shop it is sold by. */
  brand: string;
  name: string;
  price: number;

  /** Currency the price is in; empty when the shop published no price. */
  currency: string;
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

  /**
   * The garment cut out of the photo on a transparent tile. Null when the mask
   * was not good enough, and the view falls back to cropping the box.
   */
  cutoutUrl: string | null;

  /**
   * A shop's photograph of the nearest thing in the catalogue. Preferred over the
   * cutout when there is one: a garment worn in a street photo can be cut out but
   * never turned into a product shot.
   */
  productUrl: string | null;

  /** Colour in the closet's vocabulary, e.g. "לבן". Null until a cutout exists. */
  colorName: string | null;
  colorHex: string | null;

  /** Garment and colour, agreeing in gender and number: "מכנסיים שחורים". */
  displayName: string;

  /** Closet category and garment type, for the caption under the tile. */
  subtitle: string;

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

  /**
   * The source post's own embed markup, when the look came from one. Rendered as
   * received so the post stays served by its platform, with the creator's name,
   * likes and link intact.
   */
  embedHtml: string | null;

  /** Where the look came from: "instagram", "pexels", "userupload", "seed". */
  source: string;

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
