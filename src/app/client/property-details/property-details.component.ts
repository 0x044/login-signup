import { Component, OnInit } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Router, ActivatedRoute } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule, FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatChipsModule } from '@angular/material/chips';
import { MatDividerModule } from '@angular/material/divider';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatStepperModule } from '@angular/material/stepper';

// ============================================================================
// INTERFACES
// ============================================================================

interface PropertyDetails {
  propertyId: number;
  propertyName: string;
  propertyDescription: string;
  noOfRooms: number;
  noOfBathrooms: number;
  maxNoOfGuests: number;
  pricePerDay: number;
  imageURL: string;
  buildingNo: string;
  street: string;
  city: string;
  state: string;
  country: string;
  postalCode: string;
  hostId: number;
  hostName: string;
  hostPhone: string;
  propertyStatus: string;
  propertyRate: number;
  propertyRatingCount: number;
  hasWifi: boolean;
  hasParking: boolean;
  hasPool: boolean;
  hasAc: boolean;
  hasHeater: boolean;
  hasPetFriendly: boolean;
}

interface BookingRequest {
  propertyId: number;
  userId: number;
  checkinDate: string;
  checkoutDate: string;
  hasExtraCot: boolean;
  hasDeepClean: boolean;
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
  selector: 'app-property-details',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatChipsModule,
    MatDividerModule,
    MatFormFieldModule,
    MatInputModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatCheckboxModule,
    MatStepperModule
  ],
  templateUrl: './property-details.component.html',
  styleUrls: ['./property-details.component.css']
})
export class PropertyDetailsComponent implements OnInit {
  
  // ==========================================================================
  // PROPERTIES
  // ==========================================================================
  
  private readonly API_BASE_URL = 'http://localhost:8080/v1/api';
  
  // Data
  property: PropertyDetails | null = null;
  propertyId: number | null = null;
  
  // UI state
  isLoading = false;
  isBooking = false;
  showBookingForm = false;
  currentStep = 0;
  
  // Messages
  errorMessage = '';
  successMessage = '';
  
  // Forms
  bookingForm!: FormGroup;
  
  // Date validation
  minDate = new Date();
  maxDate = new Date();
  
  // ==========================================================================
  // CONSTRUCTOR
  // ==========================================================================
  
  constructor(
    private http: HttpClient,
    private router: Router,
    private route: ActivatedRoute,
    private fb: FormBuilder
  ) {
    // Set max date to 1 year from now
    this.maxDate.setFullYear(this.maxDate.getFullYear() + 1);
  }
  
  // ==========================================================================
  // LIFECYCLE HOOKS
  // ==========================================================================
  
  ngOnInit(): void {
    this.route.paramMap.subscribe(params => {
      const id = params.get('id');
      if (id) {
        this.propertyId = parseInt(id, 10);
        this.loadPropertyDetails();
      } else {
        this.showError('Invalid property ID');
        this.router.navigate(['/client/search-properties']);
      }
    });
    
    this.initializeBookingForm();
  }
  
  // ==========================================================================
  // FORM INITIALIZATION
  // ==========================================================================
  
  private initializeBookingForm(): void {
    this.bookingForm = this.fb.group({
      checkinDate: ['', [Validators.required]],
      checkoutDate: ['', [Validators.required]],
      hasExtraCot: [false],
      hasDeepClean: [false]
    }, { validators: this.dateRangeValidator });
  }
  
  private dateRangeValidator(form: FormGroup) {
    const checkin = form.get('checkinDate')?.value;
    const checkout = form.get('checkoutDate')?.value;
    
    if (checkin && checkout) {
      const checkinDate = new Date(checkin);
      const checkoutDate = new Date(checkout);
      
      if (checkoutDate <= checkinDate) {
        return { invalidDateRange: true };
      }
      
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      if (checkinDate < today) {
        return { pastDate: true };
      }
    }
    
    return null;
  }
  
  // ==========================================================================
  // API CALLS
  // ==========================================================================
  
  loadPropertyDetails(): void {
    if (!this.propertyId) return;
    
    this.isLoading = true;
    this.errorMessage = '';
    
    const url = `${this.API_BASE_URL}/client/viewClickedProperty/${this.propertyId}`;
    
    this.http.get<ApiResponse<PropertyDetails>>(url).subscribe({
      next: (response) => {
        if (response.success && response.data) {
          this.property = response.data;
          this.showSuccess('Property details loaded successfully');
        } else {
          this.showError('Failed to load property details');
        }
        this.isLoading = false;
      },
      error: (error: HttpErrorResponse) => {
        this.handleError('Failed to load property details', error);
        this.isLoading = false;
      }
    });
  }
  
