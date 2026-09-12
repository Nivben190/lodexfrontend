import { Component, OnInit, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { FeedService, FeedViewMode } from '../../core/services/feed.service';
import { ClosetService } from '../../core/services/closet.service';
import { FeedPost } from '../../core/models/feed.model';
import { BoundingBoxModalComponent } from './bounding-box-modal.component';
import { IconComponent } from '../../shared/icon/icon.component';

@Component({
  selector: 'app-inspiration-feed',
  standalone: true,
  imports: [FormsModule, BoundingBoxModalComponent, IconComponent],
  templateUrl: './inspiration-feed.component.html',
  styleUrl: './inspiration-feed.component.scss'
})
export class InspirationFeedComponent implements OnInit {
  feedService = inject(FeedService);
  private closetService = inject(ClosetService);

  loading = this.feedService.loading;

  selectedPost = signal<FeedPost | null>(null);

  /** Staggered placeholder heights so the loading masonry reads as a real grid. */
  skeletonHeights = [210, 150, 170, 230, 190, 160];

  ngOnInit() {
    this.feedService.loadFeed().subscribe();
    this.closetService.loadCloset().subscribe();
  }

  openPost(post: FeedPost) {
    this.selectedPost.set(post);
  }

  closeModal() {
    this.selectedPost.set(null);
  }

  onSearchInput(event: Event) {
    const value = (event.target as HTMLInputElement).value;
    this.feedService.searchQuery.set(value);
  }

  clearSearch() {
    this.feedService.searchQuery.set('');
  }

  retry() {
    this.feedService.loadFeed().subscribe();
    this.closetService.loadCloset().subscribe();
  }

  setViewMode(mode: FeedViewMode) {
    this.feedService.viewMode.set(mode);
  }

  ownedCount(post: FeedPost): number {
    return post.detectedItems.filter((d) => d.ownedInCloset).length;
  }

  toggleSave(event: Event, post: FeedPost) {
    event.stopPropagation();
    event.preventDefault();
    this.feedService.toggleSave(post.id).subscribe();
  }
}
