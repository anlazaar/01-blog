import { Component, inject, OnInit, signal, ChangeDetectionStrategy } from '@angular/core';
import { ReactiveFormsModule, FormBuilder, Validators, FormControl } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { PostService } from '../../services/post.service';
import { ToastService } from '../../services/toast.service'; // Added Toast

// Angular Material Imports
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';

@Component({
  selector: 'app-report-page',
  standalone: true,
  imports: [
    ReactiveFormsModule,
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
  private toastService = inject(ToastService);
  private fb = inject(FormBuilder);

  // State Signals
  reportedId = signal<string | null>(null);
  isSubmitting = signal(false);

  // Form Definition
  reportForm = this.fb.group({
    reason: new FormControl('', [Validators.required]),
    description: new FormControl(''),
  });

  ngOnInit() {
    const id = this.route.snapshot.paramMap.get('id');
    this.reportedId.set(id);

    if (!id) {
      this.toastService.show('Invalid request: ID missing', 'error');
      this.router.navigate(['/']);
    }
  }

  submitReport() {
    if (this.reportForm.invalid || !this.reportedId()) return;

    this.isSubmitting.set(true);

    const { reason, description } = this.reportForm.getRawValue();
    const safeReason = reason || 'Other';

    // Concatenate details if provided, assuming backend only accepts one string 'reason'
    // If backend accepts a separate 'description' field, update the service method.
    const fullReason = description ? `${safeReason} - Details: ${description}` : safeReason;

    this.postService.reportUser(fullReason, this.reportedId()!).subscribe({
      next: () => {
        this.isSubmitting.set(false);
        this.toastService.show('Report submitted successfully.', 'success');
        this.router.navigate(['/']);
      },
      error: (err) => {
        console.error('Report error', err);
        this.isSubmitting.set(false);
        this.toastService.show('Failed to submit report. Please try again.', 'error');
      },
    });
  }
}
