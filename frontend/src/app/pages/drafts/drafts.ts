import { Component, inject, signal, effect, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { PostService } from '../../services/post.service';
import { PostResponse } from '../../models/POST/PostResponse';
import { ToastService } from '../../services/toast.service';

// Components
import { ConfirmDialogComponent } from '../../share/ConfirmDialogComponent/confirm-dialog';

// Angular Material Imports
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatTooltipModule } from '@angular/material/tooltip';

@Component({
  selector: 'app-drafts',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatDialogModule, // Includes MatDialog
    MatTooltipModule,
  ],
  templateUrl: './drafts.html',
  styleUrls: ['./drafts.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DraftsComponent {
  // Dependencies
  private postService = inject(PostService);
  private toast = inject(ToastService);
  private dialog = inject(MatDialog);

  // 1. STATE SIGNALS
  drafts = signal<PostResponse[]>([]);
  isLoading = signal(true);

  constructor() {
    // 2. EFFECT: Load data when component is created
    effect(() => {
      this.loadDrafts();
    });
  }

  private loadDrafts() {
    this.postService.getDrafts().subscribe({
      next: (data) => {
        this.drafts.set(data);
        this.isLoading.set(false);
      },
      error: () => this.isLoading.set(false),
    });
  }

  // 3. ACTIONS
  deleteDraft(id: string, event: Event) {
    event.stopPropagation(); // Prevent navigation to edit page

    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      width: '380px',
      data: { message: 'Delete this draft forever?' },
      panelClass: 'custom-dialog-panel',
      backdropClass: 'custom-backdrop-blur',
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (result === true) {
        // Optimistic update or wait for API?
        // Let's wait for API to ensure it's actually gone.
        this.postService.deletePost(id).subscribe({
          next: () => {
            // Immutable update: remove item from signal list
            this.drafts.update((current) => current.filter((d) => d.id !== id));
            this.toast.show('Draft deleted successfully', 'success');
          },
          error: () => this.toast.show('Failed to delete draft', 'error'),
        });
      }
    });
  }
}
