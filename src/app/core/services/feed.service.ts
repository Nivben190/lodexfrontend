import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, computed, inject, signal } from '@angular/core';
import { Observable, of, tap } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import { FeedPage, FeedPost } from '../models/feed.model';

export type FeedViewMode = 'all' | 'saved';

@Injectable({ providedIn: 'root' })
export class FeedService {
  private http = inject(HttpClient);
  private baseUrl = `${environment.apiBaseUrl}/feed`;

  /** Posts accumulated across every page loaded so far. */
  posts = signal<FeedPost[]>([]);
  loading = signal(false);
  loadingMore = signal(false);
  loadFailed = signal(false);

  totalCount = signal(0);
  private nextCursor = signal<string | null>(null);

  searchQuery = signal('');
  viewMode = signal<FeedViewMode>('all');

  hasMore = computed(() => this.nextCursor() !== null);

  /**
   * Search and the saved filter are applied by the API, not in the browser:
   * with an open-ended library the client only ever holds the pages it has
   * fetched, so filtering locally would silently miss everything else.
   */
  visiblePosts = this.posts.asReadonly();

  /** Resets to page one for the current search and tab. */
  loadFirstPage(): Observable<FeedPage | null> {
    this.loading.set(true);
    this.loadFailed.set(false);

    return this.http.get<FeedPage>(this.baseUrl, { params: this.buildParams(null) }).pipe(
      tap({
        next: (page) => {
          this.posts.set(page.items);
          this.nextCursor.set(page.nextCursor);
          this.totalCount.set(page.totalCount);
          this.loading.set(false);
        },
        error: () => {
          this.loadFailed.set(true);
          this.loading.set(false);
        }
      }),
      catchError(() => of(null))
    );
  }

  /** Appends the next page. No-op while a load is in flight or at the end. */
  loadNextPage(): Observable<FeedPage | null> {
    const cursor = this.nextCursor();
    if (cursor === null || this.loadingMore() || this.loading()) return of(null);

    this.loadingMore.set(true);

    return this.http.get<FeedPage>(this.baseUrl, { params: this.buildParams(cursor) }).pipe(
      tap({
        next: (page) => {
          // Guard against a duplicate id slipping in if ingest ran mid-scroll.
          const seen = new Set(this.posts().map((p) => p.id));
          const fresh = page.items.filter((p) => !seen.has(p.id));

          this.posts.update((current) => [...current, ...fresh]);
          this.nextCursor.set(page.nextCursor);
          this.totalCount.set(page.totalCount);
          this.loadingMore.set(false);
        },
        error: () => this.loadingMore.set(false)
      }),
      catchError(() => of(null))
    );
  }

  /**
   * Saved looks fetched independently of the feed's pagination, for callers that
   * need the list on its own (the suitcase look picker).
   */
  savedPosts = signal<FeedPost[]>([]);

  loadSavedPosts(): Observable<FeedPage | null> {
    const params = new HttpParams().set('saved', 'true').set('limit', '60');

    return this.http.get<FeedPage>(this.baseUrl, { params }).pipe(
      tap((page) => this.savedPosts.set(page.items)),
      catchError(() => {
        this.savedPosts.set([]);
        return of(null);
      })
    );
  }

  toggleSave(postId: number) {
    return this.http.patch<FeedPost>(`${this.baseUrl}/${postId}/save`, {}).pipe(
      tap((updated) => {
        this.posts.update((posts) => {
          // In the saved tab, un-saving should drop the tile immediately.
          if (this.viewMode() === 'saved' && !updated.isSaved) {
            return posts.filter((p) => p.id !== updated.id);
          }
          return posts.map((p) => (p.id === updated.id ? updated : p));
        });
      })
    );
  }

  private buildParams(cursor: string | null): HttpParams {
    let params = new HttpParams().set('limit', '24');

    if (cursor) params = params.set('cursor', cursor);

    const query = this.searchQuery().trim();
    if (query) params = params.set('q', query);

    if (this.viewMode() === 'saved') params = params.set('saved', 'true');

    return params;
  }
}
