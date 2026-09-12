import { Component } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';

interface NavTab {
  path: string;
  label: string;
  icon: string;
}

@Component({
  selector: 'app-bottom-nav',
  standalone: true,
  imports: [RouterLink, RouterLinkActive],
  templateUrl: './bottom-nav.component.html',
  styleUrl: './bottom-nav.component.scss'
})
export class BottomNavComponent {
  tabs: NavTab[] = [
    { path: '/feed', label: 'השראות', icon: '✨' },
    { path: '/closet', label: 'הארון שלי', icon: '👗' },
    { path: '/suitcase', label: 'מזוודה', icon: '🧳' }
  ];
}
