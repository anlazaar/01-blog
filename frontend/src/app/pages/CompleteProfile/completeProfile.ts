import { Component, inject, signal, ChangeDetectionStrategy } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators, FormControl } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { UserService } from '../../services/UserService';
import { ToastService } from '../../services/toast.service'; // Added Toast for better UX

// Angular Material Imports
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-complete-profile',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    RouterModule,
    CommonModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
  ],
  templateUrl: './completeProfile.html',
  styleUrl: './completeProfile.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CompleteProfile {
  // Dependencies
  private userService = inject(UserService);
  private toastService = inject(ToastService);
  private fb = inject(FormBuilder);
  private router = inject(Router);
  private route = inject(ActivatedRoute);

  // State Signals
  avatarPreview = signal<string | ArrayBuffer | null>(null);
  fileError = signal<string | null>(null);
  isSubmitting = signal(false);

  // Internal
  private selectedFile: File | null = null;

  // Typed Form
  publicInfoForm = this.fb.group({
    firstname: new FormControl('', [Validators.minLength(2)]),
    lastname: new FormControl('', [Validators.minLength(2)]),
    bio: new FormControl('', [Validators.minLength(10)]),
  });

  onFileSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    if (!input.files || input.files.length === 0) return;

    const file = input.files[0];

    // Validation
    if (!file.type.startsWith('image/')) {
      this.fileError.set('Only images are allowed.');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      // 5MB Limit
      this.fileError.set('File is too large. Max 5MB.');
      return;
    }

    this.fileError.set(null);
    this.selectedFile = file;

    // Preview
    const reader = new FileReader();
    reader.onload = () => {
      this.avatarPreview.set(reader.result);
    };
    reader.readAsDataURL(file);
  }

  onSubmit() {
    if (this.publicInfoForm.invalid) return;

    const userId = this.route.snapshot.paramMap.get('id');
    if (!userId) {
      this.toastService.show('User ID missing', 'error');
      return;
    }

    this.isSubmitting.set(true);

    const formData = new FormData();
    const { firstname, lastname, bio } = this.publicInfoForm.getRawValue();

    // Append fields only if they have values
    if (firstname) formData.append('firstname', firstname);
    if (lastname) formData.append('lastname', lastname);
    if (bio) formData.append('bio', bio);

    if (this.selectedFile) {
      formData.append('avatar', this.selectedFile, this.selectedFile.name);
    }

    this.userService.patchUser(formData, userId).subscribe({
      next: () => {
        this.isSubmitting.set(false);
        this.toastService.show('Profile updated!', 'success');
        this.router.navigate(['/']);
      },
      error: (err) => {
        console.error(err);
        this.isSubmitting.set(false);
        this.toastService.show('Failed to update profile.', 'error');
      },
    });
  }

  skip() {
    this.router.navigate(['/']);
  }
}
