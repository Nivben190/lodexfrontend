import { HttpClient } from '@angular/common/http';
import { Injectable, inject, signal } from '@angular/core';
import { tap } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Outfit, SaveOutfitRequest } from '../models/outfit.model';

@Injectable({ providedIn: 'root' })
export class OutfitService {
  private http = inject(HttpClient);
  private baseUrl = `${environment.apiBaseUrl}/outfits`;

  readonly outfits = signal<Outfit[]>([]);
  readonly loading = signal(false);
  readonly loadFailed = signal(false);

  load() {
    this.loading.set(true);
    this.loadFailed.set(false);

    return this.http.get<Outfit[]>(this.baseUrl).pipe(
      tap({
        next: (list) => {
          this.outfits.set(list);
          this.loading.set(false);
        },
        error: () => {
          this.loading.set(false);
          this.loadFailed.set(true);
        }
      })
    );
  }

  getById(id: number) {
    return this.http.get<Outfit>(`${this.baseUrl}/${id}`);
  }

  create(request: SaveOutfitRequest) {
    return this.http.post<Outfit>(this.baseUrl, request).pipe(
      tap((saved) => this.outfits.update((list) => [saved, ...list]))
    );
  }

  update(id: number, request: SaveOutfitRequest) {
    return this.http.put<Outfit>(`${this.baseUrl}/${id}`, request).pipe(
      tap((saved) => this.outfits.update((list) => list.map((o) => (o.id === id ? saved : o))))
    );
  }

  remove(id: number) {
    return this.http.delete<void>(`${this.baseUrl}/${id}`).pipe(
      tap(() => this.outfits.update((list) => list.filter((o) => o.id !== id)))
    );
  }
}
