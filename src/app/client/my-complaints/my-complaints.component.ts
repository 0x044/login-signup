import { Component, OnInit } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule, FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTabsModule } from '@angular/material/tabs';
import { MatChipsModule } from '@angular/material/chips';
import { MatMenuModule } from '@angular/material/menu';
import { MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatExpansionModule } from '@angular/material/expansion';

// ============================================================================
// INTERFACES
// ============================================================================

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

interface ComplaintRequest {
  userId: number;
  bookingId: number;
  complaintDescription: string;
  complaintType: string;
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
  selector: 'app-my-complaints',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatTabsModule,
    MatChipsModule,
    MatMenuModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatExpansionModule
  ],
  templateUrl: './my-complaints.component.html',
  styleUrls: ['./my-complaints.component.css']
})
export class MyComplaintsComponent implements OnInit {
  
  // ==========================================================================
  // PROPERTIES
  // ==========================================================================
  
  private readonly API_BASE_URL = 'http://localhost:8080/v1/api';
  
  // Data
  allComplaints: ComplaintResponse[] = [];
  activeComplaints: ComplaintResponse[] = [];
  resolvedComplaints: ComplaintResponse[] = [];
  
  // UI state
  isLoading = false;
  isSubmitting = false;
  activeTab = 'active';
  showComplaintForm = false;
  selectedComplaint: ComplaintResponse | null = null;
  showComplaintDetails = false;
  
  // Messages
  errorMessage = '';
  successMessage = '';
  
  // Forms
  complaintForm!: FormGroup;
  
