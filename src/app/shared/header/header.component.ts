import { Component, OnInit, inject } from '@angular/core';
import { DailyLookService } from '../../core/services/daily-look.service';

@Component({
  selector: 'app-header',
  standalone: true,
  templateUrl: './header.component.html',
  styleUrl: './header.component.scss'
})
export class HeaderComponent implements OnInit {
  private dailyLookService = inject(DailyLookService);

  weather = this.dailyLookService.dailyLook;

  ngOnInit() {
    if (!this.weather()) {
      this.dailyLookService.loadDailyLook().subscribe();
    }
  }
}