  submitBooking(): void {
    if (this.bookingForm.invalid || !this.property) {
      this.markFormGroupTouched(this.bookingForm);
      return;
    }
    
    this.isBooking = true;
    this.errorMessage = '';
    
    // Get userId from sessionStorage
    const userIdStr = sessionStorage.getItem('userId');
    if (!userIdStr) {
      this.showError('Please login first');
      this.router.navigate(['/home']);
      return;
    }
    
    const userId = parseInt(userIdStr, 10);
    const bookingRequest: BookingRequest = {
      propertyId: this.property.propertyId,
      userId: userId,
      checkinDate: this.bookingForm.value.checkinDate.toISOString().split('T')[0],
      checkoutDate: this.bookingForm.value.checkoutDate.toISOString().split('T')[0],
      hasExtraCot: this.bookingForm.value.hasExtraCot,
      hasDeepClean: this.bookingForm.value.hasDeepClean
    };
    
    const url = `${this.API_BASE_URL}/client/makeBooking`;
    
    this.http.post<ApiResponse<any>>(url, bookingRequest).subscribe({
      next: (response) => {
        if (response.success) {
          this.showSuccess('Booking submitted successfully!');
          this.bookingForm.reset();
          this.showBookingForm = false;
          this.currentStep = 0;
          // Redirect to bookings after a delay
          setTimeout(() => {
            this.router.navigate(['/client/my-bookings']);
          }, 2000);
        } else {
          this.showError('Failed to submit booking');
        }
        this.isBooking = false;
      },
      error: (error: HttpErrorResponse) => {
        this.handleError('Failed to submit booking', error);
        this.isBooking = false;
      }
    });
  }
  
  // ==========================================================================
  // UI METHODS
  // ==========================================================================
  
  openBookingForm(): void {
    this.showBookingForm = true;
    this.bookingForm.reset();
    this.currentStep = 0;
  }
  
  closeBookingForm(): void {
    this.showBookingForm = false;
    this.bookingForm.reset();
    this.currentStep = 0;
    this.errorMessage = '';
  }
  
  nextStep(): void {
    if (this.currentStep < 2) {
      this.currentStep++;
    }
  }
  
  previousStep(): void {
    if (this.currentStep > 0) {
      this.currentStep--;
    }
  }
  
  goBack(): void {
    this.router.navigate(['/client/search-properties']);
  }
  
  // ==========================================================================
  // UTILITY METHODS
  // ==========================================================================
  
  getRatingStars(rating: number): string {
    const fullStars = Math.floor(rating);
    const halfStar = rating % 1 >= 0.5 ? 1 : 0;
    const emptyStars = 5 - fullStars - halfStar;
    
    return '★'.repeat(fullStars) + (halfStar ? '½' : '') + '☆'.repeat(emptyStars);
  }
  
  formatPrice(price: number): string {
    return `₹${price.toLocaleString()}/night`;
  }
  
  calculateNights(checkinDate: string, checkoutDate: string): number {
    const checkin = new Date(checkinDate);
    const checkout = new Date(checkoutDate);
    const diffTime = checkout.getTime() - checkin.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  }
  
  calculateTotalPrice(pricePerDay: number, nights: number): number {
    return pricePerDay * nights;
  }
  
  formatDate(dateString: string | null): string {
    if (!dateString) return '';
    
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      });
    } catch (error) {
      console.error('Error formatting date:', error);
      return dateString;
    }
  }
  
  getDefaultImage(): string {
    return 'assets/images/download.jpg';
  }
  
  handleImageError(event: Event): void {
    console.log('Image load error, using default image');
    const imgElement = event.target as HTMLImageElement;
    imgElement.src = this.getDefaultImage();
  }
  
  getErrorMessage(fieldName: string): string {
    const control = this.bookingForm.get(fieldName);
    
    if (control && control.touched && control.errors) {
      if (control.errors['required']) {
        return `${this.capitalizeFirstLetter(fieldName)} is required.`;
      }
    }
    
    const formErrors = this.bookingForm.errors;
    if (formErrors) {
      if (formErrors['invalidDateRange']) {
        return 'Check-out date must be after check-in date.';
      }
      if (formErrors['pastDate']) {
        return 'Check-in date cannot be in the past.';
      }
    }
    
    return '';
  }
  
  hasError(fieldName: string): boolean {
    const control = this.bookingForm.get(fieldName);
    return !!(control && control.invalid && control.touched);
  }
  
  hasFormError(): boolean {
    return !!(this.bookingForm.errors && this.bookingForm.touched);
  }
  
  private capitalizeFirstLetter(text: string): string {
    if (text === 'checkinDate') return 'Check-in Date';
    if (text === 'checkoutDate') return 'Check-out Date';
    if (text === 'hasExtraCot') return 'Extra Cot';
    if (text === 'hasDeepClean') return 'Deep Clean';
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
      this.errorMessage = 'Unauthorized. Please login again.';
      setTimeout(() => this.router.navigate(['/home']), 2000);
    } else if (error.status === 404) {
      this.errorMessage = 'Property not found.';
      setTimeout(() => this.router.navigate(['/client/search-properties']), 2000);
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
    setTimeout(() => this.successMessage = '', 3000);
  }
}

