import { HttpClient } from '@angular/common/http';
import { Injectable, computed, inject, signal } from '@angular/core';
import { tap } from 'rxjs';
import { environment } from '../../../environments/environment';
import { FeedPost } from '../models/feed.model';

export type FeedViewMode = 'all' | 'saved';

function normalize(value: string): string {
  return value.trim().toLowerCase();
}

@Injectable({ providedIn: 'root' })
export class FeedService {
  private http = inject(HttpClient);
  private baseUrl = `${environment.apiBaseUrl}/feed`;

  posts = signal<FeedPost[]>([]);
  loading = signal(false);

  searchQuery = signal('');
  viewMode = signal<FeedViewMode>('all');

  savedPosts = computed(() => this.posts().filter((p) => p.isSaved));

  visiblePosts = computed(() => {
    const query = normalize(this.searchQuery());
    const source = this.viewMode() === 'saved' ? this.savedPosts() : this.posts();

    if (!query) return source;

    return source.filter((post) => {
      const haystack = [
        post.title,
        post.photographer,
        post.location,
        ...post.detectedItems.flatMap((item) => [item.label, item.labelHe])
      ]
        .join(' ')
        .toLowerCase();
      return haystack.includes(query);
    });
  });

  loadFeed() {
    this.loading.set(true);
    return this.http.get<FeedPost[]>(this.baseUrl).pipe(
      tap({
        next: (posts) => this.posts.set(posts),
        error: () => this.loading.set(false),
        complete: () => this.loading.set(false)
      })
    );
  }

  toggleSave(postId: number) {
    return this.http.patch<FeedPost>(`${this.baseUrl}/${postId}/save`, {}).pipe(
      tap((updated) => {
        this.posts.update((posts) => posts.map((p) => (p.id === updated.id ? updated : p)));
      })
    );
  }
}
