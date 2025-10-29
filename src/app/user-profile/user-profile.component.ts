import { Component, OnInit } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { FormBuilder, FormGroup, Validators, AbstractControl, ReactiveFormsModule, ValidationErrors, FormsModule } from '@angular/forms';
import { catchError, tap } from 'rxjs/operators';
import { throwError } from 'rxjs';
import { CommonModule } from '@angular/common';

// ============================================================================
// INTERFACES
// ============================================================================

interface UserResponse {
  userId: number;
  username: string;
  userMail: string;
  userPhone: string;
  userAddress: string;
  userRole: string;
  userStatus: string;
}

interface UserUpdateRequest {
  userMail: string;
  userPhone: string;
  userAddress: string;
}

interface ResetPasswordRequest {
  username: string;
  oldPassword: string;
  newPassword: string;
}

interface ComplaintResponse {
  complaintId: number;
  userId: number;
  username: string;
  bookingId: number;
  complaintDescription: string;
  complaintStatus: string;
  complaintType: string;
  complaintDate: string;
}

interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
}

interface ErrorResponse {
  success: boolean;
  message: string;
  timestamp: string;
}

interface EditState {
  email: boolean;
  phone: boolean;
  address: boolean;
}

// ============================================================================
// COMPONENT
// ============================================================================

@Component({
  selector: 'app-user-profile',
  templateUrl: './user-profile.component.html',
  styleUrls: ['./user-profile.component.css'],
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormsModule]
})
export class UserProfileComponent implements OnInit {
  
  // ==========================================================================
  // API CONFIGURATION
  // ==========================================================================
  private readonly API_BASE_URL = 'http://localhost:8080/v1/api';
  private readonly VIEW_PROFILE_ENDPOINT = `${this.API_BASE_URL}/user/viewProfile`;
  private readonly UPDATE_USER_ENDPOINT = `${this.API_BASE_URL}/user/updateUser`;
  private readonly DELETE_USER_ENDPOINT = `${this.API_BASE_URL}/user/deleteUser`;
  private readonly RESET_PASSWORD_ENDPOINT = `${this.API_BASE_URL}/user/resetPassword`;
  private readonly VIEW_COMPLAINTS_ENDPOINT = `${this.API_BASE_URL}/user/viewComplaints`;

  // ==========================================================================
  // DEBUGGING FLAG
  // ==========================================================================
  private readonly DEBUG_MODE = true;

  // ==========================================================================
  // STATE MANAGEMENT
  // ==========================================================================
  userProfile: UserResponse | null = null;
  complaints: ComplaintResponse[] = [];
  userId: number | null = null;
  
  // Loading states
  isLoading = false;
  isSaving = false;
  isDeleting = false;
  isLoadingComplaints = false;
  
  // UI states
  errorMessage = '';
  successMessage = '';
  editMode: EditState = {
    email: false,
    phone: false,
    address: false
  };
  
  // Modal states
  showPasswordModal = false;
  showDeleteModal = false;
  showComplaintsModal = false;
  
  // Password visibility
  showOldPassword = false;
  showNewPassword = false;
  showConfirmPassword = false;
  
  // Forms
  passwordForm!: FormGroup;
  
  // Temporary edit values
  tempEmail = '';
  tempPhone = '';
  tempAddress = '';
  
  // Original values for cancel
  originalEmail = '';
  originalPhone = '';
  originalAddress = '';

  // ==========================================================================
  // CONSTRUCTOR
  // ==========================================================================
  constructor(
    private http: HttpClient,
    private router: Router,
    private route: ActivatedRoute,
    private fb: FormBuilder
  ) {
    this.debugLog('🏗️ UserProfileComponent constructor called');
  }

  // ==========================================================================
  // LIFECYCLE HOOKS
  // ==========================================================================
  
  ngOnInit(): void {
    this.debugLog('🔄 UserProfileComponent initialized');
    this.initializePasswordForm();
    this.getUserIdAndLoadProfile();
  }

