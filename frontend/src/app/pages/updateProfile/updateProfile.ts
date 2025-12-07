import { Component, inject } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { UserService } from '../../services/UserService';
import { UserResponse } from '../../models/USER/UserResponse';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-updateprofile',
  standalone: true,
  imports: [ReactiveFormsModule, RouterModule, FontAwesomeModule, CommonModule],
  providers: [UserService],
  templateUrl: './updateProfile.html',
  styleUrl: './updateProfile.css',
})
export class UpdateProfile {
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

  ngOnInit(): void {
    this.userId = this.route.snapshot.paramMap.get('id') || '';
    if (!this.userId) {
      console.log('User Id needed');
      return;
    }

    this.userService.getUserFullData(this.userId).subscribe({
      next: (data) => {
        this.user = data;
        console.log('USER', this.user);
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
      // 20 MB limit
      this.fileError = 'File is too large. Max 5MB.';
      return;
    }

    this.fileError = null;
    this.selectedFile = file;

    // Preview image
    const reader = new FileReader();
    reader.onload = () => {
      this.avatarPreview = reader.result;
    };
    reader.readAsDataURL(file);
  }

  publicInfoForm = this.fb.group({
    bio: ['', []],
    firstname: ['', []],
    lastname: ['', []],
    oldpassword: ['', []],
    password: ['', []],
    username: ['', []],
    email: ['', []],
  });

  onSubmit() {
    if (this.publicInfoForm.invalid) return;

    const formData = new FormData();
    formData.append('bio', this.publicInfoForm.get('bio')?.value || '');
    formData.append('firstname', this.publicInfoForm.get('firstname')?.value || '');
    formData.append('lastname', this.publicInfoForm.get('lastname')?.value || '');
    formData.append('oldpassword', this.publicInfoForm.get('oldpassword')?.value || '');
    formData.append('password', this.publicInfoForm.get('password')?.value || '');
    formData.append('username', this.publicInfoForm.get('username')?.value || '');
    formData.append('email', this.publicInfoForm.get('email')?.value || '');

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
