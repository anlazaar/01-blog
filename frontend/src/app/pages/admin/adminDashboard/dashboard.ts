import {
  Component,
  OnInit,
  AfterViewInit,
  inject,
  ViewChildren,
  QueryList,
  HostListener,
  signal,
  effect,
  DestroyRef,
  ChangeDetectionStrategy,
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
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AdminDashboardComponent implements OnInit, AfterViewInit {
  private adminService = inject(AdminService);
  private destroyRef = inject(DestroyRef); // Clean up observers

  // ViewChildren allows us to access the charts to manually update them
  @ViewChildren(BaseChartDirective) charts!: QueryList<BaseChartDirective>;

  // --- 1. STATE SIGNALS ---
  activeTab = signal<'overview' | 'users' | 'posts' | 'reports'>('overview');
  stats = signal<DashboardStats | null>(null);
  message = signal<string>('');
  isLoading = signal(false);

  // Data Lists
  users = signal<any[]>([]);
  posts = signal<any[]>([]);
  reports = signal<any[]>([]);

  // Pagination State
  // We group this to keep the namespace clean
  pagination = signal({
    users: { page: 0, size: 20, loading: false, finished: false },
    posts: { page: 0, size: 20, loading: false, finished: false },
    reports: { page: 0, size: 20, loading: false, finished: false },
  });

  // Material Table Columns
  userColumns: string[] = ['user', 'role', 'status', 'actions'];
  postColumns: string[] = ['title', 'author', 'date', 'actions'];
  reportColumns: string[] = ['details', 'status', 'actions'];

  // --- 2. CHART CONFIGURATION ---
  // Initial empty data structures
  public lineChartData: ChartConfiguration<'line'>['data'] = { labels: [], datasets: [] };
  public postChartData: ChartConfiguration<'bar'>['data'] = { labels: [], datasets: [] };

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

  public barChartOptions: ChartOptions<'bar'> = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: { legend: { display: false } },
    scales: {
      x: { grid: { display: false } },
      y: { grid: { display: true } },
    },
  };

  private themeObserver: MutationObserver | null = null;

  constructor() {
    // EFFECT: Update charts when stats data arrives
    effect(() => {
      const currentStats = this.stats();
      if (currentStats) {
        this.setupCharts(currentStats);
      }
    });
  }

  ngOnInit() {
    this.loadStats();
  }

  ngAfterViewInit() {
    // Theme switching logic requires DOM observation
    this.themeObserver = new MutationObserver(() => this.updateChartTheme());
    this.themeObserver.observe(document.body, { attributes: true, attributeFilter: ['class'] });

    // Run once to set initial theme colors
    setTimeout(() => this.updateChartTheme(), 100);

    // Register cleanup
    this.destroyRef.onDestroy(() => {
      this.themeObserver?.disconnect();
    });
  }

  // === 3. EVENT LISTENERS ===

  @HostListener('window:scroll', [])
  onWindowScroll() {
    // Only load more if not on overview tab
    if (this.activeTab() === 'overview') return;

    const pos =
      (document.documentElement.scrollTop || document.body.scrollTop) + window.innerHeight;
    const max = document.documentElement.scrollHeight || document.body.scrollHeight;

    // Load more when user scrolls to bottom (buffer of 100px)
    if (pos > max - 100) {
      const tab = this.activeTab();
      if (tab === 'users') this.loadUsers();
      if (tab === 'posts') this.loadPosts();
      if (tab === 'reports') this.loadReports();
    }
  }

  switchTab(tab: 'overview' | 'users' | 'posts' | 'reports') {
    this.activeTab.set(tab);
    this.message.set('');

    if (tab === 'overview') {
      this.loadStats();
      // Re-apply theme after a short delay to allow canvas to render
      setTimeout(() => this.updateChartTheme(), 100);
    }

    // Lazy load data if empty
    if (tab === 'users' && this.users().length === 0) this.loadUsers();
    if (tab === 'posts' && this.posts().length === 0) this.loadPosts();
    if (tab === 'reports' && this.reports().length === 0) this.loadReports();
  }

  // === 4. DATA LOADING ===

  loadStats() {
    this.isLoading.set(true);
    this.adminService.getDashboardStats().subscribe({
      next: (res) => {
        this.stats.set(res);
        this.isLoading.set(false);
      },
      error: (err) => {
        console.error('Stats Error', err);
        this.isLoading.set(false);
      },
    });
  }

  setupCharts(stats: DashboardStats) {
    // Map data from API to Chart.js format
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

    // Trigger update on directives
    this.charts?.forEach((c) => c.chart?.update());
  }

  updateChartTheme() {
    if (!this.charts) return;

    // Read CSS Variables to make charts match Dark/Light mode
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

    // Apply to options
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

    this.charts.forEach((chart) => chart.chart?.update());
  }

  // === 5. PAGINATED DATA LOGIC ===

  loadUsers() {
    const pag = this.pagination();
    if (pag.users.loading || pag.users.finished) return;

    // Set Loading State
    this.pagination.update((p) => ({ ...p, users: { ...p.users, loading: true } }));

    this.adminService.getAllUsers(pag.users.page, pag.users.size).subscribe({
      next: (res) => {
        // Append new data
        this.users.update((current) => [...current, ...res.content]);

        // Update pagination cursor
        this.pagination.update((p) => ({
          ...p,
          users: {
            ...p.users,
            loading: false,
            page: p.users.page + 1,
            finished: res.page.number >= res.page.totalPages - 1,
          },
        }));
      },
      error: () => {
        this.pagination.update((p) => ({ ...p, users: { ...p.users, loading: false } }));
      },
    });
  }

  loadPosts() {
    const pag = this.pagination();
    if (pag.posts.loading || pag.posts.finished) return;

    this.pagination.update((p) => ({ ...p, posts: { ...p.posts, loading: true } }));

    this.adminService.getAllPosts(pag.posts.page, pag.posts.size).subscribe({
      next: (res) => {
        this.posts.update((current) => [...current, ...res.content]);

        this.pagination.update((p) => ({
          ...p,
          posts: {
            ...p.posts,
            loading: false,
            page: p.posts.page + 1,
            finished: res.page.number >= res.page.totalPages - 1,
          },
        }));
      },
      error: () => {
        this.pagination.update((p) => ({ ...p, posts: { ...p.posts, loading: false } }));
      },
    });
  }

  loadReports() {
    const pag = this.pagination();
    if (pag.reports.loading) return; // Simple loading check (assuming reports are 1 page for now)

    this.isLoading.set(true);
    this.adminService.getAllReports().subscribe({
      next: (res: any) => {
        // Handle varying API responses (Page vs List)
        const data =
          res.content && Array.isArray(res.content) ? res.content : Array.isArray(res) ? res : [];
        this.reports.set(data);
        this.isLoading.set(false);
      },
      error: () => this.isLoading.set(false),
    });
  }

  // === 6. ACTIONS (OPTIMISTIC UPDATES) ===

  banUser(id: string) {
    if (!confirm('Are you sure?')) return;

    this.adminService.banUser(id).subscribe({
      next: (msg) => {
        this.message.set(msg);
        // Optimistic update of local array
        this.users.update((list) =>
          list.map((u) => (u.id === id ? { ...u, banned: !u.banned } : u))
        );
      },
      error: (err) => console.error(err),
    });
  }

  deleteUser(id: string) {
    if (!confirm('Delete user?')) return;

    this.adminService.deleteUser(id).subscribe({
      next: (msg) => {
        this.message.set(msg);
        this.users.update((list) => list.filter((u) => u.id !== id));
      },
      error: (err) => console.error(err),
    });
  }

  resolveReport(id: string) {
    this.adminService.resolveReport(id).subscribe({
      next: (msg) => {
        this.message.set(msg);
        this.reports.update((list) =>
          list.map((r) => (r.id === id ? { ...r, resolved: true } : r))
        );
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
        this.message.set(msg);
        this.users.update((list) =>
          list.map((u) => (u.id === user.id ? { ...u, role: newRole } : u))
        );
      },
      error: () => this.message.set('Failed to update role'),
    });
  }
}