  // ==========================================================================
  // DEBUGGING UTILITIES
  // ==========================================================================
  
  private debugLog(message: string, data?: any): void {
    if (this.DEBUG_MODE) {
      const timestamp = new Date().toLocaleTimeString();
      console.log(`[${timestamp}] ${message}`);
      if (data !== undefined) {
        console.log('📦 Data:', data);
      }
    }
  }

  private debugError(message: string, error?: any): void {
    if (this.DEBUG_MODE) {
      const timestamp = new Date().toLocaleTimeString();
      console.error(`[${timestamp}] ❌ ${message}`);
      if (error !== undefined) {
        console.error('Error details:', error);
      }
    }
  }

  private debugSuccess(message: string, data?: any): void {
    if (this.DEBUG_MODE) {
      const timestamp = new Date().toLocaleTimeString();
      console.log(`%c[${timestamp}] ✅ ${message}`, 'color: green; font-weight: bold;');
      if (data !== undefined) {
        console.log('📦 Data:', data);
      }
    }
  }

  // ==========================================================================
  // PASSWORD FORM INITIALIZATION
  // ==========================================================================
  
  private initializePasswordForm(): void {
    this.passwordForm = this.fb.group({
      oldPassword: ['', [Validators.required, Validators.minLength(8), Validators.maxLength(20)]],
      newPassword: ['', [
        Validators.required,
        Validators.minLength(8),
        Validators.maxLength(20),
        this.passwordPatternValidator
      ]],
      confirmPassword: ['', [Validators.required]]
    }, { validators: this.passwordMatchValidator });

    this.debugLog('Password form initialized');
  }

  // ==========================================================================
  // CUSTOM VALIDATORS
  // ==========================================================================
  
