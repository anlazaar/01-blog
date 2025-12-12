import {
  Component,
  OnInit,
  OnDestroy,
  inject,
  ViewChildren,
  QueryList,
  AfterViewInit,
  HostListener,
} from '@angular/core';
import { CommonModule, TitleCasePipe, DatePipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { AdminService, DashboardStats } from '../../../services/admin.service';
import { ChartConfiguration, ChartOptions } from 'chart.js';
import { BaseChartDirective } from 'ng2-charts';

// Angular Material Imports
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTableModule } from '@angular/material/table';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

@Component({
  selector: 'app-admin-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    BaseChartDirective,
    MatButtonModule,
    MatIconModule,
    MatTableModule,
    MatTooltipModule,
    MatProgressSpinnerModule,
    TitleCasePipe,
    DatePipe,
  ],
  templateUrl: './dashboard.html',
  styleUrls: ['./dashboard.css'],
})
export class AdminDashboardComponent implements OnInit, AfterViewInit, OnDestroy {
  private adminService = inject(AdminService);

  @ViewChildren(BaseChartDirective) charts!: QueryList<BaseChartDirective>;

  // State
  activeTab: 'overview' | 'users' | 'posts' | 'reports' = 'overview';

  // Data Sources
  users: any[] = [];
  posts: any[] = [];
  reports: any[] = [];
  stats: DashboardStats | null = null;

  // Global loading (for initial stats/setup)
  isLoading = false;
  message = '';

  // === PAGINATION STATE ===
  // Tracks the current page, size, and loading status for each tab independently
  pagination = {
    users: { page: 0, size: 20, loading: false, finished: false },
    posts: { page: 0, size: 20, loading: false, finished: false },
    reports: { page: 0, size: 20, loading: false, finished: false },
  };

  // Material Table Column Definitions
  userColumns: string[] = ['user', 'role', 'status', 'actions'];
  postColumns: string[] = ['title', 'author', 'date', 'actions'];
  reportColumns: string[] = ['details', 'status', 'actions'];

  private themeObserver: MutationObserver | null = null;

  // --- CHART CONFIGURATION (Kept exactly as provided) ---
  public lineChartData: ChartConfiguration<'line'>['data'] = {
    labels: [],
    datasets: [],
  };

