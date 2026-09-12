import { Component, OnInit, inject, signal } from '@angular/core';
import { ClosetService } from '../../core/services/closet.service';
import { CLOSET_CATEGORIES, CLOSET_COLORS } from '../../core/models/closet.model';
import { AddItemModalComponent } from './add-item-modal.component';

type SortMode = 'newest' | 'name';

@Component({
  selector: 'app-virtual-closet',
  standalone: true,
  imports: [AddItemModalComponent],
  templateUrl: './virtual-closet.component.html',
  styleUrl: './virtual-closet.component.scss'
})
export class VirtualClosetComponent implements OnInit {
  closetService = inject(ClosetService);

  categories = CLOSET_CATEGORIES;
  colors = CLOSET_COLORS;

  sortMode = signal<SortMode>('newest');
  showAddModal = signal(false);

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
