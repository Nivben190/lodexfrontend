import { Component, EventEmitter, Input, Output, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ClosetService } from '../../core/services/closet.service';
import { ImageUploadService } from '../../core/services/image-upload.service';
import {
  CLOSET_CATEGORIES,
  CLOSET_COLORS,
  CLOSET_FORMALITY,
  CLOSET_SEASONS,
  CreateClosetItemRequest
} from '../../core/models/closet.model';
import { IconComponent } from '../../shared/icon/icon.component';

@Component({
  selector: 'app-add-item-modal',
  standalone: true,
  imports: [FormsModule, IconComponent],
  templateUrl: './add-item-modal.component.html',
  styleUrl: './add-item-modal.component.scss'
})
export class AddItemModalComponent {
  private closetService = inject(ClosetService);
  private uploads = inject(ImageUploadService);

  /** Add straight into the wishlist when opened from that tab. */
  @Input() wishlist = false;

  @Output() closed = new EventEmitter<void>();
  @Output() added = new EventEmitter<void>();

  categories = CLOSET_CATEGORIES.filter((c) => c !== 'הכל');
  colors = CLOSET_COLORS;
  seasons = CLOSET_SEASONS;
  formalityOptions = CLOSET_FORMALITY;

  previewUrl = signal<string | null>(null);
  saving = signal(false);
  uploading = signal(false);
  uploadError = signal<string | null>(null);

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

  onFileSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;

    // Let the same file be picked again after a failure.
    input.value = '';

    if (!file.type.startsWith('image/')) {
      this.uploadError.set('אפשר להעלות תמונות בלבד.');
      return;
    }

    this.uploadError.set(null);
    this.uploading.set(true);

    // Show the local file immediately; the upload swaps in the stored URL.
    const localPreview = URL.createObjectURL(file);
    this.previewUrl.set(localPreview);

    this.uploads.upload(file).subscribe({
      next: (image) => {
        URL.revokeObjectURL(localPreview);
        this.previewUrl.set(image.url);
        this.form.imageUrl = image.url;
        this.uploading.set(false);
      },
      error: () => {
        URL.revokeObjectURL(localPreview);
        this.previewUrl.set(null);
        this.form.imageUrl = '';
        this.uploading.set(false);
        this.uploadError.set('ההעלאה נכשלה. נסי שוב.');
      }
    });
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
    if (!this.form.name.trim() || this.uploading()) return;

    this.saving.set(true);
    this.closetService.addItem({ ...this.form, isWishlist: this.wishlist }).subscribe({
      next: () => {
        this.saving.set(false);
        this.added.emit();
      },
      error: () => this.saving.set(false)
    });
  }
}
