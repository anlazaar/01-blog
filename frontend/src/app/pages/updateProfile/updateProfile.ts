import { Component, inject, OnInit, signal, ChangeDetectionStrategy } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators, FormControl } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common'; // UpperCasePipe
import { UserService } from '../../services/UserService';
import { UserResponse } from '../../models/USER/UserResponse';

// Angular Material Imports
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';

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
  private fb = inject(FormBuilder);
  private router = inject(Router);
  private route = inject(ActivatedRoute);

  // State Signals
  user = signal<UserResponse | null>(null);
  avatarPreview = signal<string | ArrayBuffer | null>(null);
  fileError = signal<string | null>(null);
  errorMessage = signal<string | null>(null);
  isSubmitting = signal(false);

  // Constants
  userId = '';
  private selectedFile: File | null = null;

  // Typed Form
  publicInfoForm = this.fb.group({
    bio: new FormControl('', [Validators.maxLength(160)]),
    firstname: new FormControl('', [Validators.required]),
    lastname: new FormControl('', [Validators.required]),
    username: new FormControl('', [Validators.required]),
    email: new FormControl('', [Validators.required, Validators.email]),
    // Password fields are optional
    oldpassword: new FormControl(''),
    password: new FormControl('', [Validators.minLength(6)]),
  });

  ngOnInit(): void {
    // We can stick to snapshot here if the component is re-created on route change,
    // or use paramMap.subscribe if we expect ID changes while staying on the same component instance.
    // For a settings page, snapshot is usually fine.
    this.userId = this.route.snapshot.paramMap.get('id') || '';

    if (!this.userId) {
      this.errorMessage.set('User ID is missing from URL.');
      return;
    }

    this.userService.getUserFullData(this.userId).subscribe({
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
        this.errorMessage.set('Failed to load user profile.');
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
      // 20MB
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
    this.errorMessage.set(null);

    const formData = new FormData();
    const formVal = this.publicInfoForm.getRawValue();

    // Append non-null values
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
      next: (res) => {
        console.log('Update success', res);
        this.isSubmitting.set(false);
        this.router.navigate(['/']); // Or stay and show success toast
      },
      error: (err) => {
        this.isSubmitting.set(false);
        const msg = err.error?.error || 'An error occurred while updating the profile.';
        this.errorMessage.set(msg);
        console.error('Update Error:', err);
      },
    });
  }
}
