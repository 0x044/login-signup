import { Component, OnInit } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatSelectModule } from '@angular/material/select';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatChipsModule } from '@angular/material/chips';

// ============================================================================
// INTERFACES
// ============================================================================

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

interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
}

interface SearchFilters {
  city: string;
  state: string;
  minPrice: number;
  maxPrice: number;
  minRooms: number;
  maxGuests: number;
  amenities: string[];
}

interface SearchRequest {
  checkinDate?: string;
  checkoutDate?: string;
  noOfGuests?: number;
  city?: string;
  state?: string;
  country?: string;
}

// ============================================================================
// COMPONENT
// ============================================================================

@Component({
  selector: 'app-search-properties',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatSelectModule,
    MatCheckboxModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatChipsModule
  ],
  templateUrl: './search-properties.component.html',
  styleUrls: ['./search-properties.component.css']
})
export class SearchPropertiesComponent implements OnInit {
  
  // ==========================================================================
  // PROPERTIES
  // ==========================================================================
  
  private readonly API_BASE_URL = 'http://localhost:8080/v1/api';
  
  // Data
  properties: Property[] = [];
  filteredProperties: Property[] = [];
  cities: string[] = [];
  states: string[] = [];
  
  // Search filters
  searchFilters: SearchFilters = {
    city: '',
    state: '',
    minPrice: 0,
    maxPrice: 10000,
    minRooms: 1,
    maxGuests: 20,
    amenities: []
  };
  
  // UI state
  isLoading = false;
  showFilters = false;
  searchTerm = '';
  sortBy = 'price';
  sortOrder: 'asc' | 'desc' = 'asc';
  
  // Messages
  errorMessage = '';
  successMessage = '';
  
  // Available amenities
  availableAmenities = [
    { key: 'hasWifi', label: 'WiFi', icon: 'wifi' },
    { key: 'hasParking', label: 'Parking', icon: 'local_parking' },
    { key: 'hasPool', label: 'Pool', icon: 'pool' },
    { key: 'hasAc', label: 'Air Conditioning', icon: 'ac_unit' },
    { key: 'hasHeater', label: 'Heater', icon: 'whatshot' },
    { key: 'hasPetFriendly', label: 'Pet Friendly', icon: 'pets' }
  ];
  
  // ==========================================================================
  // CONSTRUCTOR
  // ==========================================================================
  
  constructor(
    private http: HttpClient,
    private router: Router
  ) {}
  
  // ==========================================================================
  // LIFECYCLE HOOKS
  // ==========================================================================
  
  ngOnInit(): void {
    this.loadProperties();
  }
  
  // ==========================================================================
  // API CALLS
  // ==========================================================================
  
  loadProperties(): void {
    this.isLoading = true;
    this.errorMessage = '';
    
    // Use searchByFields with empty criteria to load all properties
    const searchRequest: SearchRequest = {};
    
    const url = `${this.API_BASE_URL}/client/searchByFields`;
    
    this.http.post<ApiResponse<Property[]>>(url, searchRequest).subscribe({
      next: (response) => {
        if (response.success && response.data) {
          this.properties = response.data;
          this.filteredProperties = [...this.properties];
          this.extractCitiesAndStates();
          this.showSuccess('Properties loaded successfully');
        } else {
          this.showError('Failed to load properties');
        }
        this.isLoading = false;
      },
      error: (error: HttpErrorResponse) => {
        this.handleError('Failed to load properties', error);
        this.isLoading = false;
      }
    });
  }
  
  // ==========================================================================
  // SEARCH & FILTER METHODS
  // ==========================================================================
  
