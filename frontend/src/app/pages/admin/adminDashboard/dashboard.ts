import { Component, OnInit, inject } from '@angular/core';
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
} from '@fortawesome/free-solid-svg-icons';
import { RouterLink } from '@angular/router';
import { AdminService } from '../../../services/admin.service';

@Component({
  selector: 'app-admin-dashboard',
  standalone: true,
  imports: [CommonModule, FontAwesomeModule, RouterLink],
  templateUrl: './dashboard.html',
  styleUrls: ['./dashboard.css'],
})
export class AdminDashboardComponent implements OnInit {
  private adminService = inject(AdminService);

  // Icons
  faUsers = faUsers;
  faNewspaper = faNewspaper;
  faFlag = faFlag;
  faBan = faBan;
  faTrash = faTrash;
  faCheck = faCheck;
  faLink = faExternalLinkAlt;

  // State
  activeTab: 'users' | 'posts' | 'reports' = 'users';
  users: any[] = [];
  posts: any[] = [];
  reports: any[] = [];
  isLoading = false;
  message = '';

  ngOnInit() {
    this.loadUsers();
  }

  switchTab(tab: 'users' | 'posts' | 'reports') {
    this.activeTab = tab;
    this.message = '';
    if (tab === 'users') this.loadUsers();
    if (tab === 'posts') this.loadPosts();
    if (tab === 'reports') this.loadReports();
  }

  // === LOADERS ===
  loadUsers() {
    this.isLoading = true;
    this.adminService.getAllUsers().subscribe({
      next: (res) => {
        this.users = res;
        this.isLoading = false;
      },
      error: (err) => {
        console.error(err);
        this.isLoading = false;
      },
    });
  }

  loadPosts() {
    this.isLoading = true;
    this.adminService.getAllPosts().subscribe({
      next: (res) => {
        this.posts = res;
        this.isLoading = false;
      },
      error: (err) => {
        console.error(err);
        this.isLoading = false;
      },
    });
  }

  loadReports() {
    this.isLoading = true;
    this.adminService.getAllReports().subscribe({
      next: (res) => {
        this.reports = res;
        this.isLoading = false;
      },
      error: (err) => {
        console.error(err);
        this.isLoading = false;
      },
    });
  }

  // === ACTIONS ===
  banUser(id: string) {
    if (!confirm('Are you sure you want to ban this user?')) return;
    this.adminService.banUser(id).subscribe({
      next: (msg) => {
        this.message = msg;
        this.loadUsers(); // Refresh
      },
      error: (err) => console.error(err),
    });
  }

  deleteUser(id: string) {
    if (!confirm('Are you sure you want to DELETE this user? This cannot be undone.')) return;
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
