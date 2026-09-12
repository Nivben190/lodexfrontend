import { Component, EventEmitter, Output, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ClosetService } from '../../core/services/closet.service';
import {
  CLOSET_CATEGORIES,
  CLOSET_COLORS,
  CLOSET_FORMALITY,
  CLOSET_SEASONS,
  CreateClosetItemRequest
} from '../../core/models/closet.model';
import { IconComponent } from '../../shared/icon/icon.component';

const PLACEHOLDER_PREVIEWS = [
  'https://images.unsplash.com/photo-1445205170230-053b83016050?w=400&q=80',
  'https://images.unsplash.com/photo-1490481651871-ab68de25d43d?w=400&q=80',
  'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=400&q=80'
];

@Component({
  selector: 'app-add-item-modal',
  standalone: true,
  imports: [FormsModule, IconComponent],
  templateUrl: './add-item-modal.component.html',
  styleUrl: './add-item-modal.component.scss'
})
export class AddItemModalComponent {
  private closetService = inject(ClosetService);

  @Output() closed = new EventEmitter<void>();
  @Output() added = new EventEmitter<void>();

  categories = CLOSET_CATEGORIES.filter((c) => c !== 'הכל');
  colors = CLOSET_COLORS;
  seasons = CLOSET_SEASONS;
  formalityOptions = CLOSET_FORMALITY;

  previewUrl = signal<string | null>(null);
  saving = signal(false);

  form: CreateClosetItemRequest = {
    name: '',
    imageUrl: '',
    category: this.categories[0],
    color: this.colors[0].name,
    colorHex: this.colors[0].hex,
    season: this.seasons[0],
    brand: '',
    formality: this.formalityOptions[0]
  };

  onMockUpload() {
    const pick = PLACEHOLDER_PREVIEWS[Math.floor(Math.random() * PLACEHOLDER_PREVIEWS.length)];
    this.previewUrl.set(pick);
    this.form.imageUrl = pick;
  }

  selectColor(color: { name: string; hex: string }) {
    this.form.color = color.name;
    this.form.colorHex = color.hex;
  }

  close() {
    this.closed.emit();
  }

  onBackdropClick(event: MouseEvent) {
    if ((event.target as HTMLElement).classList.contains('lx-modal-backdrop')) {
      this.close();
    }
  }

  submit() {
    if (!this.form.name.trim()) return;

    this.saving.set(true);
    this.closetService.addItem(this.form).subscribe({
      next: () => {
        this.saving.set(false);
        this.added.emit();
      },
      error: () => this.saving.set(false)
    });
  }
}
