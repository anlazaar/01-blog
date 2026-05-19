import {
  Component,
  OnInit,
  AfterViewInit,
  inject,
  ViewChildren,
  QueryList,
  signal,
  effect,
  DestroyRef,
  ChangeDetectionStrategy,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { AdminService, DashboardStats } from '../../../services/admin.service';
import { ChartConfiguration, ChartOptions } from 'chart.js';
import { BaseChartDirective } from 'ng2-charts';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

@Component({
  selector: 'app-admin-overview',
  standalone: true,
  imports: [CommonModule, BaseChartDirective, MatProgressSpinnerModule],
  templateUrl: './overview.html',
  styleUrls: ['../admin.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AdminOverviewComponent implements OnInit, AfterViewInit {
  private adminService = inject(AdminService);
  private destroyRef = inject(DestroyRef);

  @ViewChildren(BaseChartDirective) charts!: QueryList<BaseChartDirective>;

  stats = signal<DashboardStats | null>(null);
  isLoading = signal(false);

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
    this.themeObserver = new MutationObserver(() => this.updateChartTheme());
    this.themeObserver.observe(document.body, { attributes: true, attributeFilter: ['class'] });
    setTimeout(() => this.updateChartTheme(), 100);
    this.destroyRef.onDestroy(() => {
      this.themeObserver?.disconnect();
    });
  }

  loadStats() {
    this.isLoading.set(true);
    this.adminService.getDashboardStats().subscribe({
      next: (res: any) => {
        this.stats.set(res);
        this.isLoading.set(false);
      },
      error: (err: any) => {
        console.error('Stats Error', err);
        this.isLoading.set(false);
      },
    });
  }

  setupCharts(stats: DashboardStats) {
    const userLabels = stats.userGrowth.map((d: any) => d.label);
    const userValues = stats.userGrowth.map((d: any) => d.value);

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

    const postLabels = stats.postGrowth.map((d: any) => d.label);
    const postValues = stats.postGrowth.map((d: any) => d.value);

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

    this.charts?.forEach((c) => c.chart?.update());
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

    this.charts.forEach((chart) => chart.chart?.update());
  }
}
