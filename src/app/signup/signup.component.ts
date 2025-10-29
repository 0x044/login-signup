import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators, AbstractControl, ReactiveFormsModule, ValidationErrors } from '@angular/forms';
import { Router } from '@angular/router';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { catchError, tap } from 'rxjs/operators';
import { throwError } from 'rxjs';
import { CommonModule } from '@angular/common';

// ============================================================================
// INTERFACES - All type definitions in one place
// ============================================================================

interface UserSignupRequest {
  username: string;
  password: string;
  userMail: string;
  userPhone: string;
  userAddress: string;
  userRole: string;
}

interface UserResponse {
  userId: number;
  username: string;
  userMail: string;
  userPhone: string;
  userAddress: string;
  userRole: string;
  userStatus: string;
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

// ============================================================================
// COMPONENT - Complete signup functionality with debugging
// ============================================================================

@Component({
  selector: 'app-signup',
  templateUrl: './signup.component.html',
  styleUrls: ['./signup.component.css'],
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule]
})
export class SignupComponent implements OnInit {
  
  // ==========================================================================
  // API CONFIGURATION
  // ==========================================================================
  private readonly API_BASE_URL = 'http://localhost:8080/v1/api';
  private readonly SIGNUP_ENDPOINT = `${this.API_BASE_URL}/user/addUser`;

  // ==========================================================================
  // DEBUGGING FLAG
  // ==========================================================================
  private readonly DEBUG_MODE = true; // Set to false in production

  // ==========================================================================
  // FORM AND UI STATE
  // ==========================================================================
  signupForm!: FormGroup;
  showPassword = false;
  showConfirmPassword = false;
  isLoading = false;
  errorMessage = '';
  successMessage = '';
  
  // User roles
  userRoles = [
    { value: 'CLIENT', label: 'Client (Book Properties)', icon: '🏠' },
    { value: 'HOST', label: 'Host (List Properties)', icon: '🏢' }
  ];

  // ==========================================================================
  // CONSTRUCTOR
  // ==========================================================================
  constructor(
    private fb: FormBuilder,
    private router: Router,
    private http: HttpClient
  ) {
    this.debugLog('🏗️ SignupComponent constructor called');
  }

  // ==========================================================================
  // LIFECYCLE HOOKS
  // ==========================================================================
  
  ngOnInit(): void {
    this.debugLog('🔄 SignupComponent initialized');
    this.initializeForm();
  }

  // ==========================================================================
  // DEBUGGING UTILITIES
  // ==========================================================================
  
  /**
   * Centralized debug logging
   */
  private debugLog(message: string, data?: any): void {
    if (this.DEBUG_MODE) {
      const timestamp = new Date().toLocaleTimeString();
      console.log(`[${timestamp}] ${message}`);
      if (data !== undefined) {
        console.log('📦 Data:', data);
      }
    }
  }

  /**
   * Log error with styling
   */
  private debugError(message: string, error?: any): void {
    if (this.DEBUG_MODE) {
      const timestamp = new Date().toLocaleTimeString();
      console.error(`[${timestamp}] ❌ ${message}`);
      if (error !== undefined) {
        console.error('Error details:', error);
      }
    }
  }

  /**
   * Log success with styling
   */
  private debugSuccess(message: string, data?: any): void {
    if (this.DEBUG_MODE) {
      const timestamp = new Date().toLocaleTimeString();
      console.log(`%c[${timestamp}] ✅ ${message}`, 'color: green; font-weight: bold;');
      if (data !== undefined) {
        console.log('📦 Data:', data);
      }
    }
  }

  /**
   * Log warning
   */
  private debugWarn(message: string, data?: any): void {
    if (this.DEBUG_MODE) {
      const timestamp = new Date().toLocaleTimeString();
      console.warn(`[${timestamp}] ⚠️ ${message}`);
      if (data !== undefined) {
        console.warn('Data:', data);
      }
    }
  }

  // ==========================================================================
  // FORM INITIALIZATION
  // ==========================================================================
  
