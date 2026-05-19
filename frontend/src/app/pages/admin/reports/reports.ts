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
import { DashboardReport } from '../admin.models';

import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTableModule } from '@angular/material/table';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

@Component({
  selector: 'app-admin-reports',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    MatButtonModule,
    MatIconModule,
    MatTableModule,
    MatProgressSpinnerModule,
    DatePipe,
  ],
  templateUrl: './reports.html',
  styleUrls: ['../admin.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AdminReportsComponent implements OnInit {
  private adminService = inject(AdminService);

  reportTab = signal<'users' | 'posts'>('users');
  message = signal<string>('');
  isLoading = signal(false);

  userReports = signal<DashboardReport[]>([]);
  postReports = signal<DashboardReport[]>([]);

  reportColumns: string[] = ['details', 'status', 'createdAt', 'actions'];

  ngOnInit() {
    this.loadReports();
  }

  loadReports() {
    if (this.isLoading()) return;
    this.isLoading.set(true);

    this.adminService.getAllReports().subscribe({
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      next: (res: any) => {
        const data: DashboardReport[] = Array.isArray(res?.content)
          ? res.content
          : Array.isArray(res)
          ? res
          : [];

        this.userReports.set(data.filter((r) => r.type === 'USER'));
        this.postReports.set(data.filter((r) => r.type === 'POST'));

        this.isLoading.set(false);
      },
      error: () => this.isLoading.set(false),
    });
  }

  resolveReport(id: string) {
    this.adminService.resolveReport(id).subscribe({
      next: (msg: any) => {
        this.message.set(msg);

        // update USER reports
        this.userReports.update((list) =>
          list.map((r) => (r.id === id ? { ...r, resolved: true } : r))
        );

        // update POST reports
        this.postReports.update((list) =>
          list.map((r) => (r.id === id ? { ...r, resolved: true } : r))
        );
      },
      error: (err: any) => console.error(err),
    });
  }
}
