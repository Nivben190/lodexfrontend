import { Routes } from '@angular/router';

export const routes: Routes = [
  { path: '', redirectTo: 'feed', pathMatch: 'full' },
  {
    path: 'feed',
    loadComponent: () =>
      import('./features/feed/inspiration-feed.component').then((m) => m.InspirationFeedComponent)
  },
  {
    path: 'closet',
    loadComponent: () =>
      import('./features/closet/virtual-closet.component').then((m) => m.VirtualClosetComponent)
  },
  {
    path: 'suitcase',
    loadComponent: () =>
      import('./features/suitcase/suitcase-packer.component').then((m) => m.SuitcasePackerComponent)
  },
  { path: '**', redirectTo: 'feed' }
];
