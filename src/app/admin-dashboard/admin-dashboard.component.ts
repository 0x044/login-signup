import { Component, OnInit } from "@angular/core";
import { HttpClient, HttpHeaders } from "@angular/common/http";
import { CommonModule } from "@angular/common";
import { FormsModule } from "@angular/forms";
import { AuthService } from "../auth.service";

interface User {
  userId: number;
  username: string;
  userMail: string;
  userPhone: string;
  userAddress: string;
  userRole: string;
  userStatus: string;
}

interface Property {
  propertyId: number;
  propertyName: string;
  propertyDescription: string;
  noOfRooms: number;
  noOfBathrooms: number;
  maxNoOfGuests: number;
  pricePerDay: number;
  imageURL: string;
  city: string;
  state: string;
  country: string;
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

interface Booking {
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

interface Complaint {
  complaintId: number;
  userId: number;
  username: string;
  bookingId: number;
  complaintDescription: string;
  complaintStatus: string;
  complaintType: string;
  complaintDate: string;
}

@Component({
  selector: "app-admin-dashboard",
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: "./admin-dashboard.component.html",
  styleUrls: ["./admin-dashboard.component.css"],
})
export class AdminDashboardComponent implements OnInit {
  private apiUrl = "http://localhost:8080/v1/api/admin";

  activeTab: string = "users";

  // Users
  users: User[] = [];
  allUsers: User[] = [];
  selectedUserStatus: string = "ALL";

  // Properties
  properties: Property[] = [];

  // Bookings
  bookings: Booking[] = [];

  // Complaints
  complaints: Complaint[] = [];

  // Modals
  showBlockUserModal: boolean = false;
  showRatingModal: boolean = false;
  showComplaintStatusModal: boolean = false;

  // Forms
  blockUserForm = {
    userId: 0,
    userStatus: "BLOCKED",
  };

  ratingForm = {
    bookingId: 0,
    rating: 5.0,
  };

  complaintStatusForm = {
    complaintId: 0,
    status: "IN_PROGRESS",
  };

  // Statistics
  stats = {
    totalUsers: 0,
    activeUsers: 0,
    blockedUsers: 0,
    totalProperties: 0,
    availableProperties: 0,
    totalBookings: 0,
    confirmedBookings: 0,
    totalComplaints: 0,
    pendingComplaints: 0,
  };

  // Messages
  successMessage: string = "";
  errorMessage: string = "";

  // Search/Filter
  searchTerm: string = "";

  constructor(
    private http: HttpClient,
    private authService: AuthService,
  ) {}

  ngOnInit(): void {
    this.loadDashboardData();
  }

  // ==================== LOGOUT ====================
  logout(): void {
    this.authService.logout();
  }

  // ==================== LOAD DASHBOARD DATA ====================
  loadDashboardData(): void {
    this.loadUsers();
    this.loadProperties();
    this.loadBookings();
    this.loadComplaints();
  }

  // ==================== TAB NAVIGATION ====================
  switchTab(tab: string): void {
    this.activeTab = tab;
    this.clearMessages();
    this.searchTerm = "";

    // Reload data when switching tabs
    switch (tab) {
      case "users":
        this.loadUsers();
        break;
      case "properties":
        this.loadProperties();
        break;
      case "bookings":
        this.loadBookings();
        break;
      case "complaints":
        this.loadComplaints();
        break;
    }
  }

  // ==================== API 3: VIEW ALL USERS ====================
  loadUsers(): void {
    const headers = new HttpHeaders({ "Content-Type": "application/json" });

    this.http.get<any>(`${this.apiUrl}/viewAllUsers`, { headers }).subscribe({
      next: (response) => {
        if (response.success) {
          this.allUsers = response.data;
          this.users = this.allUsers;
          this.calculateUserStats();
          this.showSuccess("Users loaded successfully");
        }
      },
      error: (error) => {
        this.showError(
          "Failed to load users: " + (error.error?.message || error.message),
        );
      },
    });
  }

