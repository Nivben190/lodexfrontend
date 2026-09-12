/** One thing placed on the canvas: a garment from the closet, or a line of text. */
export interface OutfitLayer {
  id: string;
  kind: 'item' | 'text';

  /** Centre of the layer, as a percentage of the canvas. */
  x: number;
  y: number;

  /** Width as a percentage of the canvas; height follows the image's ratio. */
  size: number;
  rotation: number;

  /** kind === 'item' */
  closetItemId?: number;
  imageUrl?: string;
  label?: string;

  /** kind === 'text' */
  text?: string;
  color?: string;
}

export interface OutfitComposition {
  layers: OutfitLayer[];
}

export interface Outfit {
  id: number;
  name: string;
  background: string;
  previewUrl: string | null;
  /** The layers, as JSON; parsed by the builder. */
  composition: string;
  createdAt: string;
  updatedAt: string;
}

export interface SaveOutfitRequest {
  name: string;
  background: string;
  previewImageId?: string | null;
  composition: string;
}

/** Backgrounds offered by the canvas, kept deliberately quiet. */
export const OUTFIT_BACKGROUNDS = [
  '#F2F0ED',
  '#FFFFFF',
  '#EDE7DF',
  '#E4E7E4',
  '#E8DFDA',
  '#DCDDE2',
  '#1A1A1A'
] as const;
