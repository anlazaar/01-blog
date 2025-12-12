import { Component, inject, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { PostService } from '../../services/post.service';

// Angular Material Imports
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';

@Component({
  selector: 'app-report-page',
  standalone: true,
  imports: [
    FormsModule,
    RouterModule,
    MatFormFieldModule,
    MatSelectModule,
    MatInputModule,
    MatButtonModule,
  ],
  providers: [PostService],
  templateUrl: './reportPage.html',
  styleUrls: ['./reportPage.css'],
})
export class ReportPage implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private postService = inject(PostService);

  reportedId: string | null = null;
  reason: string = '';
  description: string = '';

  ngOnInit() {
    this.reportedId = this.route.snapshot.paramMap.get('id');
  }

  submitReport() {
    if (!this.reason) return;
    if (!this.reportedId) return;

    this.postService.reportUser(this.reason, this.reportedId).subscribe({
      next: (res) => {
        console.log(res);
        // Show success toast here if available
        this.router.navigate(['/']);
      },
      error: (err) => {
        console.log(err);
      },
    });
  }
}
