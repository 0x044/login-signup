import { Component, OnInit } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule, FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';

// ============================================================================
// INTERFACES
// ============================================================================

interface ResetPasswordRequest {
  username: string;
  oldPassword: string;
  newPassword: string;
}

interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
}

// ============================================================================
// COMPONENT
// ============================================================================

@Component({
  selector: 'app-reset-password',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatFormFieldModule,
    MatInputModule
  ],
  templateUrl: './reset-password.component.html',
  styleUrls: ['./reset-password.component.css']
})
export class ResetPasswordComponent implements OnInit {
  
  // ==========================================================================
  // PROPERTIES
  // ==========================================================================
  
  private readonly API_BASE_URL = 'http://localhost:8080/v1/api';
  
  // UI state
  isLoading = false;
  showPassword = false;
  showConfirmPassword = false;
  
  // Messages
  errorMessage = '';
  successMessage = '';
  
  // Forms
  resetForm!: FormGroup;
  
  // ==========================================================================
  // CONSTRUCTOR
  // ==========================================================================
  
  constructor(
    private http: HttpClient,
    private router: Router,
    private fb: FormBuilder
  ) {}
  
  // ==========================================================================
  // LIFECYCLE HOOKS
  // ==========================================================================
  
  ngOnInit(): void {
    this.initializeForm();
  }
  
  // ==========================================================================
  // FORM INITIALIZATION
  // ==========================================================================
  
  private initializeForm(): void {
    this.resetForm = this.fb.group({
      username: ['', [Validators.required, Validators.minLength(3), Validators.maxLength(20)]],
      oldPassword: ['', [Validators.required, Validators.minLength(8), Validators.maxLength(20)]],
      newPassword: ['', [
        Validators.required,
        Validators.minLength(8),
        Validators.maxLength(20),
        this.passwordPatternValidator
      ]],
      confirmPassword: ['', [Validators.required]]
    }, { validators: this.passwordMatchValidator });
  }
  
