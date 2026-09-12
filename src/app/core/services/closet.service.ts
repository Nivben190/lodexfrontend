import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, computed, inject, signal } from '@angular/core';
import { tap } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ClosetItem, CreateClosetItemRequest } from '../models/closet.model';

@Injectable({ providedIn: 'root' })
export class ClosetService {
  private http = inject(HttpClient);
  private baseUrl = `${environment.apiBaseUrl}/closet`;

  items = signal<ClosetItem[]>([]);
  loading = signal(false);

  activeCategory = signal<string>('הכל');
  activeColor = signal<string | null>(null);

  filteredItems = computed(() => {
    const category = this.activeCategory();
    const color = this.activeColor();
    return this.items().filter((item) => {
      const categoryMatch = category === 'הכל' || item.category === category;
      const colorMatch = !color || item.color === color;
      return categoryMatch && colorMatch;
    });
  });

  loadCloset() {
    this.loading.set(true);
    return this.http.get<ClosetItem[]>(this.baseUrl).pipe(
      tap({
        next: (items) => this.items.set(items),
        error: () => this.loading.set(false),
        complete: () => this.loading.set(false)
      })
    );
  }

  addItem(request: CreateClosetItemRequest) {
    return this.http.post<ClosetItem>(this.baseUrl, request).pipe(
      tap((item) => this.items.update((items) => [item, ...items]))
    );
  }

  findById(id: number): ClosetItem | undefined {
    return this.items().find((item) => item.id === id);
  }

  findByIds(ids: number[]): ClosetItem[] {
    return this.items().filter((item) => ids.includes(item.id));
  }
}
