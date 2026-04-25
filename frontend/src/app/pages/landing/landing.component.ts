import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './landing.component.html',
  styleUrls: ['./landing.component.css'],
})
export class Landing {
  topics = [
    'Technology',
    'Self Improvement',
    'Writing',
    'Relationships',
    'Machine Learning',
    'Productivity',
    'Politics',
    'Cryptocurrency',
    'Design',
    'Startups',
    'Health',
    'Mental Health',
  ];

  // Placeholder avatars for social proof (using Unsplash faces)
  avatars = [
    'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=64&h=64&q=80',
    'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=64&h=64&q=80',
    'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=64&h=64&q=80',
    'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=64&h=64&q=80',
  ];

  private router = inject(Router);

  getStarted() {
    this.router.navigate(['/auth/register']);
  }

  startReading() {
    this.router.navigate(['/auth/login']);
  }
}
