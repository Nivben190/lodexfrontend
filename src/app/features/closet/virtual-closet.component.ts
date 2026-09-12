import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { ClosetService } from '../../core/services/closet.service';
import { CLOSET_CATEGORIES, CLOSET_COLORS } from '../../core/models/closet.model';
import { AddItemModalComponent } from './add-item-modal.component';
import { IconComponent } from '../../shared/icon/icon.component';

type SortMode = 'newest' | 'name';

@Component({
  selector: 'app-virtual-closet',
  standalone: true,
  imports: [AddItemModalComponent, IconComponent],
  templateUrl: './virtual-closet.component.html',
  styleUrl: './virtual-closet.component.scss'
})
export class VirtualClosetComponent implements OnInit {
  closetService = inject(ClosetService);

  categories = CLOSET_CATEGORIES;
  colors = CLOSET_COLORS;

  loading = this.closetService.loading;
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

  ngOnInit() {
    this.closetService.loadCloset().subscribe();
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

  retry() {
    this.closetService.loadCloset().subscribe();
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

  sortedItems() {
    const items = [...this.closetService.filteredItems()];
    if (this.sortMode() === 'name') {
      return items.sort((a, b) => a.name.localeCompare(b.name, 'he'));
    }
    return items.sort((a, b) => new Date(b.addedAt).getTime() - new Date(a.addedAt).getTime());
  }

  onItemAdded() {
    this.showAddModal.set(false);
  }
}