  /**
   * Initialize the signup form with validators matching backend requirements
   */
  private initializeForm(): void {
    this.debugLog('📝 Initializing signup form with validators');
    
    this.signupForm = this.fb.group({
      username: [
        '',
        [
          Validators.required,
          Validators.minLength(3),
          Validators.maxLength(20),
          this.noWhitespaceValidator
        ]
      ],
      password: [
        '',
        [
          Validators.required,
          Validators.minLength(8),
          Validators.maxLength(20),
          this.passwordPatternValidator
        ]
      ],
      confirmPassword: [
        '',
        [
          Validators.required
        ]
      ],
      userMail: [
        '',
        [
          Validators.required,
          Validators.email
        ]
      ],
      userPhone: [
        '',
        [
          Validators.required,
          Validators.pattern('^[6-9]\\d{9}$')
        ]
      ],
      userAddress: [
        '',
        [
          Validators.required,
          Validators.minLength(10),
          Validators.maxLength(200)
        ]
      ],
      userRole: [
        'CLIENT',
        [
          Validators.required,
          Validators.pattern('^(CLIENT|HOST)$')
        ]
      ],
      agreeTerms: [
        false,
        [
          Validators.requiredTrue
        ]
      ]
    }, { validators: this.passwordMatchValidator });

    this.debugSuccess('Signup form initialized successfully', {
      controls: Object.keys(this.signupForm.controls),
      validators: 'Complete validation applied'
    });

    // Subscribe to password changes to revalidate confirmPassword
    this.signupForm.get('password')?.valueChanges.subscribe(() => {
      this.signupForm.get('confirmPassword')?.updateValueAndValidity();
    });
  }

  // ==========================================================================
  // CUSTOM VALIDATORS
  // ==========================================================================
  
  /**
   * Custom validator to prevent whitespace-only values
   */
  private noWhitespaceValidator(control: AbstractControl): ValidationErrors | null {
    const isWhitespace = (control.value || '').trim().length === 0;
    return isWhitespace ? { whitespace: true } : null;
  }

