import { Component, OnInit } from "@angular/core";
import { HttpClient, HttpErrorResponse } from "@angular/common/http";
import { Router } from "@angular/router";
import { CommonModule } from "@angular/common";

// ========================================
// INTERFACES
// ========================================

interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
}

interface UserProfile {
  userId: number;
  username: string;
  userMail: string;
  userPhone: string;
  userAddress: string;
  userRole: string;
  userStatus: string;
}

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

interface DashboardStats {
  totalBookings: number;
  upcomingBookings: number;
  pastBookings: number;
  completedBookings: number;
  cancelledBookings: number;
  activeComplaints: number;
  resolvedComplaints: number;
}

// ========================================
// COMPONENT
// ========================================

@Component({
  selector: "app-client-dashboard",
  standalone: true,
  imports: [CommonModule],
  templateUrl: "./client-dashboard.component.html",
  styleUrls: ["./client-dashboard.component.css"],
})
export class ClientDashboardComponent implements OnInit {
  // ========================================
  // PROPERTIES
  // ========================================

  private readonly API_BASE_URL = "http://localhost:8080/v1/api";

  // User Data
  userId: number = 0;
  userProfile: UserProfile | null = null;

  // Bookings Data
  allBookings: BookingResponse[] = [];
  upcomingBookings: BookingResponse[] = [];
  pastBookings: BookingResponse[] = [];
  recentBookings: BookingResponse[] = [];

  // Complaints Data
  allComplaints: ComplaintResponse[] = [];
  activeComplaints: ComplaintResponse[] = [];

  // Dashboard Stats
  stats: DashboardStats = {
    totalBookings: 0,
    upcomingBookings: 0,
    pastBookings: 0,
    completedBookings: 0,
    cancelledBookings: 0,
    activeComplaints: 0,
    resolvedComplaints: 0,
  };

  // UI State
  loading = {
    profile: false,
    bookings: false,
    complaints: false,
    logout: false,
  };

  errorMessage: string = "";
  successMessage: string = "";

  // Current date for comparison
  currentDate: Date = new Date();

  // ========================================
  // CONSTRUCTOR
  // ========================================

  constructor(
    private http: HttpClient,
    private router: Router,
  ) {
    console.log("ClientDashboardComponent initialized");
  }

  // ========================================
  // LIFECYCLE HOOKS
  // ========================================

  ngOnInit(): void {
    console.log("ngOnInit called");
    this.initializeDashboard();
  }

  // ========================================
  // INITIALIZATION
  // ========================================

  private initializeDashboard(): void {
    console.log("Initializing dashboard...");

    // Get userId from sessionStorage
    const userIdStr = sessionStorage.getItem("userId");

    if (!userIdStr) {
      console.error("No userId found in sessionStorage");
      this.showError("Please login first");
      this.router.navigate(["/login"]);
      return;
    }

    this.userId = parseInt(userIdStr, 10);
    console.log("UserId from session:", this.userId);

    // Load all dashboard data
    this.loadAllDashboardData();
  }

  private loadAllDashboardData(): void {
    console.log("Loading all dashboard data...");
    this.loadUserProfile();
    this.loadBookings();
    this.loadComplaints();
  }

  // ========================================
  // API CALLS
  // ========================================

  // Load User Profile
  private loadUserProfile(): void {
    console.log("Loading user profile...");
    this.loading.profile = true;
    this.errorMessage = "";

    const url = `${this.API_BASE_URL}/user/viewProfile/${this.userId}`;
    console.log("Profile API URL:", url);

    this.http.get<ApiResponse<UserProfile>>(url).subscribe({
      next: (response) => {
        console.log("Profile API Response:", response);

        if (response.success && response.data) {
          this.userProfile = response.data;
          console.log("User profile loaded:", this.userProfile);
        } else {
          console.error("Invalid profile response:", response);
          this.showError("Failed to load profile");
        }

        this.loading.profile = false;
      },
      error: (error: HttpErrorResponse) => {
        console.error("Profile API Error:", error);
        this.handleError(error, "loading profile");
        this.loading.profile = false;
      },
    });
  }

  // Load Bookings
  private loadBookings(): void {
    console.log("Loading bookings...");
    this.loading.bookings = true;
    this.errorMessage = "";

    const url = `${this.API_BASE_URL}/client/viewBooking/${this.userId}`;
    console.log("Bookings API URL:", url);

    this.http.get<ApiResponse<BookingResponse[]>>(url).subscribe({
      next: (response) => {
        console.log("Bookings API Response:", response);

        if (response.success && response.data) {
          this.allBookings = response.data;
          console.log("Total bookings loaded:", this.allBookings.length);

          // Process bookings
          this.processBookings();
          this.calculateBookingStats();
        } else {
          console.warn("No bookings found or invalid response:", response);
          this.allBookings = [];
        }

        this.loading.bookings = false;
      },
      error: (error: HttpErrorResponse) => {
        console.error("Bookings API Error:", error);
        this.handleError(error, "loading bookings");
        this.allBookings = [];
        this.loading.bookings = false;
      },
    });
  }

