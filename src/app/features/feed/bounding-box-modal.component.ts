import { Component, EventEmitter, Input, OnInit, Output, inject, signal } from '@angular/core';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { ClosetService } from '../../core/services/closet.service';
import { FeedService } from '../../core/services/feed.service';
import { DetectedItem, FeedPost } from '../../core/models/feed.model';
import { IconComponent } from '../../shared/icon/icon.component';

const SCAN_DURATION_MS = 900;

/** Instagram's embed bootstrapper. Loaded once, and only if a post needs it. */
const INSTAGRAM_EMBED_SCRIPT = 'https://www.instagram.com/embed.js';

/** Rough hex per closet colour name, used when adding a detected item. */
const DEFAULT_COLOR = { name: 'אחר', hex: '#9A958D' };

@Component({
  selector: 'app-bounding-box-modal',
  standalone: true,
  imports: [IconComponent],
  templateUrl: './bounding-box-modal.component.html',
  styleUrl: './bounding-box-modal.component.scss'
})
export class BoundingBoxModalComponent implements OnInit {
  private closetService = inject(ClosetService);
  private feedService = inject(FeedService);
  private sanitizer = inject(DomSanitizer);

  @Input({ required: true }) post!: FeedPost;
  @Output() closed = new EventEmitter<void>();

  scanning = signal(true);
  savedState = signal(false);
  showBoxes = signal(true);
  selectedItem = signal<DetectedItem | null>(null);
  toastMessage = signal<string | null>(null);
  addingId = signal<number | null>(null);

  /**
   * The embed is behind a tap rather than always on: it pulls a script and an
   * iframe from Instagram, which is a lot to spend on every look someone opens.
   */
  embedVisible = signal(false);

  private addedIds = signal<Set<number>>(new Set());

  ngOnInit() {
    this.savedState.set(this.post.isSaved);

    // Only play the scan flourish the first time an image is opened; a post
    // that was analysed long ago should not pretend to be working.
    if (this.post.detectedItems.length > 0) {
      setTimeout(() => this.scanning.set(false), SCAN_DURATION_MS);
    } else {
      this.scanning.set(false);
    }
  }

  /**
   * The post's own markup, trusted deliberately: it is Instagram's oEmbed HTML,
   * relayed by our API, and rewriting it would break the embed and step outside
   * what the oEmbed licence allows. It is requested with omitscript, so there is
   * no script tag in it — the loader below is what makes it render.
   */
  safeEmbed(): SafeHtml | null {
    return this.post.embedHtml
      ? this.sanitizer.bypassSecurityTrustHtml(this.post.embedHtml)
      : null;
  }

  showEmbed() {
    this.embedVisible.set(true);

    // The blockquote has to exist before the script is asked to process it.
    setTimeout(() => this.loadInstagramScript(), 0);
  }

  private loadInstagramScript() {
    const instagram = (window as unknown as {
      instgrm?: { Embeds?: { process(): void } };
    }).instgrm;

    if (instagram?.Embeds) {
      instagram.Embeds.process();
      return;
    }

    if (document.querySelector(`script[src="${INSTAGRAM_EMBED_SCRIPT}"]`)) return;

    const script = document.createElement('script');
    script.src = INSTAGRAM_EMBED_SCRIPT;
    script.async = true;
    document.body.appendChild(script);
  }

  confidencePercent(item: DetectedItem): number {
    return Math.round((item.score ?? 0) * 100);
  }

  /**
   * Zoom factor that makes the detection box fill the tile.
   * A box 25% wide needs the image scaled to 400% for that slice to fill it.
   */
  spriteSize(item: DetectedItem): string {
    const w = this.clampSpan(item.box.width);
    const h = this.clampSpan(item.box.height);
    return `${(100 / w) * 100}% ${(100 / h) * 100}%`;
  }

  /**
   * CSS background-position is a percentage *of the leftover space*, not of the
   * image, so the box offset has to be rescaled by the remaining room.
   */
  spritePosition(item: DetectedItem): string {
    const w = this.clampSpan(item.box.width);
    const h = this.clampSpan(item.box.height);

    const x = Math.min(Math.max(item.box.x, 0), 100 - w);
    const y = Math.min(Math.max(item.box.y, 0), 100 - h);

    const px = 100 - w === 0 ? 0 : (x / (100 - w)) * 100;
    const py = 100 - h === 0 ? 0 : (y / (100 - h)) * 100;

    return `${px}% ${py}%`;
  }

  /** Guards against a zero or full-width box producing a divide-by-zero. */
  private clampSpan(value: number): number {
    return Math.min(Math.max(value, 1), 99);
  }

  isInCloset(item: DetectedItem): boolean {
    return item.ownedInCloset || this.addedIds().has(item.id);
  }

  addToCloset(item: DetectedItem) {
    if (this.isInCloset(item) || this.addingId() !== null) return;

    this.addingId.set(item.id);

    this.closetService
      .addItem({
        name: item.displayName || item.labelHe,
        // The cutout, so the closet fills with garments rather than with copies
        // of the same street photo. Falls back to the look when there is none.
        imageUrl: item.cutoutUrl ?? this.post.imageUrl,
        imageIsCutout: item.cutoutUrl !== null,
        category: item.category,
        color: item.colorName ?? DEFAULT_COLOR.name,
        colorHex: item.colorHex ?? DEFAULT_COLOR.hex,
        season: 'כל השנה',
        brand: '',
        formality: 'יומיומי'
      })
      .subscribe({
        next: () => {
          this.addedIds.update((ids) => new Set(ids).add(item.id));
          this.addingId.set(null);
          this.showToast(`"${item.displayName || item.labelHe}" נוסף לארון ✓`);
        },
        error: () => {
          this.addingId.set(null);
          this.showToast('לא הצלחנו להוסיף את הפריט');
        }
      });
  }

  matchFromCloset() {
    this.showToast('התאמה מהארון תהיה זמינה בקרוב');
  }

  selectItem(item: DetectedItem) {
    this.selectedItem.set(item);
  }

  backToBoxes() {
    this.selectedItem.set(null);
  }

  close() {
    this.closed.emit();
  }

  onBackdropClick(event: MouseEvent) {
    if ((event.target as HTMLElement).classList.contains('lx-modal-backdrop')) {
      this.close();
    }
  }

  toggleSavePost(event: Event) {
    event.stopPropagation();
    const nowSaved = !this.savedState();
    this.savedState.set(nowSaved);
    this.feedService.toggleSave(this.post.id).subscribe();
    this.showToast(nowSaved ? 'הלוק נשמר' : 'הלוק הוסר מהשמורים');
  }

  private showToast(message: string) {
    this.toastMessage.set(message);
    setTimeout(() => this.toastMessage.set(null), 2200);
  }
}
