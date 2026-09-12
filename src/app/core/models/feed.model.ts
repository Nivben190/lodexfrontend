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
  box: BoundingBox;
  ownedInCloset: boolean;
  matchingClosetItemId: number | null;
  similarClosetItemIds: number[];
  alternatives: ShoppingAlternative[];
}

export interface FeedPost {
  id: number;
  imageUrl: string;
  title: string;
  photographer: string;
  location: string;
  likes: number;
  aspectRatioWidth: number;
  aspectRatioHeight: number;
  isSaved: boolean;
  detectedItems: DetectedItem[];
}
