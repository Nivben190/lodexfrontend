import { HttpClient } from '@angular/common/http';
import { Injectable, inject, signal } from '@angular/core';
import { tap } from 'rxjs';
import { environment } from '../../../environments/environment';
import { DailyLook } from '../models/daily-look.model';

@Injectable({ providedIn: 'root' })
export class DailyLookService {
  private http = inject(HttpClient);
  private baseUrl = `${environment.apiBaseUrl}/dailylook`;

  dailyLook = signal<DailyLook | null>(null);
  loading = signal(false);

  loadDailyLook() {
    this.loading.set(true);
    return this.http.get<DailyLook>(this.baseUrl).pipe(
      tap({
        next: (look) => this.dailyLook.set(look),
        error: () => this.loading.set(false),
        complete: () => this.loading.set(false)
      })
    );
  }
}
