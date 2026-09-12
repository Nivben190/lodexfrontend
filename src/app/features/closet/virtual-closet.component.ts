import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { ClosetService } from '../../core/services/closet.service';
import { OutfitService } from '../../core/services/outfit.service';
import { Outfit } from '../../core/models/outfit.model';
import { CLOSET_CATEGORIES, CLOSET_COLORS, ClosetItem } from '../../core/models/closet.model';
import { AddItemModalComponent } from './add-item-modal.component';
import { IconComponent } from '../../shared/icon/icon.component';

type SortMode = 'newest' | 'name';
type ClosetTab = 'items' | 'looks' | 'wishlist';

@Component({
  selector: 'app-virtual-closet',
  standalone: true,
  imports: [AddItemModalComponent, IconComponent],
  templateUrl: './virtual-closet.component.html',
  styleUrl: './virtual-closet.component.scss'
})
export class VirtualClosetComponent implements OnInit {
  closetService = inject(ClosetService);
  outfitService = inject(OutfitService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);

  categories = CLOSET_CATEGORIES;
  colors = CLOSET_COLORS;

  loading = this.closetService.loading;
  activeTab = signal<ClosetTab>('items');
  sortMode = signal<SortMode>('newest');
  showAddModal = signal(false);
  showFilters = signal(false);

  /** True when anything beyond the default category view is applied. */
  hasRefinements = computed(
    () => this.closetService.activeColor() !== null || this.sortMode() !== 'newest'
  );

  activeColorHex = computed(() => {
    const name = this.closetService.activeColor();
    if (!name) return null;
    return this.colors.find((c) => c.name === name)?.hex ?? null;
  });

  /** Whichever list the active tab shows, filtered and sorted. */
  visibleItems = computed(() => {
    const source =
      this.activeTab() === 'wishlist'
        ? this.closetService.filteredWishlist()
        : this.closetService.filteredItems();

    const items = [...source];

    if (this.sortMode() === 'name') {
      return items.sort((a, b) => a.name.localeCompare(b.name, 'he'));
    }
    return items.sort((a, b) => new Date(b.addedAt).getTime() - new Date(a.addedAt).getTime());
  });

  /** Looks the wearer has built, newest first. */
  outfits = computed(() => this.outfitService.outfits());

  newLook() {
    this.router.navigate(['/outfit/new']);
  }

  openLook(outfit: Outfit) {
    this.router.navigate(['/outfit', outfit.id]);
  }

  deleteLook(event: Event, outfit: Outfit) {
    event.stopPropagation();
    this.outfitService.remove(outfit.id).subscribe();
  }

  ngOnInit() {
    this.outfitService.load().subscribe();

    // Saving a look returns here with ?tab=looks, so it lands on what it just made.
    const tab = this.route.snapshot.queryParamMap.get('tab');
    if (tab === 'looks' || tab === 'wishlist' || tab === 'items') {
      this.activeTab.set(tab as ClosetTab);
    }

    this.closetService.loadCloset().subscribe();
    this.closetService.loadWishlist().subscribe();
  }

  setTab(tab: ClosetTab) {
    this.activeTab.set(tab);
  }

  setCategory(category: string) {
    this.closetService.activeCategory.set(category);
  }

  toggleColor(colorName: string) {
    const current = this.closetService.activeColor();
    this.closetService.activeColor.set(current === colorName ? null : colorName);
  }

  setSort(mode: SortMode) {
    this.sortMode.set(mode);
  }

  /** Moves a piece between the two tabs. */
  toggleWishlist(item: ClosetItem) {
    this.closetService.setWishlist(item.id, !item.isWishlist).subscribe();
  }

  retry() {
    this.closetService.loadCloset().subscribe();
    this.closetService.loadWishlist().subscribe();
  }

  resetFilters() {
    this.closetService.activeCategory.set('הכל');
    this.closetService.activeColor.set(null);
    this.sortMode.set('newest');
  }

  onFilterBackdrop(event: MouseEvent) {
    if ((event.target as HTMLElement).classList.contains('lx-sheet-backdrop')) {
      this.showFilters.set(false);
    }
  }

  onItemAdded() {
    this.showAddModal.set(false);
  }
}
