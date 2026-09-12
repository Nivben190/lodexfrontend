import { Component, OnInit, inject, signal } from '@angular/core';
import { DailyLookService } from '../../core/services/daily-look.service';
import { IconComponent } from '../icon/icon.component';

const SEEN_KEY = 'lx-daily-look-seen';

/**
 * Floating "look of the day" action, lifted out of the feed so it is
 * reachable from every tab (mockup behaviour). The badge clears once the
 * sheet has been opened today.
 */
@Component({
  selector: 'app-daily-look-fab',
  standalone: true,
  imports: [IconComponent],
  templateUrl: './daily-look-fab.component.html',
  styleUrl: './daily-look-fab.component.scss'
})
export class DailyLookFabComponent implements OnInit {
  private dailyLookService = inject(DailyLookService);

  dailyLook = this.dailyLookService.dailyLook;
  isOpen = signal(false);
  isSeen = signal(true);

  ngOnInit() {
    if (!this.dailyLook()) {
      this.dailyLookService.loadDailyLook().subscribe();
    }
    this.isSeen.set(this.readSeen() === this.today());
  }

  open() {
    this.isOpen.set(true);
    this.markSeen();
  }

  close() {
    this.isOpen.set(false);
  }

  onBackdropClick(event: MouseEvent) {
    if ((event.target as HTMLElement).classList.contains('lx-sheet-backdrop')) {
      this.close();
    }
  }

  private today(): string {
    return new Date().toISOString().slice(0, 10);
  }

  private readSeen(): string | null {
    try {
      return localStorage.getItem(SEEN_KEY);
    } catch {
      return null;
    }
  }

  private markSeen() {
    this.isSeen.set(true);
    try {
      localStorage.setItem(SEEN_KEY, this.today());
    } catch {
      /* private browsing — badge simply returns next load */
    }
  }
}
