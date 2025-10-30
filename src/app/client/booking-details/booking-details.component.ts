import { Component, OnInit } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Router, ActivatedRoute } from '@angular/router';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatChipsModule } from '@angular/material/chips';
import { MatDividerModule } from '@angular/material/divider';

// ============================================================================
// INTERFACES
// ============================================================================

interface BookingResponse {
  bookingId: number;
  propertyId: number;
  propertyName: string;
  propertyImage: string;
  city: string;
  userId: number;
  username: string;
  checkinDate: string;
  checkoutDate: string;
  isPaymentStatus: boolean;
  isBookingStatus: string;
  hasExtraCot: boolean;
  hasDeepClean: boolean;
}

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

interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
}

// ============================================================================
// COMPONENT
// ============================================================================

@Component({
  selector: 'app-booking-details',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatChipsModule,
    MatDividerModule
  ],
  templateUrl: './booking-details.component.html',
  styleUrls: ['./booking-details.component.css']
})
export class BookingDetailsComponent implements OnInit {
  
  // ==========================================================================
  // PROPERTIES
  // ==========================================================================
  
  private readonly API_BASE_URL = 'http://localhost:8080/v1/api';
  
  // Data
  booking: BookingResponse | null = null;
  propertyDetails: PropertyDetails | null = null;
  bookingId: number | null = null;
  
  // UI state
  isLoading = false;
  isPropertyLoading = false;
  
  // Messages
  errorMessage = '';
  successMessage = '';
  
  // ==========================================================================
  // CONSTRUCTOR
  // ==========================================================================
  
  constructor(
    private http: HttpClient,
    private router: Router,
    private route: ActivatedRoute
  ) {}
  
  // ==========================================================================
  // LIFECYCLE HOOKS
  // ==========================================================================
  
  ngOnInit(): void {
    this.route.paramMap.subscribe(params => {
      const id = params.get('id');
      if (id) {
        this.bookingId = parseInt(id, 10);
        this.loadBookingDetails();
      } else {
        this.showError('Invalid booking ID');
        this.router.navigate(['/client/my-bookings']);
      }
    });
  }
  
  // ==========================================================================
  // API CALLS
  // ==========================================================================
  
  loadBookingDetails(): void {
    if (!this.bookingId) return;
    
    this.isLoading = true;
    this.errorMessage = '';
    
    // Get userId from sessionStorage
    const userIdStr = sessionStorage.getItem('userId');
    if (!userIdStr) {
      this.showError('Please login first');
      this.router.navigate(['/home']);
      return;
    }
    
    const userId = parseInt(userIdStr, 10);
    const url = `${this.API_BASE_URL}/client/viewBooking/${userId}`;
    
    this.http.get<ApiResponse<BookingResponse[]>>(url).subscribe({
      next: (response) => {
        if (response.success && response.data) {
          const booking = response.data.find(b => b.bookingId === this.bookingId);
          if (booking) {
            this.booking = booking;
            this.loadPropertyDetails(booking.propertyId);
          } else {
            this.showError('Booking not found');
            this.router.navigate(['/client/my-bookings']);
          }
        } else {
          this.showError('Failed to load booking details');
        }
        this.isLoading = false;
      },
      error: (error: HttpErrorResponse) => {
        this.handleError('Failed to load booking details', error);
        this.isLoading = false;
      }
    });
  }
  
  loadPropertyDetails(propertyId: number): void {
    this.isPropertyLoading = true;
    
    const url = `${this.API_BASE_URL}/client/viewClickedProperty/${propertyId}`;
    
    this.http.get<ApiResponse<PropertyDetails>>(url).subscribe({
      next: (response) => {
        if (response.success && response.data) {
          this.propertyDetails = response.data;
        } else {
          console.warn('Failed to load property details');
        }
        this.isPropertyLoading = false;
      },
      error: (error: HttpErrorResponse) => {
        console.error('Failed to load property details:', error);
        this.isPropertyLoading = false;
      }
    });
  }
  
  // ==========================================================================
  // NAVIGATION
  // ==========================================================================
  
  goBack(): void {
    this.router.navigate(['/client/my-bookings']);
  }
  
  viewPropertyDetails(): void {
    if (this.booking) {
      this.router.navigate(['/client/property-details', this.booking.propertyId]);
    }
  }
  
  // ==========================================================================
  // UTILITY METHODS
  // ==========================================================================
  
  getBookingStatusClass(status: string): string {
    const statusClasses: { [key: string]: string } = {
      'CONFIRMED': 'status-confirmed',
      'PENDING': 'status-pending',
      'CANCELLED': 'status-cancelled',
      'COMPLETED': 'status-completed'
    };
    return statusClasses[status] || 'status-default';
  }
  
  getBookingStatusIcon(status: string): string {
    const statusIcons: { [key: string]: string } = {
      'CONFIRMED': 'check_circle',
      'PENDING': 'schedule',
      'CANCELLED': 'cancel',
      'COMPLETED': 'done_all'
    };
    return statusIcons[status] || 'help';
  }
  
  getPaymentStatusClass(isPaid: boolean): string {
    return isPaid ? 'payment-paid' : 'payment-pending';
  }
  
  getPaymentStatusText(isPaid: boolean): string {
    return isPaid ? 'Paid' : 'Pending';
  }
  
  formatDate(dateString: string): string {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    } catch (error) {
      console.error('Error formatting date:', error);
      return dateString;
    }
  }
  
  formatDateTime(dateString: string): string {
    try {
      const date = new Date(dateString);
      return date.toLocaleString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch (error) {
      console.error('Error formatting datetime:', error);
      return dateString;
    }
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
  
  getDefaultImage(): string {
    return 'assets/images/download.jpg';
  }
  
  handleImageError(event: Event): void {
    console.log('Image load error, using default image');
    const imgElement = event.target as HTMLImageElement;
    imgElement.src = this.getDefaultImage();
  }
  
  getRatingStars(rating: number): string {
    const fullStars = Math.floor(rating);
    const halfStar = rating % 1 >= 0.5 ? 1 : 0;
    const emptyStars = 5 - fullStars - halfStar;
    
    return '★'.repeat(fullStars) + (halfStar ? '½' : '') + '☆'.repeat(emptyStars);
  }
  
  formatPrice(price: number): string {
    return `₹${price.toLocaleString()}`;
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
      this.errorMessage = 'Booking not found.';
      setTimeout(() => this.router.navigate(['/client/my-bookings']), 2000);
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

