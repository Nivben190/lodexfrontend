import { Component, OnInit, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { DailyLookService } from '../../core/services/daily-look.service';
import { IconComponent } from '../icon/icon.component';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [RouterLink, IconComponent],
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