  // ==================== API 4: VIEW USERS BY STATUS ====================
  filterUsersByStatus(): void {
    if (this.selectedUserStatus === "ALL") {
      this.users = this.allUsers;
      return;
    }

    const headers = new HttpHeaders({ "Content-Type": "application/json" });

    this.http
      .get<any>(
        `${this.apiUrl}/viewUserBasedOnStatus?status=${this.selectedUserStatus}`,
        { headers },
      )
      .subscribe({
        next: (response) => {
          if (response.success) {
            this.users = response.data;
            this.showSuccess(
              `Filtered users by status: ${this.selectedUserStatus}`,
            );
          }
        },
        error: (error) => {
          this.showError(
            "Failed to filter users: " +
              (error.error?.message || error.message),
          );
        },
      });
  }

  // ==================== API 1: BLOCK USER ====================
  openBlockUserModal(user: User): void {
    this.blockUserForm.userId = user.userId;
    this.blockUserForm.userStatus =
      user.userStatus === "ACTIVE" ? "BLOCKED" : "ACTIVE";
    this.showBlockUserModal = true;
  }

  blockUser(): void {
    const headers = new HttpHeaders({ "Content-Type": "application/json" });

    this.http
      .put<any>(`${this.apiUrl}/blockUser`, this.blockUserForm, { headers })
      .subscribe({
        next: (response) => {
          if (response.success) {
            this.showSuccess(
              `User status updated to ${this.blockUserForm.userStatus}`,
            );
            this.showBlockUserModal = false;
            this.loadUsers();
          }
        },
        error: (error) => {
          this.showError(
            "Failed to update user status: " +
              (error.error?.message || error.message),
          );
        },
      });
  }

  // ==================== API 2: UNBLOCK USER ====================
  unblockUser(userId: number): void {
    if (!confirm("Are you sure you want to unblock this user?")) {
      return;
    }

    const headers = new HttpHeaders({ "Content-Type": "application/json" });
    const request = {
      userId: userId,
      userStatus: "ACTIVE",
    };

    this.http
      .put<any>(`${this.apiUrl}/unblockUser`, request, { headers })
      .subscribe({
        next: (response) => {
          if (response.success) {
            this.showSuccess("User unblocked successfully");
            this.loadUsers();
          }
        },
        error: (error) => {
          this.showError(
            "Failed to unblock user: " +
              (error.error?.message || error.message),
          );
        },
      });
  }

  // ==================== API 5: VIEW ALL PROPERTIES ====================
  loadProperties(): void {
    const headers = new HttpHeaders({ "Content-Type": "application/json" });

    this.http
      .get<any>(`${this.apiUrl}/viewAllProperties`, { headers })
      .subscribe({
        next: (response) => {
          if (response.success) {
            this.properties = response.data;
            this.calculatePropertyStats();
            this.showSuccess("Properties loaded successfully");
          }
        },
        error: (error) => {
          this.showError(
            "Failed to load properties: " +
              (error.error?.message || error.message),
          );
        },
      });
  }

  // ==================== API 6: DELETE PROPERTY ====================
  deleteProperty(propertyId: number): void {
    if (
      !confirm(
        "Are you sure you want to delete this property? This action cannot be undone.",
      )
    ) {
      return;
    }

    const headers = new HttpHeaders({ "Content-Type": "application/json" });

    this.http
      .delete<any>(`${this.apiUrl}/deleteProperty/${propertyId}`, { headers })
      .subscribe({
        next: (response) => {
          if (response.success) {
            this.showSuccess("Property deleted successfully");
            this.loadProperties();
          }
        },
        error: (error) => {
          this.showError(
            "Failed to delete property: " +
              (error.error?.message || error.message),
          );
        },
      });
  }

  // ==================== API 7: VIEW ALL BOOKINGS ====================
  loadBookings(): void {
    const headers = new HttpHeaders({ "Content-Type": "application/json" });

    this.http
      .get<any>(`${this.apiUrl}/viewAllBookings`, { headers })
      .subscribe({
        next: (response) => {
          if (response.success) {
            this.bookings = response.data;
            this.calculateBookingStats();
            this.showSuccess("Bookings loaded successfully");
          }
        },
        error: (error) => {
          this.showError(
            "Failed to load bookings: " +
              (error.error?.message || error.message),
          );
        },
      });
  }

