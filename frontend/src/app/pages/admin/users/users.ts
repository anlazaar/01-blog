import {
  Component,
  OnInit,
  HostListener,
  inject,
  signal,
  ChangeDetectionStrategy,
} from '@angular/core';
import { CommonModule, TitleCasePipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { AdminService } from '../../../services/admin.service';
import { DashboardUser } from '../admin.models';

// Material
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTableModule } from '@angular/material/table';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

@Component({
  selector: 'app-admin-users',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    MatButtonModule,
    MatIconModule,
    MatTableModule,
    MatTooltipModule,
    MatProgressSpinnerModule,
    TitleCasePipe,
  ],
  templateUrl: './users.html',
  styleUrls: ['../admin.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AdminUsersComponent implements OnInit {
  private adminService = inject(AdminService);

  users = signal<DashboardUser[]>([]);
  message = signal<string>('');

  pagination = signal({
    page: 0,
    size: 20,
    loading: false,
    finished: false,
  });

  userColumns: string[] = ['user', 'role', 'status', 'actions'];

  ngOnInit() {
    this.loadUsers();
  }

  @HostListener('window:scroll', [])
  onWindowScroll() {
    const pos =
      (document.documentElement.scrollTop || document.body.scrollTop) + window.innerHeight;
    const max = document.documentElement.scrollHeight || document.body.scrollHeight;

    if (pos > max - 100) {
      this.loadUsers();
    }
  }

  loadUsers() {
    const pag = this.pagination();
    if (pag.loading || pag.finished) return;

    this.pagination.update((p) => ({ ...p, loading: true }));

    this.adminService.getAllUsers(pag.page, pag.size).subscribe({
      next: (res: any) => {
        this.users.update((current) => [...current, ...(res.content as DashboardUser[])]);

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

  banUser(id: string) {
    if (!confirm('Are you sure?')) return;

    this.adminService.banUser(id).subscribe({
      next: (msg: any) => {
        this.message.set(msg);
        this.users.update((list) =>
          list.map((u) => (u.id === id ? { ...u, banned: !u.banned } : u))
        );
      },
      error: (err: any) => console.error(err),
    });
  }

  deleteUser(id: string) {
    if (!confirm('Delete user?')) return;

    this.adminService.deleteUser(id).subscribe({
      next: (msg: any) => {
        this.message.set(msg);
        this.users.update((list) => list.filter((u) => u.id !== id));
      },
      error: (err: any) => console.error(err),
    });
  }

  toggleRole(user: DashboardUser) {
    const newRole = user.role === 'ADMIN' ? 'USER' : 'ADMIN';
    const action = user.role === 'ADMIN' ? 'Demote' : 'Promote';

    if (!confirm(`Are you sure you want to ${action} ${user.username} to ${newRole}?`)) return;

    this.adminService.updateUserRole(user.id, newRole).subscribe({
      next: (msg: any) => {
        this.message.set(msg);
        this.users.update((list) =>
          list.map((u) => (u.id === user.id ? { ...u, role: newRole } : u))
        );
      },
      error: () => this.message.set('Failed to update role'),
    });
  }
}