  /**
   * Password pattern validator - must contain uppercase, lowercase, number, special char
   */
  private passwordPatternValidator(control: AbstractControl): ValidationErrors | null {
    const value = control.value;
    if (!value) {
      return null;
    }

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

  /**
   * Password match validator
   */
  private passwordMatchValidator(formGroup: AbstractControl): ValidationErrors | null {
    const password = formGroup.get('password')?.value;
    const confirmPassword = formGroup.get('confirmPassword')?.value;

    if (password && confirmPassword && password !== confirmPassword) {
      formGroup.get('confirmPassword')?.setErrors({ passwordMismatch: true });
      return { passwordMismatch: true };
    }

    // Clear the error if passwords match
    const confirmPasswordControl = formGroup.get('confirmPassword');
    if (confirmPasswordControl?.hasError('passwordMismatch')) {
      delete confirmPasswordControl.errors?.['passwordMismatch'];
      confirmPasswordControl.updateValueAndValidity({ onlySelf: true, emitEvent: false });
    }

    return null;
  }

  // ==========================================================================
  // FORM GETTERS
  // ==========================================================================
  
  get username(): AbstractControl | null {
    return this.signupForm.get('username');
  }

  get password(): AbstractControl | null {
    return this.signupForm.get('password');
  }

  get confirmPassword(): AbstractControl | null {
    return this.signupForm.get('confirmPassword');
  }

  get userMail(): AbstractControl | null {
    return this.signupForm.get('userMail');
  }

  get userPhone(): AbstractControl | null {
    return this.signupForm.get('userPhone');
  }

  get userAddress(): AbstractControl | null {
    return this.signupForm.get('userAddress');
  }

  get userRole(): AbstractControl | null {
    return this.signupForm.get('userRole');
  }

  get agreeTerms(): AbstractControl | null {
    return this.signupForm.get('agreeTerms');
  }

  // ==========================================================================
  // UI INTERACTIONS
  // ==========================================================================
  
  /**
   * Toggle password visibility
   */
  togglePasswordVisibility(): void {
    this.showPassword = !this.showPassword;
    this.debugLog(`Password visibility toggled: ${this.showPassword ? 'Visible' : 'Hidden'}`);
  }

  /**
   * Toggle confirm password visibility
   */
  toggleConfirmPasswordVisibility(): void {
    this.showConfirmPassword = !this.showConfirmPassword;
    this.debugLog(`Confirm password visibility toggled: ${this.showConfirmPassword ? 'Visible' : 'Hidden'}`);
  }

  /**
   * Navigate to login page
   */
  navigateToLogin(): void {
    this.debugLog('🔄 Navigating to login page');
    this.router.navigate(['/login']);
  }

  /**
   * Navigate to home page
   */
  navigateToHome(): void {
    this.debugLog('🔄 Navigating to home page');
    this.router.navigate(['/']);
  }

  // ==========================================================================
  // FORM SUBMISSION AND SIGNUP
  // ==========================================================================
  
  /**
   * Handle form submission
   */
  onSubmit(): void {
    console.log('%c🚀 SIGNUP ATTEMPT STARTED', 'color: purple; font-weight: bold; font-size: 14px; background: #f3e5f5; padding: 5px;');
    
    // Clear previous messages
    this.errorMessage = '';
    this.successMessage = '';

    // Log form state
    this.debugLog('Form submission initiated', {
      formValid: this.signupForm.valid,
      formValue: {
        ...this.signupForm.value,
        password: '***hidden***',
        confirmPassword: '***hidden***'
      }
    });

    // Validate form
    if (this.signupForm.invalid) {
      this.debugWarn('Form validation failed');
      this.markFormGroupTouched(this.signupForm);
      
      console.group('❌ Form Validation Errors:');
      Object.keys(this.signupForm.controls).forEach(key => {
        const control = this.signupForm.get(key);
        if (control && control.errors) {
          console.log(`├─ ${key}:`, control.errors);
        }
      });
      console.groupEnd();
      
      this.errorMessage = 'Please fill in all required fields correctly.';
      return;
    }

    this.debugSuccess('Form validation passed');
    
    // Start loading
    this.isLoading = true;

    // Prepare signup request
    const signupRequest: UserSignupRequest = {
      username: this.signupForm.value.username.trim(),
      password: this.signupForm.value.password,
      userMail: this.signupForm.value.userMail.trim(),
      userPhone: this.signupForm.value.userPhone.trim(),
      userAddress: this.signupForm.value.userAddress.trim(),
      userRole: this.signupForm.value.userRole
    };

    console.log('%c📤 Sending Signup API Request', 'color: blue; font-weight: bold;');
    console.log('Endpoint:', this.SIGNUP_ENDPOINT);
    console.log('Request Data:', { 
      ...signupRequest, 
      password: '***hidden***' 
    });

    // Make API call
    this.performSignup(signupRequest);
  }

  /**
   * Perform the signup API call
   */
  private performSignup(signupRequest: UserSignupRequest): void {
    this.debugLog('🌐 Making HTTP POST request to signup endpoint');
    
    const startTime = Date.now();
    
    this.http.post<ApiResponse<UserResponse>>(this.SIGNUP_ENDPOINT, signupRequest)
      .pipe(
        tap((response: ApiResponse<UserResponse>) => {
          const endTime = Date.now();
          const duration = endTime - startTime;
          
          console.log('%c📥 API Response Received', 'color: green; font-weight: bold;');
          console.log(`⏱️ Response time: ${duration}ms`);
          console.log('Response:', response);
          
          if (response.success && response.data) {
            this.debugSuccess('Signup API call successful', response.data);
            
            console.log('%c✅ USER REGISTRATION SUCCESSFUL!', 'color: green; font-weight: bold; font-size: 16px; background: #e8f5e9; padding: 8px;');
            console.log('%c👤 Registered User Details:', 'color: blue; font-weight: bold;');
            console.table({
              'User ID': response.data.userId,
              'Username': response.data.username,
              'Email': response.data.userMail,
              'Phone': response.data.userPhone,
              'Role': response.data.userRole,
              'Status': response.data.userStatus
            });
            
            this.handleSignupSuccess(response.data, response.message);
          } else {
            this.debugError('Signup failed - Invalid response', response);
            throw new Error(response.message || 'Signup failed');
          }
        }),
        catchError((error: HttpErrorResponse) => {
          const endTime = Date.now();
          const duration = endTime - startTime;
          
          console.log(`⏱️ Request failed after: ${duration}ms`);
          this.handleSignupError(error);
          return throwError(() => error);
        })
      )
      .subscribe({
        complete: () => {
          this.isLoading = false;
          this.debugLog('Signup HTTP request completed');
        }
      });
  }

  /**
   * Handle successful signup response
   */
  private handleSignupSuccess(userData: UserResponse, message: string): void {
    console.log('%c🎊 SIGNUP SUCCESS HANDLER', 'color: green; font-weight: bold; font-size: 14px; background: #e8f5e9; padding: 5px;');
    
    this.debugLog('Processing successful signup...');

    // Show success message
    this.successMessage = message || 'Registration successful! Redirecting to login...';
    this.debugSuccess(this.successMessage);

    console.log('%c🔄 Preparing to redirect to login page...', 'color: blue; font-weight: bold;');
    console.log('User can now login with username:', userData.username);

    // Navigate to login page after a short delay
    setTimeout(() => {
      console.log('%c✈️ Redirecting to login page...', 'color: green; font-weight: bold;');
      this.router.navigate(['/loginUser'], {
        queryParams: { 
          registered: 'true',
          username: userData.username
        }
      });
    }, 2000); // 2 second delay to show success message
  }

  /**
   * Handle signup errors with detailed messages
   */
  private handleSignupError(error: HttpErrorResponse): void {
    console.log('%c❌ SIGNUP ERROR HANDLER', 'color: red; font-weight: bold; font-size: 14px; background: #ffebee; padding: 5px;');
    
    this.isLoading = false;

    this.debugError('Signup failed', {
      status: error.status,
      statusText: error.statusText,
      error: error.error,
      message: error.message
    });

    // Extract error message from backend
    if (error.error && typeof error.error === 'object') {
      const errorResponse = error.error as ErrorResponse;
      this.errorMessage = errorResponse.message || 'An error occurred during registration.';
      
      console.group('🔍 Error Details:');
      console.log('├─ Success:', errorResponse.success);
      console.log('├─ Message:', errorResponse.message);
      console.log('└─ Timestamp:', errorResponse.timestamp);
      console.groupEnd();
      
    } else if (error.status === 0) {
      this.errorMessage = 'Unable to connect to the server. Please check your internet connection.';
      this.debugError('Network error - Server unreachable');
    } else if (error.status === 409) {
      this.errorMessage = 'Username, email, or phone number already exists. Please use different details.';
      this.debugError('Conflict - Duplicate resource');
    } else if (error.status === 400) {
      this.errorMessage = 'Invalid data provided. Please check all fields.';
      this.debugError('Bad request - Validation failed');
    } else if (error.status >= 500) {
      this.errorMessage = 'Server error. Please try again later.';
      this.debugError('Server error encountered');
    } else {
      this.errorMessage = error.message || 'An unexpected error occurred. Please try again.';
      this.debugError('Unexpected error occurred');
    }

    console.log('%c💬 Error Message Displayed:', 'color: red; font-weight: bold;', this.errorMessage);
  }

  // ==========================================================================
  // UTILITY METHODS
  // ==========================================================================
  
  /**
   * Mark all controls in a form group as touched
   */
  private markFormGroupTouched(formGroup: FormGroup): void {
    Object.keys(formGroup.controls).forEach(key => {
      const control = formGroup.get(key);
      control?.markAsTouched();

      if (control instanceof FormGroup) {
        this.markFormGroupTouched(control);
      }
    });
  }

  /**
   * Get validation error message for a field
   */
  getErrorMessage(fieldName: string): string {
    const control = this.signupForm.get(fieldName);
    
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
      if (control.errors['whitespace']) {
        return `${this.capitalizeFirstLetter(fieldName)} cannot be empty or contain only spaces.`;
      }
      if (control.errors['email']) {
        return 'Please enter a valid email address.';
      }
      if (control.errors['pattern']) {
        if (fieldName === 'userPhone') {
          return 'Please enter a valid 10-digit Indian mobile number starting with 6-9.';
        }
        return `${this.capitalizeFirstLetter(fieldName)} format is invalid.`;
      }
      if (control.errors['passwordPattern']) {
        return 'Password must contain uppercase, lowercase, number, and special character (@#$%^&+=).';
      }
      if (control.errors['passwordMismatch']) {
        return 'Passwords do not match.';
      }
    }
    
    return '';
  }

