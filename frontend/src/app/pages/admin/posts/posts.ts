import {
  Component,
  OnInit,
  HostListener,
  inject,
  signal,
  ChangeDetectionStrategy,
} from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { AdminService } from '../../../services/admin.service';
import { DashboardPost } from '../admin.models';

import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTableModule } from '@angular/material/table';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

@Component({
  selector: 'app-admin-posts',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    MatButtonModule,
    MatIconModule,
    MatTableModule,
    MatTooltipModule,
    MatProgressSpinnerModule,
    DatePipe,
  ],
  templateUrl: './posts.html',
  styleUrls: ['../admin.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AdminPostsComponent implements OnInit {
  private adminService = inject(AdminService);

  posts = signal<DashboardPost[]>([]);

  pagination = signal({
    page: 0,
    size: 20,
    loading: false,
    finished: false,
  });

  postColumns: string[] = ['title', 'author', 'date', 'actions'];

  ngOnInit() {
    this.loadPosts();
  }

  @HostListener('window:scroll', [])
  onWindowScroll() {
    const pos =
      (document.documentElement.scrollTop || document.body.scrollTop) + window.innerHeight;
    const max = document.documentElement.scrollHeight || document.body.scrollHeight;

    if (pos > max - 100) {
      this.loadPosts();
    }
  }

  loadPosts() {
    const pag = this.pagination();
    if (pag.loading || pag.finished) return;

    this.pagination.update((p) => ({ ...p, loading: true }));

    this.adminService.getAllPosts(pag.page, pag.size).subscribe({
      next: (res: any) => {
        this.posts.update((current) => [...current, ...(res.content as DashboardPost[])]);

        this.pagination.update((p) => ({
          ...p,
          loading: false,
          page: p.page + 1,
          finished: res.page.number >= res.page.totalPages - 1,
        }));
      },
      error: () => {
        this.pagination.update((p) => ({ ...p, loading: false }));
      },
    });
  }
}
