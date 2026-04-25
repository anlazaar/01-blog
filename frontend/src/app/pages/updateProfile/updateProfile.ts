import { Component, inject, OnInit, signal, ChangeDetectionStrategy } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators, FormControl } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { UserService } from '../../services/UserService';
import { UserResponse } from '../../models/USER/UserResponse';
import { ToastService } from '../../services/toast.service';

// Angular Material Imports
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { switchMap } from 'rxjs';

@Component({
  selector: 'app-updateprofile',
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
  templateUrl: './updateProfile.html',
  styleUrl: './updateProfile.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class UpdateProfile implements OnInit {
  // Services
  private userService = inject(UserService);
  private toastService = inject(ToastService);
  private fb = inject(FormBuilder);
  private router = inject(Router);
  private route = inject(ActivatedRoute);

  // State Signals
  user = signal<UserResponse | null>(null);
  avatarPreview = signal<string | ArrayBuffer | null>(null);
  fileError = signal<string | null>(null);
  isSubmitting = signal(false);

  // Internal
  private userId = '';
  private selectedFile: File | null = null;

  // Name Regex: Allows letters (including accents), spaces, hyphens, and apostrophes.
  private namePattern = /^[a-zA-ZÀ-ÿ\s\-']+$/;

  // Typed Form
  publicInfoForm = this.fb.group({
    bio: new FormControl('', [Validators.maxLength(500)]),
    firstname: new FormControl('', [
      Validators.required,
      Validators.minLength(2),
      Validators.maxLength(50),
      Validators.pattern(this.namePattern),
    ]),
    lastname: new FormControl('', [
      Validators.required,
      Validators.minLength(2),
      Validators.maxLength(50),
      Validators.pattern(this.namePattern),
    ]),
    username: new FormControl('', [
      Validators.required,
      Validators.minLength(3),
      Validators.maxLength(20),
      Validators.pattern(/^[a-zA-Z0-9._-]+$/),
    ]),
    email: new FormControl('', [Validators.required, Validators.email]),
    // Password fields are optional
    oldpassword: new FormControl(''),
    password: new FormControl('', [Validators.minLength(6)]),
  });

  ngOnInit(): void {
    // Handle route params reactively
    this.route.paramMap
      .pipe(
        switchMap((params) => {
          this.userId = params.get('id') || '';
          if (!this.userId) throw new Error('User ID missing');
          return this.userService.getUserFullData(this.userId);
        })
      )
      .subscribe({
        next: (data) => {
          this.user.set(data);

          // Initial Avatar
          if (data.avatarUrl) {
            this.avatarPreview.set('http://localhost:8080' + data.avatarUrl);
          }

          // Pre-fill form
          this.publicInfoForm.patchValue({
            firstname: data.firstname,
            lastname: data.lastname,
            username: data.username,
            email: data.email,
            bio: data.bio || '',
          });
        },
        error: (err) => {
          console.error(err);
          this.toastService.show('Failed to load profile data', 'error');
          this.router.navigate(['/home']);
        },
      });
  }

  onFileSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    if (!input.files || input.files.length === 0) return;

    const file = input.files[0];

    // Validation
    if (!file.type.startsWith('image/')) {
      this.fileError.set('Only images are allowed.');
      return;
    }
    if (file.size > 20 * 1024 * 1024) {
      this.fileError.set('File is too large. Max 20MB.');
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

    // Mark form as dirty so Save button enables
    this.publicInfoForm.markAsDirty();
  }

  onSubmit() {
    if (this.publicInfoForm.invalid) return;

    this.isSubmitting.set(true);

    const formData = new FormData();
    const formVal = this.publicInfoForm.getRawValue();

    // Helper to append valid values
    const appendIf = (key: string, val: string | null | undefined) => {
      if (val !== null && val !== undefined && val !== '') formData.append(key, val);
    };

    appendIf('bio', formVal.bio);
    appendIf('firstname', formVal.firstname);
    appendIf('lastname', formVal.lastname);
    appendIf('username', formVal.username);
    appendIf('email', formVal.email);
    appendIf('oldpassword', formVal.oldpassword);
    appendIf('password', formVal.password);

    if (this.selectedFile) {
      formData.append('avatar', this.selectedFile, this.selectedFile.name);
    }

    this.userService.patchUser(formData, this.userId).subscribe({
      next: () => {
        this.isSubmitting.set(false);
        this.toastService.show('Profile updated successfully!', 'success');
        this.router.navigate(['/home']);
      },
      error: (err) => {
        this.isSubmitting.set(false);
        const msg = err.error?.error || 'Update failed. Please try again.';
        this.toastService.show(msg, 'error');
        console.error('Update Error:', err);
      },
    });
  }
}
