import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { PostService } from '../../services/post.service';
import { PostResponse } from '../../models/global.model';

@Component({
  selector: 'app-drafts',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './drafts.html',
  styleUrls: ['./drafts.css'],
})
export class DraftsComponent implements OnInit {
  drafts: PostResponse[] = [];
  loading = true;
  postService = inject(PostService);

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

  deleteDraft(id: string) {
    if (confirm('Are you sure you want to delete this draft?')) {
      this.postService.deletePost(id).subscribe(() => {
        this.drafts = this.drafts.filter((d) => d.id !== id);
      });
    }
  }
}
