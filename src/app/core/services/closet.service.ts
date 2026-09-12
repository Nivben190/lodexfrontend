import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, computed, inject, signal } from '@angular/core';
import { tap } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ClosetItem, CreateClosetItemRequest } from '../models/closet.model';

@Injectable({ providedIn: 'root' })
export class ClosetService {
  private http = inject(HttpClient);
  private baseUrl = `${environment.apiBaseUrl}/closet`;

  /** Pieces the wearer owns. */
  items = signal<ClosetItem[]>([]);

  /** Pieces they want; a separate tab, so kept as its own list. */
  wishlist = signal<ClosetItem[]>([]);

  loading = signal(false);
  /** Set when the last load errored, so the UI can offer a retry. */
  loadFailed = signal(false);

  activeCategory = signal<string>('הכל');
  activeColor = signal<string | null>(null);

  filteredItems = computed(() => this.applyFilters(this.items()));
  filteredWishlist = computed(() => this.applyFilters(this.wishlist()));

  private applyFilters(source: ClosetItem[]): ClosetItem[] {
    const category = this.activeCategory();
    const color = this.activeColor();
    return source.filter((item) => {
      const categoryMatch = category === 'הכל' || item.category === category;
      const colorMatch = !color || item.color === color;
      return categoryMatch && colorMatch;
    });
  }

  loadCloset() {
    this.loading.set(true);
    this.loadFailed.set(false);
    return this.http.get<ClosetItem[]>(this.baseUrl).pipe(
      tap({
        next: (items) => this.items.set(items),
        error: () => {
          this.loadFailed.set(true);
          this.loading.set(false);
        },
        complete: () => this.loading.set(false)
      })
    );
  }

  loadWishlist() {
    const params = new HttpParams().set('wishlist', 'true');
    return this.http.get<ClosetItem[]>(this.baseUrl, { params }).pipe(
      tap((items) => this.wishlist.set(items))
    );
  }

  addItem(request: CreateClosetItemRequest) {
    return this.http.post<ClosetItem>(this.baseUrl, request).pipe(
      tap((item) => {
        const target = item.isWishlist ? this.wishlist : this.items;
        target.update((items) => [item, ...items]);
      })
    );
  }

  /** Moves a piece between the wishlist and the closet proper. */
  setWishlist(id: number, value: boolean) {
    const params = new HttpParams().set('value', String(value));

    return this.http.patch<ClosetItem>(`${this.baseUrl}/${id}/wishlist`, {}, { params }).pipe(
      tap((updated) => {
        this.items.update((list) => list.filter((i) => i.id !== id));
        this.wishlist.update((list) => list.filter((i) => i.id !== id));

        const target = updated.isWishlist ? this.wishlist : this.items;
        target.update((list) => [updated, ...list]);
      })
    );
  }

  deleteItem(id: number) {
    return this.http.delete<void>(`${this.baseUrl}/${id}`).pipe(
      tap(() => {
        this.items.update((list) => list.filter((i) => i.id !== id));
        this.wishlist.update((list) => list.filter((i) => i.id !== id));
      })
    );
  }

  findById(id: number): ClosetItem | undefined {
    return this.items().find((item) => item.id === id);
  }

  findByIds(ids: number[]): ClosetItem[] {
    return this.items().filter((item) => ids.includes(item.id));
  }
}