  // Load Complaints
  private loadComplaints(): void {
    console.log("Loading complaints...");
    this.loading.complaints = true;
    this.errorMessage = "";

    const url = `${this.API_BASE_URL}/user/viewComplaints/${this.userId}`;
    console.log("Complaints API URL:", url);

    this.http.get<ApiResponse<ComplaintResponse[]>>(url).subscribe({
      next: (response) => {
        console.log("Complaints API Response:", response);

        if (response.success && response.data) {
          this.allComplaints = response.data;
          console.log("Total complaints loaded:", this.allComplaints.length);

          // Process complaints
          this.processComplaints();
          this.calculateComplaintStats();
        } else {
          console.warn("No complaints found or invalid response:", response);
          this.allComplaints = [];
        }

        this.loading.complaints = false;
      },
      error: (error: HttpErrorResponse) => {
        console.error("Complaints API Error:", error);
        this.handleError(error, "loading complaints");
        this.allComplaints = [];
        this.loading.complaints = false;
      },
    });
  }

  // Logout
  logout(): void {
    console.log("Logout initiated...");
    this.loading.logout = true;
    this.errorMessage = "";

    const url = `${this.API_BASE_URL}/user/logoutUser/${this.userId}`;
    console.log("Logout API URL:", url);

    this.http.post<ApiResponse<string>>(url, {}).subscribe({
      next: (response) => {
        console.log("Logout API Response:", response);

        // Clear session data
        sessionStorage.clear();
        console.log("Session cleared");

        this.showSuccess("Logged out successfully");

        // Navigate to login
        setTimeout(() => {
          this.router.navigate(["/login"]);
        }, 1000);
      },
      error: (error: HttpErrorResponse) => {
        console.error("Logout API Error:", error);

        // Even if logout API fails, clear session and redirect
        sessionStorage.clear();
        console.log("Session cleared despite error");

        this.router.navigate(["/login"]);
      },
      complete: () => {
        this.loading.logout = false;
      },
    });
  }

  // ========================================
  // DATA PROCESSING
  // ========================================

  private processBookings(): void {
    console.log("Processing bookings...");

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    this.upcomingBookings = [];
    this.pastBookings = [];

    this.allBookings.forEach((booking) => {
      const checkinDate = new Date(booking.checkinDate);
      checkinDate.setHours(0, 0, 0, 0);

      // Only consider CONFIRMED or PENDING bookings for upcoming
      if (
        (booking.isBookingStatus === "CONFIRMED" ||
          booking.isBookingStatus === "PENDING") &&
        checkinDate >= today
      ) {
        this.upcomingBookings.push(booking);
      } else {
        this.pastBookings.push(booking);
      }
    });

    // Sort upcoming bookings by check-in date (earliest first)
    this.upcomingBookings.sort(
      (a, b) =>
        new Date(a.checkinDate).getTime() - new Date(b.checkinDate).getTime(),
    );

    // Sort past bookings by check-in date (latest first)
    this.pastBookings.sort(
      (a, b) =>
        new Date(b.checkinDate).getTime() - new Date(a.checkinDate).getTime(),
    );

    // Get recent bookings (latest 5)
    this.recentBookings = [...this.allBookings]
      .sort(
        (a, b) =>
          new Date(b.checkinDate).getTime() - new Date(a.checkinDate).getTime(),
      )
      .slice(0, 5);

    console.log("Upcoming bookings:", this.upcomingBookings.length);
    console.log("Past bookings:", this.pastBookings.length);
    console.log("Recent bookings:", this.recentBookings.length);
  }

  private calculateBookingStats(): void {
    console.log("Calculating booking stats...");

    this.stats.totalBookings = this.allBookings.length;
    this.stats.upcomingBookings = this.upcomingBookings.length;
    this.stats.pastBookings = this.pastBookings.length;

    this.stats.completedBookings = this.allBookings.filter(
      (b) => b.isBookingStatus === "COMPLETED",
    ).length;

    this.stats.cancelledBookings = this.allBookings.filter(
      (b) => b.isBookingStatus === "CANCELLED",
    ).length;

    console.log("Booking stats calculated:", this.stats);
  }

  private processComplaints(): void {
    console.log("Processing complaints...");

    this.activeComplaints = this.allComplaints.filter(
      (c) => c.complaintStatus !== "RESOLVED" && c.complaintStatus !== "CLOSED",
    );

    console.log("Active complaints:", this.activeComplaints.length);
  }

