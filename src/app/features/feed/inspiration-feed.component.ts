import {
  Component,
  ElementRef,
  OnDestroy,
  OnInit,
  ViewChild,
  inject,
  signal
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Subject, Subscription } from 'rxjs';
import { debounceTime, distinctUntilChanged, switchMap } from 'rxjs/operators';
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
export class InspirationFeedComponent implements OnInit, OnDestroy {
  feedService = inject(FeedService);
  private closetService = inject(ClosetService);

  loading = this.feedService.loading;
  loadingMore = this.feedService.loadingMore;

  selectedPost = signal<FeedPost | null>(null);

  /** Staggered placeholder heights so the loading masonry reads as a real grid. */
  skeletonHeights = [210, 150, 170, 230, 190, 160];

  private observer?: IntersectionObserver;

  /**
   * Setter rather than a plain @ViewChild: the sentinel lives inside a
   * conditional block, so it does not exist yet when ngAfterViewInit runs. This
   * re-attaches whenever it enters or leaves the DOM.
   */
  @ViewChild('sentinel')
  set sentinel(element: ElementRef<HTMLElement> | undefined) {
    this.observer?.disconnect();

    if (!element || typeof IntersectionObserver === 'undefined') return;

    this.observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          this.feedService.loadNextPage().subscribe();
        }
      },
      // Start fetching before the sentinel is actually visible, so the grid
      // keeps filling ahead of the scroll rather than stalling at the bottom.
      { rootMargin: '600px 0px' }
    );

    this.observer.observe(element.nativeElement);
  }

  /** Debounces typing so we query once the user pauses, not per keystroke. */
  private searchInput = new Subject<string>();
  private searchSub?: Subscription;

  ngOnInit() {
    this.feedService.loadFirstPage().subscribe();
    this.closetService.loadCloset().subscribe();

    this.searchSub = this.searchInput
      .pipe(
        debounceTime(350),
        distinctUntilChanged(),
        switchMap((value) => {
          this.feedService.searchQuery.set(value);
          return this.feedService.loadFirstPage();
        })
      )
      .subscribe();
  }

  ngOnDestroy() {
    this.observer?.disconnect();
    this.searchSub?.unsubscribe();
  }

  openPost(post: FeedPost) {
    this.selectedPost.set(post);
  }

  closeModal() {
    this.selectedPost.set(null);
  }

  onSearchInput(event: Event) {
    this.searchInput.next((event.target as HTMLInputElement).value);
  }

  clearSearch() {
    this.feedService.searchQuery.set('');
    this.feedService.loadFirstPage().subscribe();
  }

  retry() {
    this.feedService.loadFirstPage().subscribe();
    this.closetService.loadCloset().subscribe();
  }

  setViewMode(mode: FeedViewMode) {
    if (this.feedService.viewMode() === mode) return;
    this.feedService.viewMode.set(mode);
    this.feedService.loadFirstPage().subscribe();
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
