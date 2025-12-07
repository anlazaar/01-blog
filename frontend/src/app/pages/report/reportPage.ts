import { Component, inject } from '@angular/core';

import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { PostService } from '../../services/post.service';

@Component({
  selector: 'app-report-page',
  standalone: true,
  imports: [FormsModule],
  providers: [PostService],
  templateUrl: './reportPage.html',
  styleUrls: ['./reportPage.css'],
})
export class ReportPage {
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

    // TODO: call the API here laktab
    this.postService.reportUser(this.reason, this.reportedId).subscribe({
      next: (res) => {
        console.log(res);
      },
      error: (err) => {
        console.log(err);
      },
    });

    this.router.navigate(['/']); // or go back to post page
  }
}
