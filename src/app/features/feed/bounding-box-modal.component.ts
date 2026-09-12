import { Component, EventEmitter, Input, OnInit, Output, computed, inject, signal } from '@angular/core';
import { ClosetService } from '../../core/services/closet.service';
import { FeedService } from '../../core/services/feed.service';
import { DetectedItem, FeedPost } from '../../core/models/feed.model';

type ActionView = 'similar' | 'alternatives' | null;

const SCAN_DURATION_MS = 900;

@Component({
  selector: 'app-bounding-box-modal',
  standalone: true,
  templateUrl: './bounding-box-modal.component.html',
  styleUrl: './bounding-box-modal.component.scss'
})
export class BoundingBoxModalComponent implements OnInit {
  private closetService = inject(ClosetService);
  private feedService = inject(FeedService);

  @Input({ required: true }) post!: FeedPost;
  @Output() closed = new EventEmitter<void>();

  scanning = signal(true);
  savedState = signal(false);
  selectedItem = signal<DetectedItem | null>(null);
  actionView = signal<ActionView>(null);
  toastMessage = signal<string | null>(null);
  private markedHaveIds = signal<Set<number>>(new Set());

  ngOnInit() {
    this.savedState.set(this.post.isSaved);
    setTimeout(() => this.scanning.set(false), SCAN_DURATION_MS);
  }

  aiStatusLabel = computed(() =>
    this.scanning() ? 'ה-AI סורקת את התמונה...' : this.assistantIntro()
  );

  assistantIntro = computed(() => {
    const count = this.post.detectedItems.length;
    return count === 1 ? '✨ זיהיתי פריט אחד בתמונה' : `✨ זיהיתי ${count} פריטים בתמונה`;
  });

  assistantForItem = computed(() => {
    const item = this.selectedItem();
    if (!item) return '';
    if (this.isOwned(item)) return '🎉 יש לך את זה בארון!';
    if (item.similarClosetItemIds.length > 0) return '👀 מצאתי לך פריט דומה בארון שלך';
    return '🤔 לא מצאנו את זה בארון שלך עדיין';
  });

  similarItems = computed(() => {
    const item = this.selectedItem();
    if (!item) return [];
    return this.closetService.findByIds(item.similarClosetItemIds);
  });

  matchingItem = computed(() => {
    const item = this.selectedItem();
    if (!item?.matchingClosetItemId) return undefined;
    return this.closetService.findById(item.matchingClosetItemId);
  });

  isOwned(item: DetectedItem): boolean {
    return item.ownedInCloset || this.markedHaveIds().has(item.id);
  }

  selectItem(item: DetectedItem) {
    this.selectedItem.set(item);
    this.actionView.set(null);
  }

  backToBoxes() {
    this.selectedItem.set(null);
    this.actionView.set(null);
  }

  close() {
    this.closed.emit();
  }

  onBackdropClick(event: MouseEvent) {
    if ((event.target as HTMLElement).classList.contains('lx-modal-backdrop')) {
      this.close();
    }
  }

  markAsHave() {
    const item = this.selectedItem();
    if (!item) return;
    this.markedHaveIds.update((ids) => new Set(ids).add(item.id));
    this.showToast('נוסף לארון שלך ✓');
  }

  showSimilar() {
    this.actionView.set('similar');
  }

  showAlternatives() {
    this.actionView.set('alternatives');
  }

  toggleSavePost(event: Event) {
    event.stopPropagation();
    const nowSaved = !this.savedState();
    this.savedState.set(nowSaved);
    this.feedService.toggleSave(this.post.id).subscribe();
    this.showToast(nowSaved ? 'הלוק נשמר ★' : 'הלוק הוסר מהשמורים');
  }

  private showToast(message: string) {
    this.toastMessage.set(message);
    setTimeout(() => this.toastMessage.set(null), 2200);
  }
}
