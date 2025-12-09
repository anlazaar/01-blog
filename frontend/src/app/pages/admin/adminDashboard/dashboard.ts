import {
  Component,
  OnInit,
  OnDestroy,
  inject,
  ViewChildren,
  QueryList,
  AfterViewInit,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import {
  faUsers,
  faNewspaper,
  faFlag,
  faBan,
  faTrash,
  faCheck,
  faExternalLinkAlt,
  faChartLine,
} from '@fortawesome/free-solid-svg-icons';
import { RouterLink } from '@angular/router';
import { AdminService, DashboardStats } from '../../../services/admin.service';
import { ChartConfiguration, ChartOptions, Chart } from 'chart.js';
import { BaseChartDirective } from 'ng2-charts';

@Component({
  selector: 'app-admin-dashboard',
  standalone: true,
  imports: [CommonModule, FontAwesomeModule, RouterLink, BaseChartDirective],
  templateUrl: './dashboard.html',
  styleUrls: ['./dashboard.css'],
})
export class AdminDashboardComponent implements OnInit, AfterViewInit, OnDestroy {
  private adminService = inject(AdminService);

  // Access the charts to force updates
  @ViewChildren(BaseChartDirective) charts!: QueryList<BaseChartDirective>;

  // Icons
  faUsers = faUsers;
  faNewspaper = faNewspaper;
  faFlag = faFlag;
  faBan = faBan;
  faTrash = faTrash;
  faCheck = faCheck;
  faLink = faExternalLinkAlt;
  faChartLine = faChartLine;

  // State
  activeTab: 'overview' | 'users' | 'posts' | 'reports' = 'overview';
  users: any[] = [];
  posts: any[] = [];
  reports: any[] = [];
  stats: DashboardStats | null = null;
  isLoading = false;
  message = '';

  private themeObserver: MutationObserver | null = null;

  // --- CHART CONFIGURATION ---
  public lineChartData: ChartConfiguration<'line'>['data'] = {
    labels: [],
    datasets: [],
  };

  public lineChartOptions: ChartOptions<'line'> = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: '#242424',
        titleColor: '#ffffff',
        bodyColor: '#ffffff',
        padding: 10,
        cornerRadius: 4,
        displayColors: false,
      },
    },
    scales: {
      x: {
        grid: { display: false },
        ticks: { color: '#6b6b6b' }, // Default grey
      },
      y: {
        grid: { color: '#e5e5e5' }, // Default light border
        ticks: { color: '#6b6b6b' },
      },
    },
  };

  public postChartData: ChartConfiguration<'bar'>['data'] = {
    labels: [],
    datasets: [],
  };

  public barChartOptions: ChartOptions<'bar'> = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
    },
    scales: {
      x: {
        grid: { display: false },
        ticks: { color: '#6b6b6b' },
      },
      y: {
        grid: { color: '#e5e5e5' },
        ticks: { color: '#6b6b6b' },
      },
    },
  };

  ngOnInit() {
    this.loadStats();
  }

  ngAfterViewInit() {
    // Watch for class changes on <body> to detect Dark Mode toggle
    this.themeObserver = new MutationObserver(() => {
      this.updateChartTheme();
    });

    this.themeObserver.observe(document.body, {
      attributes: true,
      attributeFilter: ['class'],
    });

    // Initial apply
    this.updateChartTheme();
  }

  ngOnDestroy() {
    if (this.themeObserver) {
      this.themeObserver.disconnect();
    }
  }

  /**
   * Reads CSS variables and applies them to ChartJS options
   */
  updateChartTheme() {
    if (!this.charts) return;

    // 1. Get computed styles from CSS variables
    const styles = getComputedStyle(document.body);
    const textPrimary = styles.getPropertyValue('--text-primary').trim();
    const textSecondary = styles.getPropertyValue('--text-secondary').trim();
    const borderColor = styles.getPropertyValue('--border').trim();
    const cardBg = styles.getPropertyValue('--card').trim();

    // 2. Define Shared Styles
    const scaleOptions = {
      x: {
        grid: { display: false, color: borderColor },
        ticks: { color: textSecondary },
      },
      y: {
        grid: { color: borderColor },
        ticks: { color: textSecondary },
      },
    };

    const pluginOptions = {
      legend: { display: false },
      tooltip: {
        backgroundColor: textPrimary, // Invert bg for contrast
        titleColor: cardBg,
        bodyColor: cardBg,
      },
    };

    // 3. Update Options Objects
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

    // 4. Force Update on all Chart Instances
    this.charts.forEach((chart) => {
      if (chart.chart) {
        chart.chart.options.scales!['x']!.ticks!.color = textSecondary;
        chart.chart.options.scales!['y']!.ticks!.color = textSecondary;
        chart.chart.options.scales!['y']!.grid!.color = borderColor;

        // Update Tooltips if needed
        if (chart.chart.options.plugins?.tooltip) {
          chart.chart.options.plugins.tooltip.backgroundColor = textPrimary;
          chart.chart.options.plugins.tooltip.titleColor = cardBg;
          chart.chart.options.plugins.tooltip.bodyColor = cardBg;
        }

        chart.chart.update();
      }
    });
  }

  switchTab(tab: 'overview' | 'users' | 'posts' | 'reports') {
    this.activeTab = tab;
    this.message = '';
    if (tab === 'overview') {
      this.loadStats();
      // Small timeout to allow ViewChild to init before theming
      setTimeout(() => this.updateChartTheme(), 100);
    }
    if (tab === 'users') this.loadUsers();
    if (tab === 'posts') this.loadPosts();
    if (tab === 'reports') this.loadReports();
  }

  // === LOAD DATA ===
  loadStats() {
    this.isLoading = true;
    this.adminService.getDashboardStats().subscribe({
      next: (res) => {
        this.stats = res;
        this.setupCharts(res);
        this.isLoading = false;
        // Apply theme after data load
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

    // Get brand color or use hardcoded green
    const styles = getComputedStyle(document.body);
    // Note: OKLCH colors might crash ChartJS older versions,
    // better to keep hex for data colors or convert them.
    // For now we use the hex brand color you used: #1a8917

    this.lineChartData = {
      labels: userLabels,
      datasets: [
        {
          data: userValues,
          label: 'Users',
          fill: true,
          tension: 0.4,
          borderColor: '#1a8917', // Medium Green
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
          // In Dark mode, bars should be lighter. In light mode, dark.
          // We will handle this dynamically in updateChartTheme if we wanted,
          // but a solid color usually works for both.
          backgroundColor: '#3b82f6',
          borderRadius: 4,
        },
      ],
    };
  }

  // ... [Keep loadUsers, loadPosts, loadReports, banUser, etc.] ...
  loadUsers() {
    this.isLoading = true;
    this.adminService.getAllUsers().subscribe({
      next: (res) => {
        this.users = res;
        this.isLoading = false;
      },
      error: (err) => {
        this.isLoading = false;
      },
    });
  }

  loadPosts() {
    this.isLoading = true;
    // Use 'any' or 'Page<PostResponse>' type to access properties safely
    this.adminService.getAllPosts().subscribe({
      next: (res: any) => {
        if (res.content && Array.isArray(res.content)) {
          this.posts = res.content;
        } else if (Array.isArray(res)) {
          this.posts = res;
        } else {
          this.posts = []; // Fallback
        }

        this.isLoading = false;
      },
      error: (err) => {
        this.isLoading = false;
        console.error(err);
      },
    });
  }

  loadReports() {
    this.isLoading = true;
    this.adminService.getAllReports().subscribe({
      next: (res: any) => {
        if (res.content && Array.isArray(res.content)) {
          this.reports = res.content;
        } else if (Array.isArray(res)) {
          this.reports = res;
        } else {
          this.reports = [];
        }
        this.isLoading = false;
      },
      error: (err) => {
        this.isLoading = false;
      },
    });
  }

  banUser(id: string) {
    if (!confirm('Are you sure?')) return;
    this.adminService.banUser(id).subscribe({
      next: (msg) => {
        this.message = msg;
        this.loadUsers();
      },
      error: (err) => console.error(err),
    });
  }

  deleteUser(id: string) {
    if (!confirm('Delete user?')) return;
    this.adminService.deleteUser(id).subscribe({
      next: (msg) => {
        this.message = msg;
        this.loadUsers();
      },
      error: (err) => console.error(err),
    });
  }

  resolveReport(id: string) {
    this.adminService.resolveReport(id).subscribe({
      next: (msg) => {
        this.message = msg;
        this.loadReports();
      },
      error: (err) => console.error(err),
    });
  }
}
