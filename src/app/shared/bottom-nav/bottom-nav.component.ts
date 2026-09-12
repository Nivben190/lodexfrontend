import { Component } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { IconComponent, IconName } from '../icon/icon.component';

interface NavTab {
  path: string;
  label: string;
  icon: IconName;
}

@Component({
  selector: 'app-bottom-nav',
  standalone: true,
  imports: [RouterLink, RouterLinkActive, IconComponent],
  templateUrl: './bottom-nav.component.html',
  styleUrl: './bottom-nav.component.scss'
})
export class BottomNavComponent {
  // Order mirrors the mockup's dock: saved, search, wardrobe.
  tabs: NavTab[] = [
    { path: '/saved', label: 'ההשראות ששמרת', icon: 'bookmark' },
    { path: '/feed', label: 'השראות', icon: 'search' },
    { path: '/closet', label: 'הארון שלי', icon: 'shirt' }
  ];
}
