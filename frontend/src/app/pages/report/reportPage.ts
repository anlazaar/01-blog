import { Component, inject, OnInit, signal, ChangeDetectionStrategy } from '@angular/core';
import { ReactiveFormsModule, FormBuilder, Validators, FormControl } from '@angular/forms';
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
    ReactiveFormsModule, // Switched to Reactive Forms
    RouterModule,
    MatFormFieldModule,
    MatSelectModule,
    MatInputModule,
    MatButtonModule,
  ],
  templateUrl: './reportPage.html',
  styleUrls: ['./reportPage.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ReportPage implements OnInit {
  // Services
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private postService = inject(PostService);
  private fb = inject(FormBuilder);

  // State Signals
  reportedId = signal<string | null>(null);
  isSubmitting = signal(false);

  // Form Definition
  reportForm = this.fb.group({
    reason: new FormControl('', [Validators.required]),
    description: new FormControl('', []), // Optional description
  });

  ngOnInit() {
    const id = this.route.snapshot.paramMap.get('id');
    this.reportedId.set(id);

    if (!id) {
      console.error('No ID provided to report');
      this.router.navigate(['/']);
    }
  }

  submitReport() {
    if (this.reportForm.invalid || !this.reportedId()) return;

    this.isSubmitting.set(true);

    const { reason, description } = this.reportForm.getRawValue();

    // Use standard non-null assertion or safe fallback if logic dictates
    if (!reason) return;

    // Combine reason and description if your backend expects a single string,
    // or adjust service method signature to accept both.
    // Assuming backend takes (reason, id) based on your original code,
    // but usually description is helpful.
    // Here I pass just 'reason' as per your original code,
    // or you might want to concat: `${reason}: ${description}`

    this.postService.reportUser(reason, this.reportedId()!).subscribe({
      next: (res) => {
        console.log('Report submitted', res);
        this.isSubmitting.set(false);
        this.router.navigate(['/']);
      },
      error: (err) => {
        console.error('Report error', err);
        this.isSubmitting.set(false);
      },
    });
  }
}
