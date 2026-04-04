import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { AuthService, User } from '../../services/auth.service';

@Component({
  selector: 'app-profile',
  templateUrl: './profile.component.html',
  styleUrls: ['./profile.component.scss']
})
export class ProfileComponent implements OnInit {
  profileForm: FormGroup;
  currentUser: User | null = null;
  isLoading = false;
  isEditing = false;
  errorMessage = '';
  successMessage = '';

  constructor(
    private fb: FormBuilder,
    private authService: AuthService
  ) {
    this.profileForm = this.fb.group({
      firstName: ['', Validators.required],
      lastName: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      username: [{value: '', disabled: true}]
    });
  }

  ngOnInit(): void {
    this.currentUser = this.authService.currentUserValue;
    if (this.currentUser) {
      this.profileForm.patchValue({
        firstName: this.currentUser.firstName,
        lastName: this.currentUser.lastName,
        email: this.currentUser.email,
        username: this.currentUser.username
      });
    }
  }

  toggleEdit(): void {
    this.isEditing = !this.isEditing;
    if (!this.isEditing) {
      // Reset form to current user values when canceling edit
      this.profileForm.patchValue({
        firstName: this.currentUser.firstName,
        lastName: this.currentUser.lastName,
        email: this.currentUser.email
      });
    }
  }

  onSubmit(): void {
    if (this.profileForm.invalid) {
      return;
    }

    this.isLoading = true;
    this.errorMessage = '';
    this.successMessage = '';

    const updatedProfile = {
      ...this.profileForm.value,
      username: this.currentUser.username
    };

    // For demonstration purposes, we'll simulate a successful profile update
    // In a real application, you would call an API endpoint
    setTimeout(() => {
      if (this.currentUser) {
        this.currentUser.firstName = updatedProfile.firstName;
        this.currentUser.lastName = updatedProfile.lastName;
        this.currentUser.email = updatedProfile.email;
        
        // Update the user in localStorage
        localStorage.setItem('currentUser', JSON.stringify(this.currentUser));
        
        this.isLoading = false;
        this.successMessage = 'Profile updated successfully!';
        this.isEditing = false;
      }
    }, 1500);

    // Uncomment and adapt this code when you have a real API endpoint
    /*
    this.authService.updateProfile(updatedProfile).subscribe({
      next: (response) => {
        this.currentUser = response;
        this.isLoading = false;
        this.successMessage = 'Profile updated successfully!';
        this.isEditing = false;
      },
      error: (error) => {
        this.isLoading = false;
        this.errorMessage = error.error?.message || 'Failed to update profile. Please try again.';
      }
    });
    */
  }

  getUserInitials(): string {
    if (!this.currentUser) return 'U';
    
    const firstName = this.currentUser.firstName || '';
    const lastName = this.currentUser.lastName || '';
    
    if (firstName && lastName) {
      return `${firstName.charAt(0)}${lastName.charAt(0)}`;
    } else if (firstName) {
      return firstName.charAt(0);
    } else if (this.currentUser.username) {
      return this.currentUser.username.charAt(0).toUpperCase();
    }
    
    return 'U';
  }
}