  private calculateComplaintStats(): void {
    console.log("Calculating complaint stats...");

    this.stats.activeComplaints = this.activeComplaints.length;

    this.stats.resolvedComplaints = this.allComplaints.filter(
      (c) => c.complaintStatus === "RESOLVED" || c.complaintStatus === "CLOSED",
    ).length;

    console.log("Complaint stats calculated:", this.stats);
  }

  // ========================================
  // NAVIGATION METHODS
  // ========================================

  navigateToSearchProperties(): void {
    console.log("Navigating to search properties...");
    this.router.navigate(["/client/search-properties"]);
  }

  navigateToMyBookings(): void {
    console.log("Navigating to my bookings...");
    this.router.navigate(["/client/my-bookings"]);
  }

  navigateToMyComplaints(): void {
    console.log("Navigating to my complaints...");
    this.router.navigate(["/client/my-complaints"]);
  }

  navigateToProfile(): void {
    console.log("Navigating to profile...");
    this.router.navigate(["/user/profile"]);
  }

  viewBookingDetails(bookingId: number): void {
    console.log("Viewing booking details:", bookingId);
    this.router.navigate(["/client/booking-details", bookingId]);
  }

  viewPropertyDetails(propertyId: number): void {
    console.log("Viewing property details:", propertyId);
    this.router.navigate(["/client/property-details", propertyId]);
  }

  // ========================================
  // UTILITY METHODS
  // ========================================

  getBookingStatusClass(status: string): string {
    const statusClasses: { [key: string]: string } = {
      CONFIRMED: "status-confirmed",
      PENDING: "status-pending",
      CANCELLED: "status-cancelled",
      COMPLETED: "status-completed",
    };
    return statusClasses[status] || "status-default";
  }

  getComplaintStatusClass(status: string): string {
    const statusClasses: { [key: string]: string } = {
      PENDING: "complaint-pending",
      ACTIVE: "complaint-active",
      IN_PROGRESS: "complaint-progress",
      RESOLVED: "complaint-resolved",
      CLOSED: "complaint-closed",
    };
    return statusClasses[status] || "complaint-default";
  }

  formatDate(dateString: string): string {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
      });
    } catch (error) {
      console.error("Error formatting date:", error);
      return dateString;
    }
  }

  formatDateTime(dateString: string): string {
    try {
      const date = new Date(dateString);
      return date.toLocaleString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch (error) {
      console.error("Error formatting datetime:", error);
      return dateString;
    }
  }

  getDefaultImage(): string {
    return "assets/images/download.jpg";
  }

  // ✅ FIXED: Added image error handler
  handleImageError(event: Event): void {
    console.log("Image load error, using default image");
    const imgElement = event.target as HTMLImageElement;
    imgElement.src = this.getDefaultImage();
  }

  // ========================================
  // ERROR HANDLING
  // ========================================

  private handleError(error: HttpErrorResponse, operation: string): void {
    console.error(`Error ${operation}:`, error);

    let errorMsg = `Error ${operation}`;

    if (error.error instanceof ErrorEvent) {
      // Client-side error
      errorMsg = `Client Error: ${error.error.message}`;
      console.error("Client-side error:", error.error.message);
    } else {
      // Server-side error
      console.error("Server-side error:", {
        status: error.status,
        message: error.message,
        body: error.error,
      });

      if (error.status === 0) {
        errorMsg =
          "Cannot connect to server. Please check if the backend is running.";
      } else if (error.status === 401) {
        errorMsg = "Unauthorized. Please login again.";
        setTimeout(() => this.router.navigate(["/login"]), 2000);
      } else if (error.status === 403) {
        errorMsg = "Access forbidden.";
      } else if (error.status === 404) {
        errorMsg = "Resource not found.";
      } else if (error.status === 500) {
        errorMsg = "Server error. Please try again later.";
      } else if (error.error?.message) {
        errorMsg = error.error.message;
      } else {
        errorMsg = `Error: ${error.message}`;
      }
    }

    this.showError(errorMsg);
  }

  private showError(message: string): void {
    this.errorMessage = message;
    this.successMessage = "";
    console.error("Error displayed:", message);

    // Auto-hide after 5 seconds
    setTimeout(() => {
      this.errorMessage = "";
    }, 5000);
  }

  private showSuccess(message: string): void {
    this.successMessage = message;
    this.errorMessage = "";
    console.log("Success displayed:", message);

    // Auto-hide after 3 seconds
    setTimeout(() => {
      this.successMessage = "";
    }, 3000);
  }

  // ========================================
  // REFRESH DATA
  // ========================================

  refreshDashboard(): void {
    console.log("Refreshing dashboard...");
    this.loadAllDashboardData();
    this.showSuccess("Dashboard refreshed successfully");
  }
}
