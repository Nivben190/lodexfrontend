import { Component, OnInit, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { FeedService, FeedViewMode } from '../../core/services/feed.service';
import { ClosetService } from '../../core/services/closet.service';
import { DailyLookService } from '../../core/services/daily-look.service';
import { FeedPost } from '../../core/models/feed.model';
import { BoundingBoxModalComponent } from './bounding-box-modal.component';

@Component({
  selector: 'app-inspiration-feed',
  standalone: true,
  imports: [FormsModule, BoundingBoxModalComponent],
  templateUrl: './inspiration-feed.component.html',
  styleUrl: './inspiration-feed.component.scss'
})
export class InspirationFeedComponent implements OnInit {
  feedService = inject(FeedService);
  private closetService = inject(ClosetService);
  private dailyLookService = inject(DailyLookService);

  loading = this.feedService.loading;
  dailyLook = this.dailyLookService.dailyLook;

  selectedPost = signal<FeedPost | null>(null);

  ngOnInit() {
    this.feedService.loadFeed().subscribe();
    this.closetService.loadCloset().subscribe();
    if (!this.dailyLook()) {
      this.dailyLookService.loadDailyLook().subscribe();
    }
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

  setViewMode(mode: FeedViewMode) {
    this.feedService.viewMode.set(mode);
  }

  toggleSave(event: Event, post: FeedPost) {
    event.stopPropagation();
    this.feedService.toggleSave(post.id).subscribe();
  }
}
