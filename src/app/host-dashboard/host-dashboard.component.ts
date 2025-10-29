import { Component, OnInit } from "@angular/core";
import { HttpClient, HttpHeaders } from "@angular/common/http";
import { CommonModule } from "@angular/common";
import { FormsModule } from "@angular/forms";
import { Router } from "@angular/router"; // Add this import if you want the redirect option

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

interface PropertyDetail {
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
  selector: "app-host-dashboard",
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: "./host-dashboard.component.html",
  styleUrls: ["./host-dashboard.component.css"],
})
export class HostDashboardComponent implements OnInit {
  private apiUrl = "http://localhost:8080/v1/api/host";

  userId: number = 0;
  activeTab: string = "properties";

  // Properties
  properties: Property[] = [];
  deletedProperties: Property[] = [];
  selectedProperty: PropertyDetail | null = null;

  // Bookings
  bookings: Booking[] = [];

  // Add/Edit Property Form
  showPropertyForm: boolean = false;
  isEditMode: boolean = false;
  propertyForm = {
    propertyId: 0,
    propertyName: "",
    propertyDescription: "",
    noOfRooms: 1,
    noOfBathrooms: 1,
    maxNoOfGuests: 1,
    pricePerDay: 100,
    userId: 0,
    imageURL: "",
    buildingNo: "",
    street: "",
    city: "",
    state: "",
    country: "",
    postalCode: "",
    hasWifi: false,
    hasParking: false,
    hasPool: false,
    hasAc: false,
    hasHeater: false,
    hasPetFriendly: false,
    propertyStatus: "AVAILABLE",
  };

  // Complaint Form
  showComplaintForm: boolean = false;
  complaintForm = {
    userId: 0,
    bookingId: null as number | null,
    complaintDescription: "",
    complaintType: "PROPERTY",
  };

  // Messages
  successMessage: string = "";
  errorMessage: string = "";

  constructor(
    private http: HttpClient,
    private router: Router,
  ) {} // Inject Router if using redirect

  ngOnInit(): void {
    // Get userId from sessionStorage (updated from localStorage)
    const user = sessionStorage.getItem("currentUser");
    if (user) {
      try {
        const userData = JSON.parse(user);
        this.userId = userData.userId;
        this.propertyForm.userId = this.userId;
        this.complaintForm.userId = this.userId;
      } catch (parseError) {
        console.error(
          "Failed to parse user data from sessionStorage:",
          parseError,
        );
        this.showError("Invalid user data. Please log in again.");
        // Optional: Redirect to login
        this.router.navigate(['/home']);
      }
    } else {
      console.warn('No "currentUser" found in sessionStorage');
      this.showError("Session expired. Please log in again.");
      // Optional: Redirect to login
        this.router.navigate(['/home']);
    }

    this.loadProperties();
  }

  // ==================== TAB NAVIGATION ====================
  switchTab(tab: string): void {
    this.activeTab = tab;
    this.clearMessages();

    switch (tab) {
      case "properties":
        this.loadProperties();
        break;
      case "deleted":
        this.loadDeletedProperties();
        break;
      case "bookings":
        this.loadBookings();
        break;
      case "complaints":
        // Complaint form tab
        break;
    }
  }

