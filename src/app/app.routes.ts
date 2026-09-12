import { Routes } from '@angular/router';

export const routes: Routes = [
  { path: '', redirectTo: 'feed', pathMatch: 'full' },
  {
    path: 'feed',
    loadComponent: () =>
      import('./features/feed/inspiration-feed.component').then((m) => m.InspirationFeedComponent)
  },
  {
    path: 'saved',
    loadComponent: () =>
      import('./features/saved/saved-looks.component').then((m) => m.SavedLooksComponent)
  },
  {
    path: 'closet',
    loadComponent: () =>
      import('./features/closet/virtual-closet.component').then((m) => m.VirtualClosetComponent)
  },
  {
    path: 'outfit/new',
    loadComponent: () =>
      import('./features/outfit/outfit-builder.component').then((m) => m.OutfitBuilderComponent)
  },
  {
    path: 'outfit/:id',
    loadComponent: () =>
      import('./features/outfit/outfit-builder.component').then((m) => m.OutfitBuilderComponent)
  },
  // The suitcase packer is not part of the product's design; /suitcase is kept
  // as a redirect so any existing link still lands somewhere sensible.
  { path: 'suitcase', redirectTo: 'closet' },
  { path: '**', redirectTo: 'feed' }
];
