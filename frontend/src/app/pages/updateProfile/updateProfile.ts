import { Component, inject, OnInit } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
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
    // Material Modules
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
  ],
  providers: [UserService],
  templateUrl: './updateProfile.html',
  styleUrl: './updateProfile.css',
})
export class UpdateProfile implements OnInit {
  private userService = inject(UserService);
  private fb = inject(FormBuilder);
  private router = inject(Router);
  private route = inject(ActivatedRoute);

  public user: UserResponse | null = null;
  public selectedFile: File | null = null;
  public avatarPreview: string | ArrayBuffer | null = null;
  public fileError: string | null = null;
  public userId: string = '';
  public errorMessage: string | null = null;

  publicInfoForm = this.fb.group({
    bio: ['', []],
    firstname: ['', []],
    lastname: ['', []],
    oldpassword: ['', []],
    password: ['', []],
    username: ['', []],
    email: ['', []],
  });

  ngOnInit(): void {
    this.userId = this.route.snapshot.paramMap.get('id') || '';
    if (!this.userId) {
      console.log('User Id needed');
      return;
    }

    this.userService.getUserFullData(this.userId).subscribe({
      next: (data) => {
        this.user = data;
        // Pre-fill form
        this.publicInfoForm.patchValue({
          firstname: data.firstname,
          lastname: data.lastname,
          username: data.username,
          email: data.email,
          bio: data.bio,
        });
      },
      error: (err) => console.log(err),
    });
  }

  onFileSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    if (!input.files || input.files.length === 0) return;

    const file = input.files[0];

    if (!file.type.startsWith('image/')) {
      this.fileError = 'Only images are allowed.';
      return;
    }
    if (file.size > 20 * 1024 * 1024) {
      this.fileError = 'File is too large. Max 20MB.';
      return;
    }

    this.fileError = null;
    this.selectedFile = file;

    const reader = new FileReader();
    reader.onload = () => {
      this.avatarPreview = reader.result;
    };
    reader.readAsDataURL(file);
  }

  onSubmit() {
    if (this.publicInfoForm.invalid) return;

    const formData = new FormData();
    // Helper to append only if value exists
    const appendIf = (key: string, val: any) => {
      if (val) formData.append(key, val);
    };

    appendIf('bio', this.publicInfoForm.get('bio')?.value);
    appendIf('firstname', this.publicInfoForm.get('firstname')?.value);
    appendIf('lastname', this.publicInfoForm.get('lastname')?.value);
    appendIf('oldpassword', this.publicInfoForm.get('oldpassword')?.value);
    appendIf('password', this.publicInfoForm.get('password')?.value);
    appendIf('username', this.publicInfoForm.get('username')?.value);
    appendIf('email', this.publicInfoForm.get('email')?.value);

    if (this.selectedFile) {
      formData.append('avatar', this.selectedFile, this.selectedFile.name);
    }

    this.userService.patchUser(formData, this.userId).subscribe({
      next: (res) => {
        console.log('Response from server: ', res);
        this.router.navigate(['/']);
      },
      error: (err) => {
        this.errorMessage = err.error.error || 'An error occurred while updating the profile.';
        console.error('ERROR MESSAGE ', err);
      },
    });
  }
}