  // ==================== API 3: GET ALL PROPERTIES ====================
  loadProperties(): void {
    const headers = new HttpHeaders({ "Content-Type": "application/json" });

    this.http
      .get<any>(`${this.apiUrl}/viewAllProperty/${this.userId}`, { headers })
      .subscribe({
        next: (response) => {
          if (response.success) {
            this.properties = response.data;
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

  // ==================== API 6: GET DELETED PROPERTIES ====================
  loadDeletedProperties(): void {
    const headers = new HttpHeaders({ "Content-Type": "application/json" });

    this.http
      .get<any>(`${this.apiUrl}/viewDeleteProperty/${this.userId}`, { headers })
      .subscribe({
        next: (response) => {
          if (response.success) {
            this.deletedProperties = response.data;
            this.showSuccess("Deleted properties loaded successfully");
          }
        },
        error: (error) => {
          this.showError(
            "Failed to load deleted properties: " +
              (error.error?.message || error.message),
          );
        },
      });
  }

  // ==================== API 4: VIEW PROPERTY DETAILS ====================
  viewPropertyDetails(propertyId: number): void {
    const headers = new HttpHeaders({ "Content-Type": "application/json" });

    this.http
      .get<any>(`${this.apiUrl}/viewPropertyById/${propertyId}`, { headers })
      .subscribe({
        next: (response) => {
          if (response.success) {
            this.selectedProperty = response.data;
          }
        },
        error: (error) => {
          this.showError(
            "Failed to load property details: " +
              (error.error?.message || error.message),
          );
        },
      });
  }

  closePropertyDetails(): void {
    this.selectedProperty = null;
  }

  // ==================== API 1: ADD PROPERTY ====================
  openAddPropertyForm(): void {
    this.isEditMode = false;
    this.showPropertyForm = true;
    this.resetPropertyForm();
  }

  addProperty(): void {
    const headers = new HttpHeaders({ "Content-Type": "application/json" });

    this.http
      .post<any>(`${this.apiUrl}/addProperty`, this.propertyForm, { headers })
      .subscribe({
        next: (response) => {
          if (response.success) {
            this.showSuccess("Property added successfully!");
            this.showPropertyForm = false;
            this.loadProperties();
            this.resetPropertyForm();
          }
        },
        error: (error) => {
          this.showError(
            "Failed to add property: " +
              (error.error?.message || error.message),
          );
        },
      });
  }

  // ==================== API 2: UPDATE PROPERTY ====================
  openEditPropertyForm(property: Property): void {
    this.isEditMode = true;
    this.showPropertyForm = true;

    // Load full property details first
    this.viewPropertyDetailsForEdit(property.propertyId);
  }

  viewPropertyDetailsForEdit(propertyId: number): void {
    const headers = new HttpHeaders({ "Content-Type": "application/json" });

    this.http
      .get<any>(`${this.apiUrl}/viewPropertyById/${propertyId}`, { headers })
      .subscribe({
        next: (response) => {
          if (response.success) {
            const propDetail = response.data;
            this.propertyForm = {
              propertyId: propDetail.propertyId,
              propertyName: propDetail.propertyName,
              propertyDescription: propDetail.propertyDescription,
              noOfRooms: propDetail.noOfRooms,
              noOfBathrooms: propDetail.noOfBathrooms,
              maxNoOfGuests: propDetail.maxNoOfGuests,
              pricePerDay: propDetail.pricePerDay,
              userId: this.userId,
              imageURL: propDetail.imageURL,
              buildingNo: propDetail.buildingNo,
              street: propDetail.street,
              city: propDetail.city,
              state: propDetail.state,
              country: propDetail.country,
              postalCode: propDetail.postalCode,
              hasWifi: propDetail.hasWifi,
              hasParking: propDetail.hasParking,
              hasPool: propDetail.hasPool,
              hasAc: propDetail.hasAc,
              hasHeater: propDetail.hasHeater,
              hasPetFriendly: propDetail.hasPetFriendly,
              propertyStatus: propDetail.propertyStatus,
            };
          }
        },
        error: (error) => {
          this.showError(
            "Failed to load property for editing: " +
              (error.error?.message || error.message),
          );
        },
      });
  }

  updateProperty(): void {
    const headers = new HttpHeaders({ "Content-Type": "application/json" });

    this.http
      .put<any>(`${this.apiUrl}/updateProperty`, this.propertyForm, { headers })
      .subscribe({
        next: (response) => {
          if (response.success) {
            this.showSuccess("Property updated successfully!");
            this.showPropertyForm = false;
            this.loadProperties();
            this.resetPropertyForm();
          }
        },
        error: (error) => {
          this.showError(
            "Failed to update property: " +
              (error.error?.message || error.message),
          );
        },
      });
  }

  submitPropertyForm(): void {
    if (this.isEditMode) {
      this.updateProperty();
    } else {
      this.addProperty();
    }
  }

  cancelPropertyForm(): void {
    this.showPropertyForm = false;
    this.resetPropertyForm();
  }

  resetPropertyForm(): void {
    this.propertyForm = {
      propertyId: 0,
      propertyName: "",
      propertyDescription: "",
      noOfRooms: 1,
      noOfBathrooms: 1,
      maxNoOfGuests: 1,
      pricePerDay: 100,
      userId: this.userId,
      imageURL: "",
      buildingNo: "",
      street: "",
      city: "",
      state: "",
      country: "",
      postalCode: "",
      hasWifi: false,
      hasParking: false,
      hasPool: false,
      hasAc: false,
      hasHeater: false,
      hasPetFriendly: false,
      propertyStatus: "AVAILABLE",
    };
  }

  // ==================== API 5: DELETE PROPERTY ====================
  deleteProperty(propertyId: number): void {
    if (!confirm("Are you sure you want to delete this property?")) {
      return;
    }

    const headers = new HttpHeaders({ "Content-Type": "application/json" });

    this.http
      .delete<any>(`${this.apiUrl}/deleteProperty/${propertyId}`, { headers })
      .subscribe({
        next: (response) => {
          if (response.success) {
            this.showSuccess("Property deleted successfully!");
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

  // ==================== API 7: VIEW BOOKINGS ====================
  loadBookings(): void {
    const headers = new HttpHeaders({ "Content-Type": "application/json" });

    this.http
      .get<any>(`${this.apiUrl}/viewBookings/${this.userId}`, { headers })
      .subscribe({
        next: (response) => {
          if (response.success) {
            this.bookings = response.data;
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

  // ==================== API 8: ADD COMPLAINT ====================
  openComplaintForm(): void {
    this.showComplaintForm = true;
    this.resetComplaintForm();
  }

  submitComplaint(): void {
    if (!this.complaintForm.complaintDescription.trim()) {
      this.showError("Please enter a complaint description");
      return;
    }

    const headers = new HttpHeaders({ "Content-Type": "application/json" });

    this.http
      .post<any>(`${this.apiUrl}/addComplaint`, this.complaintForm, { headers })
      .subscribe({
        next: (response) => {
          if (response.success) {
            this.showSuccess("Complaint submitted successfully!");
            this.showComplaintForm = false;
            this.resetComplaintForm();
          }
        },
        error: (error) => {
          this.showError(
            "Failed to submit complaint: " +
              (error.error?.message || error.message),
          );
        },
      });
  }

  cancelComplaintForm(): void {
    this.showComplaintForm = false;
    this.resetComplaintForm();
  }

  resetComplaintForm(): void {
    this.complaintForm = {
      userId: this.userId,
      bookingId: null,
      complaintDescription: "",
      complaintType: "PROPERTY",
    };
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

  getStatusBadgeClass(status: string): string {
    switch (status) {
      case "AVAILABLE":
        return "badge-success";
      case "UNAVAILABLE":
        return "badge-warning";
      case "UNDER_MAINTENANCE":
        return "badge-info";
      case "DELETED":
        return "badge-danger";
      case "CONFIRMED":
        return "badge-success";
      case "PENDING":
        return "badge-warning";
      case "CANCELLED":
        return "badge-danger";
      case "COMPLETED":
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
}