  // ==================== API 8: CLOSE BOOKING WITH RATING ====================
  openRatingModal(booking: Booking): void {
    if (booking.isBookingStatus === "COMPLETED") {
      this.showError("Booking is already completed");
      return;
    }
    if (booking.isBookingStatus === "CANCELLED") {
      this.showError("Cannot close a cancelled booking");
      return;
    }

    this.ratingForm.bookingId = booking.bookingId;
    this.ratingForm.rating = 5.0;
    this.showRatingModal = true;
  }

  closeBookingWithRating(): void {
    if (this.ratingForm.rating < 1 || this.ratingForm.rating > 5) {
      this.showError("Rating must be between 1.0 and 5.0");
      return;
    }

    const headers = new HttpHeaders({ "Content-Type": "application/json" });

    this.http
      .put<any>(`${this.apiUrl}/closeBookingAndRating`, this.ratingForm, {
        headers,
      })
      .subscribe({
        next: (response) => {
          if (response.success) {
            this.showSuccess("Booking closed and rating added successfully");
            this.showRatingModal = false;
            this.loadBookings();
          }
        },
        error: (error) => {
          this.showError(
            "Failed to close booking: " +
              (error.error?.message || error.message),
          );
        },
      });
  }

  // ==================== API 9: VIEW ALL COMPLAINTS ====================
  loadComplaints(): void {
    const headers = new HttpHeaders({ "Content-Type": "application/json" });

    this.http
      .get<any>(`${this.apiUrl}/viewAllComplaints`, { headers })
      .subscribe({
        next: (response) => {
          if (response.success) {
            this.complaints = response.data;
            this.calculateComplaintStats();
            this.showSuccess("Complaints loaded successfully");
          }
        },
        error: (error) => {
          this.showError(
            "Failed to load complaints: " +
              (error.error?.message || error.message),
          );
        },
      });
  }

  // ==================== API 10: UPDATE COMPLAINT STATUS ====================
  openComplaintStatusModal(complaint: Complaint): void {
    this.complaintStatusForm.complaintId = complaint.complaintId;
    this.complaintStatusForm.status = complaint.complaintStatus;
    this.showComplaintStatusModal = true;
  }

  updateComplaintStatus(): void {
    const headers = new HttpHeaders({ "Content-Type": "application/json" });

    this.http
      .put<any>(
        `${this.apiUrl}/updateComplaintStatus/${this.complaintStatusForm.complaintId}?status=${this.complaintStatusForm.status}`,
        {},
        { headers },
      )
      .subscribe({
        next: (response) => {
          if (response.success) {
            this.showSuccess(
              `Complaint status updated to ${this.complaintStatusForm.status}`,
            );
            this.showComplaintStatusModal = false;
            this.loadComplaints();
          }
        },
        error: (error) => {
          this.showError(
            "Failed to update complaint status: " +
              (error.error?.message || error.message),
          );
        },
      });
  }

  // ==================== API 11: CLOSE COMPLAINT ====================
  closeComplaint(complaintId: number): void {
    if (!confirm("Are you sure you want to close this complaint?")) {
      return;
    }

    const headers = new HttpHeaders({ "Content-Type": "application/json" });

    this.http
      .put<any>(`${this.apiUrl}/closeComplaint/${complaintId}`, {}, { headers })
      .subscribe({
        next: (response) => {
          if (response.success) {
            this.showSuccess("Complaint closed successfully");
            this.loadComplaints();
          }
        },
        error: (error) => {
          this.showError(
            "Failed to close complaint: " +
              (error.error?.message || error.message),
          );
        },
      });
  }

  // ==================== STATISTICS CALCULATIONS ====================
  calculateUserStats(): void {
    this.stats.totalUsers = this.allUsers.length;
    this.stats.activeUsers = this.allUsers.filter(
      (u) => u.userStatus === "ACTIVE",
    ).length;
    this.stats.blockedUsers = this.allUsers.filter(
      (u) => u.userStatus === "BLOCKED",
    ).length;
  }

  calculatePropertyStats(): void {
    this.stats.totalProperties = this.properties.length;
    this.stats.availableProperties = this.properties.filter(
      (p) => p.propertyStatus === "AVAILABLE",
    ).length;
  }

