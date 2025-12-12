import { Component, inject, OnInit } from '@angular/core';
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
    MatDialogModule,
    MatTooltipModule,
  ],
  templateUrl: './drafts.html',
  styleUrls: ['./drafts.css'],
})
export class DraftsComponent implements OnInit {
  drafts: PostResponse[] = [];
  loading = true;

  postService = inject(PostService);
  private toast = inject(ToastService);
  private dialog = inject(MatDialog);

  ngOnInit() {
    this.loadDrafts();
  }

  loadDrafts() {
    this.postService.getDrafts().subscribe({
      next: (data) => {
        this.drafts = data;
        this.loading = false;
      },
      error: () => (this.loading = false),
    });
  }

  deleteDraft(id: string, event: Event) {
    event.stopPropagation(); // Prevent clicking the row

    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      width: '380px',
      data: { message: 'Delete this draft forever?' },
      panelClass: 'custom-dialog-panel',
      backdropClass: 'custom-backdrop-blur',
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (result === true) {
        this.postService.deletePost(id).subscribe(() => {
          this.drafts = this.drafts.filter((d) => d.id !== id);
          this.toast.show('Draft deleted successfully', 'success');
        });
      }
    });
  }
}