  searchProperties(): void {
    this.filteredProperties = this.properties.filter(property => {
      // Text search
      const matchesSearch = !this.searchTerm || 
        property.propertyName.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
        property.city.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
        property.state.toLowerCase().includes(this.searchTerm.toLowerCase());
      
      // City filter
      const matchesCity = !this.searchFilters.city || 
        property.city.toLowerCase().includes(this.searchFilters.city.toLowerCase());
      
      // State filter
      const matchesState = !this.searchFilters.state || 
        property.state.toLowerCase().includes(this.searchFilters.state.toLowerCase());
      
      // Price range
      const matchesPrice = property.pricePerDay >= this.searchFilters.minPrice && 
        property.pricePerDay <= this.searchFilters.maxPrice;
      
      // Room count
      const matchesRooms = property.noOfRooms >= this.searchFilters.minRooms;
      
      // Guest capacity
      const matchesGuests = property.maxNoOfGuests >= this.searchFilters.maxGuests;
      
      // Amenities
      const matchesAmenities = this.searchFilters.amenities.length === 0 || 
        this.searchFilters.amenities.every(amenity => 
          property[amenity as keyof Property] === true
        );
      
      // Status (only show available properties)
      const isAvailable = property.propertyStatus === 'AVAILABLE';
      
      return matchesSearch && matchesCity && matchesState && matchesPrice && 
             matchesRooms && matchesGuests && matchesAmenities && isAvailable;
    });
    
    this.sortProperties();
    this.showSuccess(`Found ${this.filteredProperties.length} properties`);
  }
  
  clearFilters(): void {
    this.searchFilters = {
      city: '',
      state: '',
      minPrice: 0,
      maxPrice: 10000,
      minRooms: 1,
      maxGuests: 20,
      amenities: []
    };
    this.searchTerm = '';
    this.searchProperties();
  }
  
  toggleAmenity(amenity: string): void {
    const index = this.searchFilters.amenities.indexOf(amenity);
    if (index > -1) {
      this.searchFilters.amenities.splice(index, 1);
    } else {
      this.searchFilters.amenities.push(amenity);
    }
  }
  
  sortProperties(): void {
    this.filteredProperties.sort((a, b) => {
      let comparison = 0;
      
      switch (this.sortBy) {
        case 'price':
          comparison = a.pricePerDay - b.pricePerDay;
          break;
        case 'rating':
          comparison = a.propertyRate - b.propertyRate;
          break;
        case 'name':
          comparison = a.propertyName.localeCompare(b.propertyName);
          break;
        case 'rooms':
          comparison = a.noOfRooms - b.noOfRooms;
          break;
        default:
          comparison = a.pricePerDay - b.pricePerDay;
      }
      
      return this.sortOrder === 'asc' ? comparison : -comparison;
    });
  }
  
  // ==========================================================================
  // UTILITY METHODS
  // ==========================================================================
  
  private extractCitiesAndStates(): void {
    const citiesSet = new Set<string>();
    const statesSet = new Set<string>();
    
    this.properties.forEach(property => {
      if (property.city) citiesSet.add(property.city);
      if (property.state) statesSet.add(property.state);
    });
    
    this.cities = Array.from(citiesSet).sort();
    this.states = Array.from(statesSet).sort();
  }
  
  viewPropertyDetails(propertyId: number): void {
    this.router.navigate(['/client/property-details', propertyId]);
  }
  
  goBack(): void {
    this.router.navigate(['/client/dashboard']);
  }
  
  // ==========================================================================
  // UI HELPERS
  // ==========================================================================
  
  getRatingStars(rating: number): string {
    const fullStars = Math.floor(rating);
    const halfStar = rating % 1 >= 0.5 ? 1 : 0;
    const emptyStars = 5 - fullStars - halfStar;
    
    return '★'.repeat(fullStars) + (halfStar ? '½' : '') + '☆'.repeat(emptyStars);
  }
  
  getDefaultImage(): string {
    return 'assets/images/download.jpg';
  }
  
  handleImageError(event: Event): void {
    const imgElement = event.target as HTMLImageElement;
    imgElement.src = this.getDefaultImage();
  }
  
  formatPrice(price: number): string {
    return `₹${price.toLocaleString()}/night`;
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
      this.errorMessage = 'No properties found.';
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