  calculateBookingStats(): void {
    this.stats.totalBookings = this.bookings.length;
    this.stats.confirmedBookings = this.bookings.filter(
      (b) => b.isBookingStatus === "CONFIRMED",
    ).length;
  }

  calculateComplaintStats(): void {
    this.stats.totalComplaints = this.complaints.length;
    this.stats.pendingComplaints = this.complaints.filter(
      (c) => c.complaintStatus === "PENDING",
    ).length;
  }

  // ==================== SEARCH/FILTER ====================
  get filteredUsers(): User[] {
    if (!this.searchTerm) return this.users;

    const term = this.searchTerm.toLowerCase();
    return this.users.filter(
      (user) =>
        user.username.toLowerCase().includes(term) ||
        user.userMail.toLowerCase().includes(term) ||
        user.userPhone.includes(term),
    );
  }

  get filteredProperties(): Property[] {
    if (!this.searchTerm) return this.properties;

    const term = this.searchTerm.toLowerCase();
    return this.properties.filter(
      (property) =>
        property.propertyName.toLowerCase().includes(term) ||
        property.city.toLowerCase().includes(term) ||
        property.state.toLowerCase().includes(term),
    );
  }

  get filteredBookings(): Booking[] {
    if (!this.searchTerm) return this.bookings;

    const term = this.searchTerm.toLowerCase();
    return this.bookings.filter(
      (booking) =>
        booking.propertyName.toLowerCase().includes(term) ||
        booking.username.toLowerCase().includes(term) ||
        booking.bookingId.toString().includes(term),
    );
  }

  get filteredComplaints(): Complaint[] {
    if (!this.searchTerm) return this.complaints;

    const term = this.searchTerm.toLowerCase();
    return this.complaints.filter(
      (complaint) =>
        complaint.username.toLowerCase().includes(term) ||
        complaint.complaintDescription.toLowerCase().includes(term) ||
        complaint.complaintId.toString().includes(term),
    );
  }

  // ==================== UTILITY METHODS ====================
  showSuccess(message: string): void {
    this.successMessage = message;
    this.errorMessage = "";
    setTimeout(() => (this.successMessage = ""), 5000);
  }

  showError(message: string): void {
    this.errorMessage = message;
    this.successMessage = "";
    setTimeout(() => (this.errorMessage = ""), 5000);
  }

  clearMessages(): void {
    this.successMessage = "";
    this.errorMessage = "";
  }

  closeBlockUserModal(): void {
    this.showBlockUserModal = false;
  }

  closeRatingModal(): void {
    this.showRatingModal = false;
  }

  closeComplaintStatusModal(): void {
    this.showComplaintStatusModal = false;
  }

  getStatusBadgeClass(status: string): string {
    switch (status) {
      case "ACTIVE":
        return "badge-success";
      case "BLOCKED":
        return "badge-danger";
      case "DELETED":
        return "badge-secondary";
      case "AVAILABLE":
        return "badge-success";
      case "UNAVAILABLE":
        return "badge-warning";
      case "UNDER_MAINTENANCE":
        return "badge-info";
      case "CONFIRMED":
        return "badge-success";
      case "PENDING":
        return "badge-warning";
      case "CANCELLED":
        return "badge-danger";
      case "COMPLETED":
        return "badge-info";
      case "IN_PROGRESS":
        return "badge-primary";
      case "RESOLVED":
        return "badge-success";
      case "CLOSED":
        return "badge-secondary";
      default:
        return "badge-secondary";
    }
  }

  getRoleBadgeClass(role: string): string {
    switch (role) {
      case "ADMIN":
        return "badge-danger";
      case "HOST":
        return "badge-primary";
      case "CLIENT":
        return "badge-info";
      default:
        return "badge-secondary";
    }
  }

  getRatingStars(rating: number): string {
    const fullStars = Math.floor(rating);
    const halfStar = rating % 1 >= 0.5 ? 1 : 0;
    const emptyStars = 5 - fullStars - halfStar;

    return (
      "★".repeat(fullStars) + (halfStar ? "½" : "") + "☆".repeat(emptyStars)
    );
  }

  formatDate(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  }
}