  private passwordPatternValidator(control: any) {
    const value = control.value;
    if (!value) return null;

    const hasUpperCase = /[A-Z]/.test(value);
    const hasLowerCase = /[a-z]/.test(value);
    const hasNumeric = /[0-9]/.test(value);
    const hasSpecialChar = /[@#$%^&+=]/.test(value);

    const passwordValid = hasUpperCase && hasLowerCase && hasNumeric && hasSpecialChar;

    return !passwordValid ? { 
      passwordPattern: {
        hasUpperCase,
        hasLowerCase,
        hasNumeric,
        hasSpecialChar
      } 
    } : null;
  }
  
  private passwordMatchValidator(form: any) {
    const newPassword = form.get('newPassword')?.value;
    const confirmPassword = form.get('confirmPassword')?.value;

    if (newPassword && confirmPassword && newPassword !== confirmPassword) {
      form.get('confirmPassword')?.setErrors({ passwordMismatch: true });
      return { passwordMismatch: true };
    }

    const confirmPasswordControl = form.get('confirmPassword');
    if (confirmPasswordControl?.hasError('passwordMismatch')) {
      delete confirmPasswordControl.errors?.['passwordMismatch'];
      confirmPasswordControl.updateValueAndValidity({ onlySelf: true, emitEvent: false });
    }

    return null;
  }
  
  // ==========================================================================
  // API CALLS
  // ==========================================================================
  
  submitResetPassword(): void {
    if (this.resetForm.invalid) {
      this.markFormGroupTouched(this.resetForm);
      return;
    }
    
    this.isLoading = true;
    this.errorMessage = '';
    
    const resetRequest: ResetPasswordRequest = {
      username: this.resetForm.value.username,
      oldPassword: this.resetForm.value.oldPassword,
      newPassword: this.resetForm.value.newPassword
    };
    
    const url = `${this.API_BASE_URL}/user/resetPassword`;
    
    this.http.put<ApiResponse<string>>(url, resetRequest).subscribe({
      next: (response) => {
        if (response.success) {
          this.showSuccess('Password reset successfully! You can now login with your new password.');
          this.resetForm.reset();
          // Redirect to login after a delay
          setTimeout(() => {
            this.router.navigate(['/home']);
          }, 3000);
        } else {
          this.showError('Failed to reset password');
        }
        this.isLoading = false;
      },
      error: (error: HttpErrorResponse) => {
        this.handleError('Failed to reset password', error);
        this.isLoading = false;
      }
    });
  }
  
  // ==========================================================================
  // UI METHODS
  // ==========================================================================
  
  togglePasswordVisibility(): void {
    this.showPassword = !this.showPassword;
  }
  
  toggleConfirmPasswordVisibility(): void {
    this.showConfirmPassword = !this.showConfirmPassword;
  }
  
  goBack(): void {
    this.router.navigate(['/home']);
  }
  
  // ==========================================================================
  // UTILITY METHODS
  // ==========================================================================
  
  getPasswordRequirements(): any {
    const password = this.resetForm.get('newPassword')?.value || '';
    return {
      hasUpperCase: /[A-Z]/.test(password),
      hasLowerCase: /[a-z]/.test(password),
      hasNumeric: /[0-9]/.test(password),
      hasSpecialChar: /[@#$%^&+=]/.test(password),
      hasMinLength: password.length >= 8
    };
  }
  
  passwordsMatch(): boolean {
    const newPassword = this.resetForm.get('newPassword')?.value;
    const confirmPassword = this.resetForm.get('confirmPassword')?.value;
    return newPassword && confirmPassword && newPassword === confirmPassword;
  }
  
  getErrorMessage(fieldName: string): string {
    const control = this.resetForm.get(fieldName);
    
    if (control && control.touched && control.errors) {
      if (control.errors['required']) {
        return `${this.capitalizeFirstLetter(fieldName)} is required.`;
      }
      if (control.errors['minlength']) {
        return `${this.capitalizeFirstLetter(fieldName)} must be at least ${control.errors['minlength'].requiredLength} characters.`;
      }
      if (control.errors['maxlength']) {
        return `${this.capitalizeFirstLetter(fieldName)} cannot exceed ${control.errors['maxlength'].requiredLength} characters.`;
      }
      if (control.errors['passwordPattern']) {
        return 'Password must contain uppercase, lowercase, number, and special character (@#$%^&+=).';
      }
      if (control.errors['passwordMismatch']) {
        return 'Passwords do not match.';
      }
    }
    
    const formErrors = this.resetForm.errors;
    if (formErrors && formErrors['passwordMismatch']) {
      return 'Passwords do not match.';
    }
    
    return '';
  }
  
  hasError(fieldName: string): boolean {
    const control = this.resetForm.get(fieldName);
    return !!(control && control.invalid && control.touched);
  }
  
  hasFormError(): boolean {
    return !!(this.resetForm.errors && this.resetForm.touched);
  }
  
  private capitalizeFirstLetter(text: string): string {
    if (text === 'oldPassword') return 'Current Password';
    if (text === 'newPassword') return 'New Password';
    if (text === 'confirmPassword') return 'Confirm Password';
    return text.charAt(0).toUpperCase() + text.slice(1);
  }
  
  private markFormGroupTouched(formGroup: FormGroup): void {
    Object.keys(formGroup.controls).forEach(key => {
      const control = formGroup.get(key);
      control?.markAsTouched();
      
      if (control instanceof FormGroup) {
        this.markFormGroupTouched(control);
      }
    });
  }
  
  // ==========================================================================
  // ERROR HANDLING
  // ==========================================================================
  
  private handleError(context: string, error: HttpErrorResponse): void {
    console.error(`Error ${context}:`, error);
    
    if (error.status === 0) {
      this.errorMessage = 'Cannot connect to server. Please check if the backend is running.';
    } else if (error.status === 401) {
      this.errorMessage = 'Invalid username or current password.';
    } else if (error.status === 404) {
      this.errorMessage = 'User not found.';
    } else if (error.status >= 500) {
      this.errorMessage = 'Server error. Please try again later.';
    } else {
      this.errorMessage = error.error?.message || 'An unexpected error occurred.';
    }
    
    this.showError(this.errorMessage);
  }
  
  private showError(message: string): void {
    this.errorMessage = message;
    this.successMessage = '';
    setTimeout(() => this.errorMessage = '', 5000);
  }
  
  private showSuccess(message: string): void {
    this.successMessage = message;
    this.errorMessage = '';
    setTimeout(() => this.successMessage = '', 5000);
  }
}

