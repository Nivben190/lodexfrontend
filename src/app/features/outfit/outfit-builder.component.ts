import { Component, ElementRef, OnInit, computed, inject, signal, viewChild } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { ClosetService } from '../../core/services/closet.service';
import { ImageUploadService } from '../../core/services/image-upload.service';
import { OutfitService } from '../../core/services/outfit.service';
import { ClosetItem } from '../../core/models/closet.model';
import { OUTFIT_BACKGROUNDS, OutfitComposition, OutfitLayer } from '../../core/models/outfit.model';
import { IconComponent } from '../../shared/icon/icon.component';

/** Canvas side used when flattening the look into a picture. */
const PREVIEW_SIZE = 1080;

@Component({
  selector: 'app-outfit-builder',
  standalone: true,
  imports: [FormsModule, IconComponent],
  templateUrl: './outfit-builder.component.html',
  styleUrl: './outfit-builder.component.scss'
})
export class OutfitBuilderComponent implements OnInit {
  private closetService = inject(ClosetService);
  private outfitService = inject(OutfitService);
  private uploads = inject(ImageUploadService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);

  private canvas = viewChild<ElementRef<HTMLElement>>('canvas');

  readonly backgrounds = OUTFIT_BACKGROUNDS;

  name = signal('לוק חדש');
  background = signal<string>(OUTFIT_BACKGROUNDS[0]);
  layers = signal<OutfitLayer[]>([]);
  selectedId = signal<string | null>(null);
  tab = signal<'items' | 'background' | 'text'>('items');
  draft = signal('');
  saving = signal(false);
  toast = signal<string | null>(null);

  /** Set when an existing look was opened, so saving updates it instead of adding another. */
  private editingId = signal<number | null>(null);

  /** Only the closet proper: a wishlist piece is not something she can wear yet. */
  closetItems = computed(() => this.closetService.items());

  selected = computed(() => this.layers().find((l) => l.id === this.selectedId()) ?? null);

  ngOnInit() {
    this.closetService.loadCloset().subscribe();

    const id = Number(this.route.snapshot.paramMap.get('id'));
    if (!Number.isFinite(id) || id <= 0) return;

    this.outfitService.getById(id).subscribe({
      next: (outfit) => {
        this.editingId.set(outfit.id);
        this.name.set(outfit.name);
        this.background.set(outfit.background);

        try {
          const parsed = JSON.parse(outfit.composition) as OutfitComposition;
          this.layers.set(parsed.layers ?? []);
        } catch {
          this.layers.set([]);
        }
      },
      error: () => this.showToast('לא הצלחנו לפתוח את הלוק')
    });
  }

  // ---- building ----------------------------------------------------------

  addItem(item: ClosetItem) {
    const layer: OutfitLayer = {
      id: crypto.randomUUID(),
      kind: 'item',
      closetItemId: item.id,
      imageUrl: item.imageUrl,
      label: item.name,
      // Dropped a little above centre and offset from whatever is already there,
      // so a second piece does not land exactly on the first.
      x: 50 + (this.layers().length % 3) * 6 - 6,
      y: 46 + (this.layers().length % 4) * 5 - 8,
      size: 44,
      rotation: 0
    };

    this.layers.update((list) => [...list, layer]);
    this.selectedId.set(layer.id);
  }

  addText() {
    const text = this.draft().trim();
    if (!text) return;

    const layer: OutfitLayer = {
      id: crypto.randomUUID(),
      kind: 'text',
      text,
      color: '#1A1A1A',
      x: 50,
      y: 80,
      size: 34,
      rotation: 0
    };

    this.layers.update((list) => [...list, layer]);
    this.selectedId.set(layer.id);
    this.draft.set('');
  }

  removeSelected() {
    const id = this.selectedId();
    if (!id) return;

    this.layers.update((list) => list.filter((l) => l.id !== id));
    this.selectedId.set(null);
  }

  /** Brings the selected layer to the front, which is what "on top" means here. */
  bringForward() {
    const id = this.selectedId();
    if (!id) return;

    this.layers.update((list) => {
      const layer = list.find((l) => l.id === id);
      if (!layer) return list;
      return [...list.filter((l) => l.id !== id), layer];
    });
  }

  updateSelected(change: Partial<OutfitLayer>) {
    const id = this.selectedId();
    if (!id) return;

    this.layers.update((list) =>
      list.map((l) => (l.id === id ? { ...l, ...change } : l)));
  }

  onSize(value: string) {
    this.updateSelected({ size: Number(value) });
  }

  onRotation(value: string) {
    this.updateSelected({ rotation: Number(value) });
  }

  onTextColor(value: string) {
    this.updateSelected({ color: value });
  }

  // ---- dragging ----------------------------------------------------------