  public lineChartOptions: ChartOptions<'line'> = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: { padding: 10, cornerRadius: 4, displayColors: false },
    },
    scales: {
      x: { grid: { display: false } },
      y: { grid: { display: true } },
    },
  };

  public postChartData: ChartConfiguration<'bar'>['data'] = {
    labels: [],
    datasets: [],
  };

  public barChartOptions: ChartOptions<'bar'> = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: { legend: { display: false } },
    scales: {
      x: { grid: { display: false } },
      y: { grid: { display: true } },
    },
  };

  ngOnInit() {
    this.loadStats();
  }

  ngAfterViewInit() {
    this.themeObserver = new MutationObserver(() => {
      this.updateChartTheme();
    });
    this.themeObserver.observe(document.body, {
      attributes: true,
      attributeFilter: ['class'],
    });
    this.updateChartTheme();
  }

  ngOnDestroy() {
    if (this.themeObserver) {
      this.themeObserver.disconnect();
    }
  }

  // === SCROLL LISTENER ===
  @HostListener('window:scroll', [])
  onWindowScroll() {
    if (this.activeTab === 'overview') return;

    // Calculate scroll position
    const pos =
      (document.documentElement.scrollTop || document.body.scrollTop) + window.innerHeight;
    const max = document.documentElement.scrollHeight || document.body.scrollHeight;

    // If we are within 100px of the bottom
    if (pos > max - 100) {
      if (this.activeTab === 'users') this.loadUsers();
      if (this.activeTab === 'posts') this.loadPosts();
      if (this.activeTab === 'reports') this.loadReports();
    }
  }

  updateChartTheme() {
    if (!this.charts) return;
    const styles = getComputedStyle(document.body);
    const textPrimary = styles.getPropertyValue('--text-primary').trim();
    const textSecondary = styles.getPropertyValue('--text-secondary').trim();
    const borderColor = styles.getPropertyValue('--border').trim();
    const cardBg = styles.getPropertyValue('--card').trim();

    const scaleOptions = {
      x: { grid: { display: false, color: borderColor }, ticks: { color: textSecondary } },
      y: { grid: { color: borderColor }, ticks: { color: textSecondary } },
    };

    const pluginOptions = {
      legend: { display: false },
      tooltip: { backgroundColor: textPrimary, titleColor: cardBg, bodyColor: cardBg },
    };

    this.lineChartOptions = {
      ...this.lineChartOptions,
      scales: scaleOptions,
      plugins: pluginOptions,
    };
    this.barChartOptions = {
      ...this.barChartOptions,
      scales: scaleOptions,
      plugins: pluginOptions,
    };

    this.charts.forEach((chart) => {
      if (chart.chart) chart.chart.update();
    });
  }

  switchTab(tab: 'overview' | 'users' | 'posts' | 'reports') {
    this.activeTab = tab;
    this.message = '';

    if (tab === 'overview') {
      this.loadStats();
      setTimeout(() => this.updateChartTheme(), 100);
    }
    // Only load if empty to prevent resetting scroll position or re-fetching
    if (tab === 'users' && this.users.length === 0) this.loadUsers();
    if (tab === 'posts' && this.posts.length === 0) this.loadPosts();
    if (tab === 'reports' && this.reports.length === 0) this.loadReports();
  }

  // === LOAD DATA ===
  loadStats() {
    this.isLoading = true;
    this.adminService.getDashboardStats().subscribe({
      next: (res) => {
        this.stats = res;
        this.setupCharts(res);
        this.isLoading = false;
        setTimeout(() => this.updateChartTheme(), 0);
      },
      error: (err) => {
        console.error(err);
        this.isLoading = false;
      },
    });
  }

  setupCharts(stats: DashboardStats) {
    const userLabels = stats.userGrowth.map((d) => d.label);
    const userValues = stats.userGrowth.map((d) => d.value);

    this.lineChartData = {
      labels: userLabels,
      datasets: [
        {
          data: userValues,
          label: 'Users',
          fill: true,
          tension: 0.4,
          borderColor: '#1a8917',
          backgroundColor: 'rgba(26, 137, 23, 0.1)',
          pointBackgroundColor: '#1a8917',
          pointBorderColor: '#ffffff',
        },
      ],
    };

    const postLabels = stats.postGrowth.map((d) => d.label);
    const postValues = stats.postGrowth.map((d) => d.value);

    this.postChartData = {
      labels: postLabels,
      datasets: [
        {
          data: postValues,
          label: 'Stories',
          backgroundColor: '#3b82f6',
          borderRadius: 4,
        },
      ],
    };
  }

  // === PAGINATED LOADERS ===

  loadUsers() {
    const state = this.pagination.users;
    if (state.loading || state.finished) return;

    state.loading = true;
    this.adminService.getAllUsers(state.page, state.size).subscribe({
      next: (res) => {
        // Append new data
        this.users = [...this.users, ...res.content];

        // Update pagination tracking
        state.page++;
        state.finished = res.page.number >= res.page.totalPages - 1;
        state.loading = false;
      },
      error: () => {
        state.loading = false;
      },
    });
  }

  loadPosts() {
    const state = this.pagination.posts;
    if (state.loading || state.finished) return;

    state.loading = true;
    this.adminService.getAllPosts(state.page, state.size).subscribe({
      next: (res) => {
        this.posts = [...this.posts, ...res.content];

        state.page++;
        state.finished = res.page.number >= res.page.totalPages - 1;
        state.loading = false;
      },
      error: () => {
        state.loading = false;
      },
    });
  }

  loadReports() {
    this.isLoading = true;
    this.adminService.getAllReports().subscribe({
      next: (res: any) => {
        this.reports =
          res.content && Array.isArray(res.content) ? res.content : Array.isArray(res) ? res : [];
        this.isLoading = false;
      },
      error: () => (this.isLoading = false),
    });
  }

  // === ACTIONS ===

  banUser(id: string) {
    if (!confirm('Are you sure?')) return;
    this.adminService.banUser(id).subscribe({
      next: (msg) => {
        this.message = msg;
        // Update local array directly instead of reloading to keep scroll position
        const user = this.users.find((u) => u.id === id);
        if (user) user.banned = !user.banned;
      },
      error: (err) => console.error(err),
    });
  }

  deleteUser(id: string) {
    if (!confirm('Delete user?')) return;
    this.adminService.deleteUser(id).subscribe({
      next: (msg) => {
        this.message = msg;
        // Filter out locally
        this.users = this.users.filter((u) => u.id !== id);
      },
      error: (err) => console.error(err),
    });
  }

  resolveReport(id: string) {
    this.adminService.resolveReport(id).subscribe({
      next: (msg) => {
        this.message = msg;
        // Update local status
        const report = this.reports.find((r) => r.id === id);
        if (report) report.resolved = true;
      },
      error: (err) => console.error(err),
    });
  }

  toggleRole(user: any) {
    const newRole = user.role === 'ADMIN' ? 'USER' : 'ADMIN';
    const action = user.role === 'ADMIN' ? 'Demote' : 'Promote';
    if (!confirm(`Are you sure you want to ${action} ${user.username} to ${newRole}?`)) return;

    this.adminService.updateUserRole(user.id, newRole).subscribe({
      next: (msg) => {
        this.message = msg;
        user.role = newRole;
      },
      error: () => (this.message = 'Failed to update role'),
    });
  }
}
