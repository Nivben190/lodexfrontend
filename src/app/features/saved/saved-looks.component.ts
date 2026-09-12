import {
  Component,
  ElementRef,
  OnDestroy,
  OnInit,
  ViewChild,
  inject,
  signal
} from '@angular/core';
import { FeedService } from '../../core/services/feed.service';
import { FeedPost, SAVED_FOLDERS } from '../../core/models/feed.model';
import { BoundingBoxModalComponent } from '../feed/bounding-box-modal.component';
import { IconComponent } from '../../shared/icon/icon.component';

@Component({
  selector: 'app-saved-looks',
  standalone: true,
  imports: [BoundingBoxModalComponent, IconComponent],
  templateUrl: './saved-looks.component.html',
  styleUrl: './saved-looks.component.scss'
})
export class SavedLooksComponent implements OnInit, OnDestroy {
  feedService = inject(FeedService);

  loading = this.feedService.loading;
  loadingMore = this.feedService.loadingMore;

  /** Offered even when empty, so a look can be filed into a fresh folder. */
  folderNames = SAVED_FOLDERS;

  selectedPost = signal<FeedPost | null>(null);
  filingPost = signal<FeedPost | null>(null);

  skeletonHeights = [210, 150, 170, 230];

  private observer?: IntersectionObserver;

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
      { rootMargin: '600px 0px' }
    );

    this.observer.observe(element.nativeElement);
  }

  ngOnInit() {
    // This screen is always the saved view; the feed tab no longer carries it.
    this.feedService.viewMode.set('saved');
    this.feedService.searchQuery.set('');
    this.feedService.loadFirstPage().subscribe();
    this.feedService.loadFolders().subscribe();
  }

  ngOnDestroy() {
    this.observer?.disconnect();
    // Leave the service on the default view so the feed tab is unaffected.
    this.feedService.viewMode.set('all');
    this.feedService.activeFolder.set(null);
  }

  activeFolder = () => this.feedService.activeFolder();

  setFolder(folder: string | null) {
    if (this.feedService.activeFolder() === folder) return;
    this.feedService.activeFolder.set(folder);
    this.feedService.loadFirstPage().subscribe();
  }

  countFor(folder: string): number {
    return this.feedService.folders().find((f) => f.name === folder)?.count ?? 0;
  }

  openPost(post: FeedPost) {
    this.selectedPost.set(post);
  }

  closeModal() {
    this.selectedPost.set(null);
  }

  openFiling(event: Event, post: FeedPost) {
    event.stopPropagation();
    event.preventDefault();
    this.filingPost.set(post);
  }

  closeFiling() {
    this.filingPost.set(null);
  }

  onFilingBackdrop(event: MouseEvent) {
    if ((event.target as HTMLElement).classList.contains('lx-sheet-backdrop')) {
      this.closeFiling();
    }
  }

  fileInto(folder: string | null) {
    const post = this.filingPost();
    if (!post) return;

    this.feedService.setFolder(post.id, folder).subscribe({
      next: () => {
        this.closeFiling();
        // Re-query so the tile leaves the view if it no longer matches.
        if (this.feedService.activeFolder() !== null) {
          this.feedService.loadFirstPage().subscribe();
        }
      },
      error: () => this.closeFiling()
    });
  }

  unsave(event: Event, post: FeedPost) {
    event.stopPropagation();
    event.preventDefault();
    this.feedService.toggleSave(post.id).subscribe(() => {
      this.feedService.loadFolders().subscribe();
    });
  }

  retry() {
    this.feedService.loadFirstPage().subscribe();
    this.feedService.loadFolders().subscribe();
  }
}