  // Complaint types
  complaintTypes = [
    { value: 'PROPERTY', label: 'Property Issue', icon: 'home' },
    { value: 'BOOKING', label: 'Booking Problem', icon: 'event' },
    { value: 'PAYMENT', label: 'Payment Issue', icon: 'payment' },
    { value: 'USER', label: 'User Behavior', icon: 'person' },
    { value: 'OTHER', label: 'Other', icon: 'help' }
  ];
  
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
    this.initializeComplaintForm();
    this.loadComplaints();
  }
  
  // ==========================================================================
  // FORM INITIALIZATION
  // ==========================================================================
  
  private initializeComplaintForm(): void {
    this.complaintForm = this.fb.group({
      complaintType: ['PROPERTY', [Validators.required]],
      complaintDescription: ['', [Validators.required, Validators.minLength(10), Validators.maxLength(500)]],
      bookingId: [null]
    });
  }
  
  // ==========================================================================
  // API CALLS
  // ==========================================================================
  
  loadComplaints(): void {
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
    const url = `${this.API_BASE_URL}/user/viewComplaints/${userId}`;
    
    this.http.get<ApiResponse<ComplaintResponse[]>>(url).subscribe({
      next: (response) => {
        if (response.success && response.data) {
          this.allComplaints = response.data;
          this.processComplaints();
          this.showSuccess('Complaints loaded successfully');
        } else {
          this.showError('Failed to load complaints');
        }
        this.isLoading = false;
      },
      error: (error: HttpErrorResponse) => {
        this.handleError('Failed to load complaints', error);
        this.isLoading = false;
      }
    });
  }
  
  submitComplaint(): void {
    if (this.complaintForm.invalid) {
      this.markFormGroupTouched(this.complaintForm);
      return;
    }
    
    this.isSubmitting = true;
    this.errorMessage = '';
    
    // Get userId from sessionStorage
    const userIdStr = sessionStorage.getItem('userId');
    if (!userIdStr) {
      this.showError('Please login first');
      this.router.navigate(['/home']);
      return;
    }
    
    const userId = parseInt(userIdStr, 10);
    const complaintRequest: ComplaintRequest = {
      userId: userId,
      bookingId: this.complaintForm.value.bookingId,
      complaintDescription: this.complaintForm.value.complaintDescription,
      complaintType: this.complaintForm.value.complaintType
    };
    
    const url = `${this.API_BASE_URL}/client/addComplaintForBooking`;
    
    this.http.post<ApiResponse<ComplaintResponse>>(url, complaintRequest).subscribe({
      next: (response) => {
        if (response.success && response.data) {
          this.showSuccess('Complaint submitted successfully');
          this.complaintForm.reset();
          this.showComplaintForm = false;
          this.loadComplaints();
        } else {
          this.showError('Failed to submit complaint');
        }
        this.isSubmitting = false;
      },
      error: (error: HttpErrorResponse) => {
        this.handleError('Failed to submit complaint', error);
        this.isSubmitting = false;
      }
    });
  }
  
  // ==========================================================================
  // DATA PROCESSING
  // ==========================================================================
  
  private processComplaints(): void {
    this.activeComplaints = this.allComplaints.filter(
      complaint => complaint.complaintStatus !== 'RESOLVED' && complaint.complaintStatus !== 'CLOSED'
    );
    
    this.resolvedComplaints = this.allComplaints.filter(
      complaint => complaint.complaintStatus === 'RESOLVED' || complaint.complaintStatus === 'CLOSED'
    );
    
    // Sort by date (newest first)
    this.activeComplaints.sort((a, b) => 
      new Date(b.complaintDate).getTime() - new Date(a.complaintDate).getTime()
    );
    
    this.resolvedComplaints.sort((a, b) => 
      new Date(b.complaintDate).getTime() - new Date(a.complaintDate).getTime()
    );
  }
  
  // ==========================================================================
  // TAB MANAGEMENT
  // ==========================================================================
  
  onTabChange(event: any): void {
    this.activeTab = event.index === 0 ? 'active' : 'resolved';
  }
  
  getComplaintsForCurrentTab(): ComplaintResponse[] {
    return this.activeTab === 'active' ? this.activeComplaints : this.resolvedComplaints;
  }
  
  // ==========================================================================
  // COMPLAINT ACTIONS
  // ==========================================================================
  
  openComplaintForm(): void {
    this.showComplaintForm = true;
    this.complaintForm.reset();
    this.complaintForm.patchValue({
      complaintType: 'PROPERTY'
    });
  }
  
  closeComplaintForm(): void {
    this.showComplaintForm = false;
    this.complaintForm.reset();
    this.errorMessage = '';
  }
  
  viewComplaintDetails(complaint: ComplaintResponse): void {
    this.selectedComplaint = complaint;
    this.showComplaintDetails = true;
  }
  
  closeComplaintDetails(): void {
    this.selectedComplaint = null;
    this.showComplaintDetails = false;
  }
  
  // ==========================================================================
  // NAVIGATION
  // ==========================================================================
  
  goBack(): void {
    this.router.navigate(['/client/dashboard']);
  }
  
  // ==========================================================================
  // UTILITY METHODS
  // ==========================================================================
  
  getComplaintStatusClass(status: string): string {
    const statusClasses: { [key: string]: string } = {
      'PENDING': 'status-pending',
      'ACTIVE': 'status-active',
      'IN_PROGRESS': 'status-progress',
      'RESOLVED': 'status-resolved',
      'CLOSED': 'status-closed'
    };
    return statusClasses[status] || 'status-default';
  }
  
  getComplaintStatusIcon(status: string): string {
    const statusIcons: { [key: string]: string } = {
      'PENDING': 'schedule',
      'ACTIVE': 'warning',
      'IN_PROGRESS': 'hourglass_empty',
      'RESOLVED': 'check_circle',
      'CLOSED': 'done_all'
    };
    return statusIcons[status] || 'help';
  }
  
  getComplaintTypeIcon(type: string): string {
    const typeIcon = this.complaintTypes.find(t => t.value === type);
    return typeIcon ? typeIcon.icon : 'help';
  }
  
  getComplaintTypeLabel(type: string): string {
    const typeLabel = this.complaintTypes.find(t => t.value === type);
    return typeLabel ? typeLabel.label : type;
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
  
  getErrorMessage(fieldName: string): string {
    const control = this.complaintForm.get(fieldName);
    
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
    }
    
    return '';
  }
  
  hasError(fieldName: string): boolean {
    const control = this.complaintForm.get(fieldName);
    return !!(control && control.invalid && control.touched);
  }
  
  private capitalizeFirstLetter(text: string): string {
    if (text === 'complaintDescription') return 'Complaint Description';
    if (text === 'complaintType') return 'Complaint Type';
    if (text === 'bookingId') return 'Booking ID';
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
      this.errorMessage = 'No complaints found.';
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