  private passwordPatternValidator(control: AbstractControl): ValidationErrors | null {
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

  private passwordMatchValidator(formGroup: AbstractControl): ValidationErrors | null {
    const newPassword = formGroup.get('newPassword')?.value;
    const confirmPassword = formGroup.get('confirmPassword')?.value;

    if (newPassword && confirmPassword && newPassword !== confirmPassword) {
      formGroup.get('confirmPassword')?.setErrors({ passwordMismatch: true });
      return { passwordMismatch: true };
    }

    const confirmPasswordControl = formGroup.get('confirmPassword');
    if (confirmPasswordControl?.hasError('passwordMismatch')) {
      delete confirmPasswordControl.errors?.['passwordMismatch'];
      confirmPasswordControl.updateValueAndValidity({ onlySelf: true, emitEvent: false });
    }

    return null;
  }

  // ==========================================================================
  // USER ID RETRIEVAL & PROFILE LOADING
  // ==========================================================================
  
  private getUserIdAndLoadProfile(): void {
    this.route.paramMap.subscribe(params => {
      const routeUserId = params.get('userId');
      
      if (routeUserId) {
        this.userId = parseInt(routeUserId, 10);
      } else {
        const sessionUserId = sessionStorage.getItem('userId');
        if (sessionUserId) {
          this.userId = parseInt(sessionUserId, 10);
        }
      }

      if (this.userId) {
        this.loadUserProfile();
      } else {
        this.errorMessage = 'User not logged in. Please login first.';
        setTimeout(() => this.router.navigate(['/loginUser']), 2000);
      }
    });
  }

  // ==========================================================================
  // API 1: VIEW PROFILE
  // ==========================================================================
  
  loadUserProfile(): void {
    if (!this.userId) return;

    console.log('%c🔍 LOADING USER PROFILE', 'color: blue; font-weight: bold; font-size: 14px; background: #e3f2fd; padding: 5px;');
    
    this.isLoading = true;
    this.errorMessage = '';

    const endpoint = `${this.VIEW_PROFILE_ENDPOINT}/${this.userId}`;
    this.debugLog('GET request to:', endpoint);

    const startTime = Date.now();

    this.http.get<ApiResponse<UserResponse>>(endpoint)
      .pipe(
        tap((response: ApiResponse<UserResponse>) => {
          const duration = Date.now() - startTime;
          console.log(`⏱️ Response time: ${duration}ms`);
          
          if (response.success && response.data) {
            console.log('%c✅ USER PROFILE LOADED!', 'color: green; font-weight: bold; font-size: 16px; background: #e8f5e9; padding: 8px;');
            console.table({
              'User ID': response.data.userId,
              'Username': response.data.username,
              'Email': response.data.userMail,
              'Phone': response.data.userPhone,
              'Role': response.data.userRole,
              'Status': response.data.userStatus
            });
            
            this.userProfile = response.data;
            this.originalEmail = response.data.userMail;
            this.originalPhone = response.data.userPhone;
            this.originalAddress = response.data.userAddress;
            this.debugSuccess('Profile loaded successfully');
          } else {
            throw new Error(response.message || 'Failed to load profile');
          }
        }),
        catchError((error: HttpErrorResponse) => {
          this.handleError('Profile loading failed', error);
          return throwError(() => error);
        })
      )
      .subscribe({
        complete: () => {
          this.isLoading = false;
        }
      });
  }

  // ==========================================================================
  // API 2: UPDATE USER
  // ==========================================================================
  
  updateUserField(field: 'email' | 'phone' | 'address'): void {
    if (!this.userId || !this.userProfile) return;

    console.log(`%c📝 UPDATING ${field.toUpperCase()}`, 'color: blue; font-weight: bold; font-size: 14px; background: #e3f2fd; padding: 5px;');

    // Validate field
    if (field === 'email' && !this.isValidEmail(this.tempEmail)) {
      this.errorMessage = 'Please enter a valid email address';
      return;
    }

    if (field === 'phone' && !this.isValidPhone(this.tempPhone)) {
      this.errorMessage = 'Please enter a valid 10-digit phone number starting with 6-9';
      return;
    }

    if (field === 'address' && (this.tempAddress.length < 10 || this.tempAddress.length > 200)) {
      this.errorMessage = 'Address must be between 10 and 200 characters';
      return;
    }

    this.isSaving = true;
    this.errorMessage = '';
    this.successMessage = '';

    const updateRequest: UserUpdateRequest = {
      userMail: field === 'email' ? this.tempEmail : this.userProfile.userMail,
      userPhone: field === 'phone' ? this.tempPhone : this.userProfile.userPhone,
      userAddress: field === 'address' ? this.tempAddress : this.userProfile.userAddress
    };

    const endpoint = `${this.UPDATE_USER_ENDPOINT}/${this.userId}`;
    this.debugLog('PUT request to: ${endpoint}', updateRequest);

    const startTime = Date.now();

    this.http.put<ApiResponse<UserResponse>>(endpoint, updateRequest)
      .pipe(
        tap((response: ApiResponse<UserResponse>) => {
          const duration = Date.now() - startTime;
          console.log(`⏱️ Response time: ${duration}ms`);
          
          if (response.success && response.data) {
            console.log(`%c✅ ${field.toUpperCase()} UPDATED SUCCESSFULLY!`, 'color: green; font-weight: bold; font-size: 16px; background: #e8f5e9; padding: 8px;');
            console.log('Updated data:', response.data);
            
            this.userProfile = response.data;
            this.originalEmail = response.data.userMail;
            this.originalPhone = response.data.userPhone;
            this.originalAddress = response.data.userAddress;
            
            // Exit edit mode
            this.editMode[field === 'email' ? 'email' : field === 'phone' ? 'phone' : 'address'] = false;
            
            this.successMessage = `${field.charAt(0).toUpperCase() + field.slice(1)} updated successfully`;
            this.debugSuccess(`${field} updated successfully`);
            
            setTimeout(() => this.successMessage = '', 3000);
          } else {
            throw new Error(response.message || 'Update failed');
          }
        }),
        catchError((error: HttpErrorResponse) => {
          this.handleError(`${field} update failed`, error);
          return throwError(() => error);
        })
      )
      .subscribe({
        complete: () => {
          this.isSaving = false;
        }
      });
  }

  // ==========================================================================
  // API 3: RESET PASSWORD
  // ==========================================================================
  
  submitPasswordChange(): void {
    if (this.passwordForm.invalid || !this.userProfile) {
      this.markFormGroupTouched(this.passwordForm);
      return;
    }

    console.log('%c🔒 CHANGING PASSWORD', 'color: blue; font-weight: bold; font-size: 14px; background: #e3f2fd; padding: 5px;');

    this.isSaving = true;
    this.errorMessage = '';

    const resetRequest: ResetPasswordRequest = {
      username: this.userProfile.username,
      oldPassword: this.passwordForm.value.oldPassword,
      newPassword: this.passwordForm.value.newPassword
    };

    this.debugLog('PUT request to:', this.RESET_PASSWORD_ENDPOINT);

    const startTime = Date.now();

    this.http.put<ApiResponse<string>>(this.RESET_PASSWORD_ENDPOINT, resetRequest)
      .pipe(
        tap((response: ApiResponse<string>) => {
          const duration = Date.now() - startTime;
          console.log(`⏱️ Response time: ${duration}ms`);
          
          if (response.success) {
            console.log('%c✅ PASSWORD CHANGED SUCCESSFULLY!', 'color: green; font-weight: bold; font-size: 16px; background: #e8f5e9; padding: 8px;');
            
            this.successMessage = 'Password changed successfully';
            this.debugSuccess('Password changed successfully');
            
            this.passwordForm.reset();
            this.showPasswordModal = false;
            
            setTimeout(() => this.successMessage = '', 3000);
          } else {
            throw new Error(response.message || 'Password change failed');
          }
        }),
        catchError((error: HttpErrorResponse) => {
          this.handleError('Password change failed', error);
          return throwError(() => error);
        })
      )
      .subscribe({
        complete: () => {
          this.isSaving = false;
        }
      });
  }

  // ==========================================================================
  // API 4: DELETE USER
  // ==========================================================================
  
  confirmDeleteAccount(): void {
    if (!this.userId) return;

    console.log('%c🗑️ DELETING ACCOUNT', 'color: red; font-weight: bold; font-size: 14px; background: #ffebee; padding: 5px;');

    this.isDeleting = true;
    this.errorMessage = '';

    const endpoint = `${this.DELETE_USER_ENDPOINT}/${this.userId}`;
    this.debugLog('DELETE request to:', endpoint);

    const startTime = Date.now();

    this.http.delete<ApiResponse<string>>(endpoint)
      .pipe(
        tap((response: ApiResponse<string>) => {
          const duration = Date.now() - startTime;
          console.log(`⏱️ Response time: ${duration}ms`);
          
          if (response.success) {
            console.log('%c✅ ACCOUNT DELETED SUCCESSFULLY!', 'color: green; font-weight: bold; font-size: 16px; background: #e8f5e9; padding: 8px;');
            
            this.debugSuccess('Account deleted successfully');
            
            // Clear session
            this.clearSession();
            
            // Redirect to thank you page
            setTimeout(() => {
              this.router.navigate(['/account-deleted']);
            }, 1000);
          } else {
            throw new Error(response.message || 'Account deletion failed');
          }
        }),
        catchError((error: HttpErrorResponse) => {
          this.handleError('Account deletion failed', error);
          this.showDeleteModal = false;
          return throwError(() => error);
        })
      )
      .subscribe({
        complete: () => {
          this.isDeleting = false;
        }
      });
  }

  // ==========================================================================
  // API 5: VIEW COMPLAINTS
  // ==========================================================================
  
  loadComplaints(): void {
    if (!this.userId) return;

    console.log('%c👁️ LOADING COMPLAINTS', 'color: blue; font-weight: bold; font-size: 14px; background: #e3f2fd; padding: 5px;');

    this.isLoadingComplaints = true;
    this.errorMessage = '';

    const endpoint = `${this.VIEW_COMPLAINTS_ENDPOINT}/${this.userId}`;
    this.debugLog('GET request to:', endpoint);

    const startTime = Date.now();

    this.http.get<ApiResponse<ComplaintResponse[]>>(endpoint)
      .pipe(
        tap((response: ApiResponse<ComplaintResponse[]>) => {
          const duration = Date.now() - startTime;
          console.log(`⏱️ Response time: ${duration}ms`);
          
          if (response.success && response.data) {
            console.log('%c✅ COMPLAINTS LOADED!', 'color: green; font-weight: bold; font-size: 16px; background: #e8f5e9; padding: 8px;');
            console.log(`Total complaints: ${response.data.length}`);
            console.table(response.data);
            
            this.complaints = response.data;
            this.showComplaintsModal = true;
            this.debugSuccess('Complaints loaded successfully', response.data);
          } else {
            throw new Error(response.message || 'Failed to load complaints');
          }
        }),
        catchError((error: HttpErrorResponse) => {
          this.handleError('Complaints loading failed', error);
          return throwError(() => error);
        })
      )
      .subscribe({
        complete: () => {
          this.isLoadingComplaints = false;
        }
      });
  }

  // ==========================================================================
  // EDIT MODE MANAGEMENT
  // ==========================================================================
  
  enableEdit(field: 'email' | 'phone' | 'address'): void {
    this.debugLog(`Enabling edit mode for ${field}`);
    
    if (field === 'email') {
      this.editMode.email = true;
      this.tempEmail = this.userProfile?.userMail || '';
    } else if (field === 'phone') {
      this.editMode.phone = true;
      this.tempPhone = this.userProfile?.userPhone || '';
    } else if (field === 'address') {
      this.editMode.address = true;
      this.tempAddress = this.userProfile?.userAddress || '';
    }
  }

  cancelEdit(field: 'email' | 'phone' | 'address'): void {
    this.debugLog(`Cancelling edit mode for ${field}`);
    
    if (field === 'email') {
      this.editMode.email = false;
      this.tempEmail = this.originalEmail;
    } else if (field === 'phone') {
      this.editMode.phone = false;
      this.tempPhone = this.originalPhone;
    } else if (field === 'address') {
      this.editMode.address = false;
      this.tempAddress = this.originalAddress;
    }
    
    this.errorMessage = '';
  }

  // ==========================================================================
  // MODAL MANAGEMENT
  // ==========================================================================
  
  openPasswordModal(): void {
    this.debugLog('Opening password change modal');
    this.showPasswordModal = true;
    this.passwordForm.reset();
    this.errorMessage = '';
  }

  closePasswordModal(): void {
    this.debugLog('Closing password change modal');
    this.showPasswordModal = false;
    this.passwordForm.reset();
    this.errorMessage = '';
  }

  openDeleteModal(): void {
    this.debugLog('Opening delete account modal');
    this.showDeleteModal = true;
    this.errorMessage = '';
  }

  closeDeleteModal(): void {
    this.debugLog('Closing delete account modal');
    this.showDeleteModal = false;
    this.errorMessage = '';
  }

  closeComplaintsModal(): void {
    this.debugLog('Closing complaints modal');
    this.showComplaintsModal = false;
  }

  // ==========================================================================
  // PASSWORD VISIBILITY TOGGLES
  // ==========================================================================
  
  toggleOldPasswordVisibility(): void {
    this.showOldPassword = !this.showOldPassword;
  }

  toggleNewPasswordVisibility(): void {
    this.showNewPassword = !this.showNewPassword;
  }

  toggleConfirmPasswordVisibility(): void {
    this.showConfirmPassword = !this.showConfirmPassword;
  }

  // ==========================================================================
  // VALIDATION HELPERS
  // ==========================================================================
  
  isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  isValidPhone(phone: string): boolean {
    const phoneRegex = /^[6-9]\d{9}$/;
    return phoneRegex.test(phone);
  }

  getPasswordRequirements(): any {
    const password = this.passwordForm.get('newPassword')?.value || '';
    return {
      hasUpperCase: /[A-Z]/.test(password),
      hasLowerCase: /[a-z]/.test(password),
      hasNumeric: /[0-9]/.test(password),
      hasSpecialChar: /[@#$%^&+=]/.test(password),
      hasMinLength: password.length >= 8
    };
  }

  passwordsMatch(): boolean {
    const newPassword = this.passwordForm.get('newPassword')?.value;
    const confirmPassword = this.passwordForm.get('confirmPassword')?.value;
    return newPassword && confirmPassword && newPassword === confirmPassword;
  }

  // ==========================================================================
  // ERROR HANDLING
  // ==========================================================================
  
  private handleError(context: string, error: HttpErrorResponse): void {
    console.log('%c❌ ERROR', 'color: red; font-weight: bold; font-size: 14px; background: #ffebee; padding: 5px;');
    
    if (error.error && typeof error.error === 'object') {
      const errorResponse = error.error as ErrorResponse;
      this.errorMessage = errorResponse.message || 'An error occurred.';
    } else if (error.status === 0) {
      this.errorMessage = 'Unable to connect to the server.';
    } else if (error.status === 401) {
      this.errorMessage = 'Unauthorized. Please login again.';
    } else if (error.status === 404) {
      this.errorMessage = 'Resource not found.';
    } else if (error.status === 409) {
      this.errorMessage = 'Email or phone already exists.';
    } else if (error.status >= 500) {
      this.errorMessage = 'Server error. Please try again later.';
    } else {
      this.errorMessage = 'An unexpected error occurred.';
    }

    this.debugError(context, error);
  }

  // ==========================================================================
  // SESSION MANAGEMENT
  // ==========================================================================
  
  private clearSession(): void {
    this.debugLog('Clearing session storage');
    sessionStorage.clear();
  }

  // ==========================================================================
  // NAVIGATION
  // ==========================================================================
  
  goBack(): void {
    this.debugLog('Going back');
    window.history.back();
  }

  navigateToDashboard(): void {
    const userRole = sessionStorage.getItem('userRole');
    if (userRole === 'ADMIN') {
      this.router.navigate(['/admin/dashboard']);
    } else if (userRole === 'HOST') {
      this.router.navigate(['/host/dashboard']);
    } else if (userRole === 'CLIENT') {
      this.router.navigate(['/client/dashboard']);
    } else {
      this.router.navigate(['/']);
    }
  }

  // ==========================================================================
  // UTILITY METHODS
  // ==========================================================================
  
  getInitials(username: string): string {
    if (!username) return '?';
    const parts = username.split(' ');
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return username.substring(0, 2).toUpperCase();
  }

  formatPhone(phone: string): string {
    if (phone && phone.length === 10) {
      return `+91 ${phone.substring(0, 5)} ${phone.substring(5)}`;
    }
    return phone;
  }

  formatDate(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  getComplaintStatusClass(status: string): string {
    const statusMap: { [key: string]: string } = {
      'PENDING': 'status-pending',
      'ACTIVE': 'status-active',
      'IN_PROGRESS': 'status-progress',
      'RESOLVED': 'status-resolved',
      'CLOSED': 'status-closed'
    };
    return statusMap[status] || 'status-default';
  }

  getComplaintTypeIcon(type: string): string {
    const iconMap: { [key: string]: string } = {
      'PROPERTY': '🏠',
      'USER': '👤',
      'BOOKING': '📅',
      'PAYMENT': '💳',
      'OTHER': '📋'
    };
    return iconMap[type] || '📋';
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

  // Form getters
  get oldPassword() { return this.passwordForm.get('oldPassword'); }
  get newPassword() { return this.passwordForm.get('newPassword'); }
  get confirmPassword() { return this.passwordForm.get('confirmPassword'); }
}