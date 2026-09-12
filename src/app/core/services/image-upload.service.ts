import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, from, switchMap } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface UploadedImage {
  id: string;
  url: string;
}

/** Longest edge after downscaling. Plenty for a closet tile, far smaller than a phone photo. */
const MAX_EDGE = 1200;
const JPEG_QUALITY = 0.85;

@Injectable({ providedIn: 'root' })
export class ImageUploadService {
  private http = inject(HttpClient);
  private baseUrl = `${environment.apiBaseUrl}/images`;

  /**
   * Downscales in the browser, then uploads.
   *
   * A modern phone photo is 3–8MB; sending that straight up would be slow on
   * mobile data and store far more than a 142px tile can ever show.
   */
  upload(file: File): Observable<UploadedImage> {
    return from(this.toResizedBlob(file)).pipe(
      switchMap((blob) => {
        const form = new FormData();
        form.append('file', blob, this.fileName(file));
        return this.http.post<UploadedImage>(this.baseUrl, form);
      })
    );
  }

  private fileName(file: File): string {
    const base = file.name.replace(/\.[^.]+$/, '') || 'photo';
    return `${base}.jpg`;
  }

  private async toResizedBlob(file: File): Promise<Blob> {
    try {
      const bitmap = await this.decode(file);

      const scale = Math.min(1, MAX_EDGE / Math.max(bitmap.width, bitmap.height));
      const width = Math.max(1, Math.round(bitmap.width * scale));
      const height = Math.max(1, Math.round(bitmap.height * scale));

      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;

      const context = canvas.getContext('2d');
      if (!context) return file;

      context.drawImage(bitmap, 0, 0, width, height);
      if ('close' in bitmap) (bitmap as ImageBitmap).close();

      const blob = await new Promise<Blob | null>((resolve) =>
        canvas.toBlob(resolve, 'image/jpeg', JPEG_QUALITY)
      );

      // If the original was already smaller, keep it rather than re-encoding up.
      return blob && blob.size < file.size ? blob : file;
    } catch {
      // Any decode failure falls back to the original bytes; the API validates anyway.
      return file;
    }
  }

  private async decode(file: File): Promise<ImageBitmap | HTMLImageElement> {
    if ('createImageBitmap' in window) {
      return createImageBitmap(file);
    }

    // Safari fallback.
    const url = URL.createObjectURL(file);
    try {
      const image = new Image();
      await new Promise((resolve, reject) => {
        image.onload = resolve;
        image.onerror = reject;
        image.src = url;
      });
      return image;
    } finally {
      URL.revokeObjectURL(url);
    }
  }
}
