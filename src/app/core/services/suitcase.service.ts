import { HttpClient } from '@angular/common/http';
import { Injectable, computed, inject, signal } from '@angular/core';
import { tap } from 'rxjs';
import { environment } from '../../../environments/environment';
import {
  AddLookToSuitcaseRequest,
  AddLookToSuitcaseResult,
  Suitcase,
  TogglePackedRequest
} from '../models/suitcase.model';

@Injectable({ providedIn: 'root' })
export class SuitcaseService {
  private http = inject(HttpClient);
  private baseUrl = `${environment.apiBaseUrl}/suitcase`;

  suitcases = signal<Suitcase[]>([]);
  loading = signal(false);
  /** Set when the last load errored, so the UI can offer a retry. */
  loadFailed = signal(false);
  activeSuitcaseId = signal<number | null>(null);

  /** Falls back to the first trip; undefined until suitcases have loaded. */
  activeSuitcase = computed<Suitcase | undefined>(
    () => this.suitcases().find((s) => s.id === this.activeSuitcaseId()) ?? this.suitcases().at(0)
  );

  loadSuitcases() {
    this.loading.set(true);
    this.loadFailed.set(false);
    return this.http.get<Suitcase[]>(this.baseUrl).pipe(
      tap({
        next: (suitcases) => {
          this.suitcases.set(suitcases);
          if (this.activeSuitcaseId() === null && suitcases.length > 0) {
            this.activeSuitcaseId.set(suitcases[0].id);
          }
        },
        error: () => {
          this.loadFailed.set(true);
          this.loading.set(false);
        },
        complete: () => this.loading.set(false)
      })
    );
  }

  togglePacked(request: TogglePackedRequest) {
    return this.http.patch<Suitcase>(`${this.baseUrl}/toggle-packed`, request).pipe(
      tap((updated) => {
        this.suitcases.update((list) => list.map((s) => (s.id === updated.id ? updated : s)));
      })
    );
  }

  addLookToSuitcase(suitcaseId: number, request: AddLookToSuitcaseRequest) {
    return this.http.post<AddLookToSuitcaseResult>(`${this.baseUrl}/${suitcaseId}/add-look`, request).pipe(
      tap((result) => {
        this.suitcases.update((list) => list.map((s) => (s.id === result.suitcase.id ? result.suitcase : s)));
      })
    );
  }
}