  /**
   * Get password strength requirements status
   */
  getPasswordRequirements(): any {
    const password = this.password?.value || '';
    return {
      hasUpperCase: /[A-Z]/.test(password),
      hasLowerCase: /[a-z]/.test(password),
      hasNumeric: /[0-9]/.test(password),
      hasSpecialChar: /[@#$%^&+=]/.test(password),
      hasMinLength: password.length >= 8
    };
  }

  /**
   * Capitalize first letter of a string
   */
  private capitalizeFirstLetter(text: string): string {
    if (text === 'userMail') return 'Email';
    if (text === 'userPhone') return 'Phone number';
    if (text === 'userAddress') return 'Address';
    if (text === 'userRole') return 'User role';
    if (text === 'confirmPassword') return 'Confirm password';
    if (text === 'agreeTerms') return 'Terms and conditions';
    return text.charAt(0).toUpperCase() + text.slice(1);
  }

  /**
   * Check if a field has error
   */
  hasError(fieldName: string): boolean {
    const control = this.signupForm.get(fieldName);
    return !!(control && control.invalid && control.touched);
  }

  /**
   * Reset form and clear messages
   */
  resetForm(): void {
    this.debugLog('🔄 Resetting signup form');
    this.signupForm.reset({
      userRole: 'CLIENT',
      agreeTerms: false
    });
    this.errorMessage = '';
    this.successMessage = '';
    this.showPassword = false;
    this.showConfirmPassword = false;
    this.debugSuccess('Signup form reset completed');
  }
}