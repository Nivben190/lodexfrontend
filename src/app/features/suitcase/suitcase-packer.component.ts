import { Component, OnInit, inject, signal } from '@angular/core';
import { SuitcaseService } from '../../core/services/suitcase.service';
import { PackingItem } from '../../core/models/suitcase.model';
import { FeedService } from '../../core/services/feed.service';
import { FeedPost } from '../../core/models/feed.model';

@Component({
  selector: 'app-suitcase-packer',
  standalone: true,
  templateUrl: './suitcase-packer.component.html',
  styleUrl: './suitcase-packer.component.scss'
})
export class SuitcasePackerComponent implements OnInit {
  suitcaseService = inject(SuitcaseService);
  feedService = inject(FeedService);

  pickerOpenForGroup = signal<string | null>(null);
  toastMessage = signal<string | null>(null);

  ngOnInit() {
    this.suitcaseService.loadSuitcases().subscribe();
    this.feedService.loadFeed().subscribe();
  }

  selectTrip(id: number) {
    this.suitcaseService.activeSuitcaseId.set(id);
  }

  togglePacked(suitcaseId: number, item: PackingItem) {
    const nextState = !item.isPacked;
    item.isPacked = nextState;

    this.suitcaseService
      .togglePacked({ suitcaseId, packingItemId: item.id, isPacked: nextState })
      .subscribe({
        error: () => {
          item.isPacked = !nextState;
        }
      });
  }

  formatDateRange(start: string, end: string): string {
    const startDate = new Date(start);
    const endDate = new Date(end);
    const fmt = new Intl.DateTimeFormat('he-IL', { day: 'numeric', month: 'short' });
    return `${fmt.format(startDate)} – ${fmt.format(endDate)}`;
  }

  countOwnedItems(post: FeedPost): number {
    return post.detectedItems.filter((d) => d.ownedInCloset).length;
  }

  openPicker(eventKey: string) {
    this.pickerOpenForGroup.set(this.pickerOpenForGroup() === eventKey ? null : eventKey);
  }

  closePicker() {
    this.pickerOpenForGroup.set(null);
  }

  addLook(suitcaseId: number, post: FeedPost, eventKey: string) {
    this.suitcaseService.addLookToSuitcase(suitcaseId, { postId: post.id, eventKey }).subscribe((result) => {
      this.showToast(
        result.addedCount > 0
          ? `נוספו ${result.addedCount} פריטים מ"${post.title}" ✓`
          : `כל הפריטים מ"${post.title}" כבר במזוודה`
      );
      this.closePicker();
    });
  }

  private showToast(message: string) {
    this.toastMessage.set(message);
    setTimeout(() => this.toastMessage.set(null), 2400);
  }
}
