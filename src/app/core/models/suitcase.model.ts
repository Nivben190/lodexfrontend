export interface PackingItem {
  id: number;
  closetItemId: number;
  name: string;
  imageUrl: string;
  category: string;
  isPacked: boolean;
}

export interface OutfitEventGroup {
  eventKey: string;
  eventLabel: string;
  icon: string;
  items: PackingItem[];
}

export interface Suitcase {
  id: number;
  tripName: string;
  destination: string;
  coverImageUrl: string;
  startDate: string;
  endDate: string;
  expectedTempLow: number;
  expectedTempHigh: number;
  eventGroups: OutfitEventGroup[];
  totalItems: number;
  packedItems: number;
  packedPercentage: number;
}

export interface TogglePackedRequest {
  suitcaseId: number;
  packingItemId: number;
  isPacked: boolean;
}

export interface AddLookToSuitcaseRequest {
  postId: number;
  eventKey: string;
}

export interface AddLookToSuitcaseResult {
  suitcase: Suitcase;
  addedCount: number;
}
