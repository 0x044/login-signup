import { Component, OnInit } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTabsModule } from '@angular/material/tabs';
import { MatChipsModule } from '@angular/material/chips';
import { MatMenuModule } from '@angular/material/menu';
import { MatDialogModule } from '@angular/material/dialog';

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

interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
}

// ============================================================================
// COMPONENT
// ============================================================================

@Component({
  selector: 'app-my-bookings',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatTabsModule,
    MatChipsModule,
    MatMenuModule,
    MatDialogModule
  ],
  templateUrl: './my-bookings.component.html',
  styleUrls: ['./my-bookings.component.css']
})
export class MyBookingsComponent implements OnInit {
  
  // ==========================================================================
  // PROPERTIES
  // ==========================================================================
  
  private readonly API_BASE_URL = 'http://localhost:8080/v1/api';
  
  // Data
  allBookings: BookingResponse[] = [];
  upcomingBookings: BookingResponse[] = [];
  pastBookings: BookingResponse[] = [];
  currentBookings: BookingResponse[] = [];
  
  // UI state
  isLoading = false;
  activeTab = 'upcoming';
  selectedBooking: BookingResponse | null = null;
  showBookingDetails = false;
  
  // Messages
  errorMessage = '';
  successMessage = '';
  
  // Current date for comparison
  currentDate: Date = new Date();
  
  // ==========================================================================
  // CONSTRUCTOR
  // ==========================================================================
  
  constructor(
    private http: HttpClient,
    public router: Router
  ) {}
  
  // ==========================================================================
  // LIFECYCLE HOOKS
  // ==========================================================================
  
  ngOnInit(): void {
    this.loadBookings();
  }
  
  // ==========================================================================
  // API CALLS
  // ==========================================================================
  
  loadBookings(): void {
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
          this.allBookings = response.data;
          this.processBookings();
          this.showSuccess('Bookings loaded successfully');
        } else {
          this.showError('Failed to load bookings');
        }
        this.isLoading = false;
      },
      error: (error: HttpErrorResponse) => {
        this.handleError('Failed to load bookings', error);
        this.isLoading = false;
      }
    });
  }
  
  // ==========================================================================
  // DATA PROCESSING
  // ==========================================================================
  
  private processBookings(): void {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    this.upcomingBookings = [];
    this.pastBookings = [];
    this.currentBookings = [];
    
    this.allBookings.forEach((booking) => {
      const checkinDate = new Date(booking.checkinDate);
      const checkoutDate = new Date(booking.checkoutDate);
      checkinDate.setHours(0, 0, 0, 0);
      checkoutDate.setHours(0, 0, 0, 0);
      
      if (booking.isBookingStatus === 'CONFIRMED' || booking.isBookingStatus === 'PENDING') {
        if (checkinDate > today) {
          // Future booking
          this.upcomingBookings.push(booking);
        } else if (checkinDate <= today && checkoutDate >= today) {
          // Current booking (check-in today or past, check-out today or future)
          this.currentBookings.push(booking);
        } else {
          // Past booking
          this.pastBookings.push(booking);
        }
      } else {
        // Completed, cancelled, etc.
        this.pastBookings.push(booking);
      }
    });
    
    // Sort upcoming bookings by check-in date (earliest first)
    this.upcomingBookings.sort((a, b) => 
      new Date(a.checkinDate).getTime() - new Date(b.checkinDate).getTime()
    );
    
    // Sort past bookings by check-in date (latest first)
    this.pastBookings.sort((a, b) => 
      new Date(b.checkinDate).getTime() - new Date(a.checkinDate).getTime()
    );
    
    // Sort current bookings by check-in date (earliest first)
    this.currentBookings.sort((a, b) => 
      new Date(a.checkinDate).getTime() - new Date(b.checkinDate).getTime()
    );
  }
  
  // ==========================================================================
  // TAB MANAGEMENT
  // ==========================================================================
  
  onTabChange(event: any): void {
    this.activeTab = event.index === 0 ? 'upcoming' : 
                    event.index === 1 ? 'current' : 'past';
  }
  
  getBookingsForCurrentTab(): BookingResponse[] {
    switch (this.activeTab) {
      case 'upcoming':
        return this.upcomingBookings;
      case 'current':
        return this.currentBookings;
      case 'past':
        return this.pastBookings;
      default:
        return [];
    }
  }
  
  // ==========================================================================
  // BOOKING ACTIONS
  // ==========================================================================
  
  viewBookingDetails(booking: BookingResponse): void {
    this.selectedBooking = booking;
    this.showBookingDetails = true;
  }
  
  closeBookingDetails(): void {
    this.selectedBooking = null;
    this.showBookingDetails = false;
  }
  
  cancelBooking(booking: BookingResponse): void {
    if (!confirm('Are you sure you want to cancel this booking?')) {
      return;
    }
    
    // TODO: Implement cancel booking API call
    this.showSuccess('Booking cancellation feature coming soon');
  }
  
  modifyBooking(booking: BookingResponse): void {
    // TODO: Implement modify booking functionality
    this.showSuccess('Booking modification feature coming soon');
  }
  
  addReview(booking: BookingResponse): void {
    // TODO: Implement add review functionality
    this.showSuccess('Review feature coming soon');
  }
  
  // ==========================================================================
  // NAVIGATION
  // ==========================================================================
  
  goBack(): void {
    this.router.navigate(['/client/dashboard']);
  }
  
  viewPropertyDetails(propertyId: number): void {
    this.router.navigate(['/client/property-details', propertyId]);
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
        month: 'short',
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
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch (error) {
      console.error('Error formatting datetime:', error);
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
  
  calculateNights(checkinDate: string, checkoutDate: string): number {
    const checkin = new Date(checkinDate);
    const checkout = new Date(checkoutDate);
    const diffTime = checkout.getTime() - checkin.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  }
  
  isBookingActionable(booking: BookingResponse): boolean {
    const today = new Date();
    const checkinDate = new Date(booking.checkinDate);
    const checkoutDate = new Date(booking.checkoutDate);
    
    return booking.isBookingStatus === 'CONFIRMED' && 
           checkinDate > today && 
           checkoutDate > today;
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
      this.errorMessage = 'No bookings found.';
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