  startDrag(event: PointerEvent, layer: OutfitLayer) {
    event.preventDefault();
    this.selectedId.set(layer.id);

    const host = this.canvas()?.nativeElement;
    if (!host) return;

    const bounds = host.getBoundingClientRect();
    const startX = event.clientX;
    const startY = event.clientY;
    const originX = layer.x;
    const originY = layer.y;

    const move = (e: PointerEvent) => {
      const dx = ((e.clientX - startX) / bounds.width) * 100;
      const dy = ((e.clientY - startY) / bounds.height) * 100;

      this.layers.update((list) =>
        list.map((l) =>
          l.id === layer.id
            ? { ...l, x: clamp(originX + dx), y: clamp(originY + dy) }
            : l));
    };

    const end = () => {
      window.removeEventListener('pointermove', move);
      window.removeEventListener('pointerup', end);
      window.removeEventListener('pointercancel', end);
    };

    window.addEventListener('pointermove', move);
    window.addEventListener('pointerup', end);
    window.addEventListener('pointercancel', end);
  }

  clearSelection() {
    this.selectedId.set(null);
  }

  // ---- saving ------------------------------------------------------------

  async save() {
    if (this.saving()) return;

    if (this.layers().length === 0) {
      this.showToast('הוסיפי פריט אחד לפחות');
      return;
    }

    this.saving.set(true);

    const composition = JSON.stringify({ layers: this.layers() } satisfies OutfitComposition);
    const previewImageId = await this.uploadPreview();

    const request = {
      name: this.name().trim() || 'לוק חדש',
      background: this.background(),
      previewImageId,
      composition
    };

    const editing = this.editingId();
    const call = editing
      ? this.outfitService.update(editing, request)
      : this.outfitService.create(request);

    call.subscribe({
      next: () => {
        this.saving.set(false);
        this.router.navigate(['/closet'], { queryParams: { tab: 'looks' } });
      },
      error: () => {
        this.saving.set(false);
        this.showToast('השמירה נכשלה, נסי שוב');
      }
    });
  }

  /**
   * Flattens the canvas into a picture for the thumbnail.
   *
   * Failure here is not failure to save: the look is the layers, and a missing
   * thumbnail is worth far less than the arrangement she just built.
   */
  private async uploadPreview(): Promise<string | null> {
    try {
      const canvas = document.createElement('canvas');
      canvas.width = PREVIEW_SIZE;
      canvas.height = PREVIEW_SIZE;

      const context = canvas.getContext('2d');
      if (!context) return null;

      context.fillStyle = this.background();
      context.fillRect(0, 0, PREVIEW_SIZE, PREVIEW_SIZE);

      for (const layer of this.layers()) {
        if (layer.kind === 'text') {
          const size = (layer.size / 100) * PREVIEW_SIZE * 0.5;
          context.save();
          context.translate((layer.x / 100) * PREVIEW_SIZE, (layer.y / 100) * PREVIEW_SIZE);
          context.rotate((layer.rotation * Math.PI) / 180);
          context.fillStyle = layer.color ?? '#1A1A1A';
          context.font = `600 ${size}px system-ui, sans-serif`;
          context.textAlign = 'center';
          context.textBaseline = 'middle';
          context.fillText(layer.text ?? '', 0, 0);
          context.restore();
          continue;
        }

        if (!layer.imageUrl) continue;

        const image = await loadImage(layer.imageUrl);
        if (!image) continue;

        const width = (layer.size / 100) * PREVIEW_SIZE;
        const height = width * (image.naturalHeight / image.naturalWidth);

        context.save();
        context.translate((layer.x / 100) * PREVIEW_SIZE, (layer.y / 100) * PREVIEW_SIZE);
        context.rotate((layer.rotation * Math.PI) / 180);
        context.drawImage(image, -width / 2, -height / 2, width, height);
        context.restore();
      }

      const blob = await new Promise<Blob | null>((resolve) =>
        canvas.toBlob(resolve, 'image/jpeg', 0.88));

      if (!blob) return null;

      const file = new File([blob], 'look.jpg', { type: 'image/jpeg' });
      const uploaded = await new Promise<{ id: string } | null>((resolve) => {
        this.uploads.upload(file).subscribe({
          next: (result) => resolve(result),
          error: () => resolve(null)
        });
      });

      return uploaded?.id ?? null;
    } catch {
      return null;
    }
  }

  back() {
    this.router.navigate(['/closet'], { queryParams: { tab: 'looks' } });
  }

  private showToast(message: string) {
    this.toast.set(message);
    setTimeout(() => this.toast.set(null), 2400);
  }

  /** Sticker-style outline, drawn as shadows in four directions. */
  outlineFilter(layer: OutfitLayer): string {
    return `drop-shadow(0 2px 6px rgba(0,0,0,0.14))`;
  }
}

function clamp(value: number): number {
  return Math.min(Math.max(value, 4), 96);
}

/**
 * Loads an image for the canvas with CORS asked for up front — without it the
 * canvas is tainted and cannot be exported at all.
 *
 * The query parameter is not decoration. The same image has already been shown on
 * the page by a plain <img>, and that response is in the cache without the CORS
 * headers; asked for again with crossOrigin, the browser serves the cached copy
 * and the load fails. A different URL is a different cache entry.
 */
function loadImage(src: string): Promise<HTMLImageElement | null> {
  return new Promise((resolve) => {
    const image = new Image();
    image.crossOrigin = 'anonymous';
    image.onload = () => resolve(image);
    image.onerror = () => resolve(null);
    image.src = src + (src.includes('?') ? '&' : '?') + 'cors=1';
  });
}
