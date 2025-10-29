import { CommonModule } from "@angular/common";
import { HttpClient, HttpErrorResponse } from "@angular/common/http";
import { Component, OnInit } from "@angular/core";
import {
  AbstractControl,
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from "@angular/forms";
import { MatButtonModule } from "@angular/material/button";
import { MatCardModule } from "@angular/material/card";
import { MatFormFieldModule } from "@angular/material/form-field";
import { MatInputModule } from "@angular/material/input";
import { MatIconModule } from "@angular/material/icon";
import { MatProgressSpinnerModule } from "@angular/material/progress-spinner";
import { MatDividerModule } from "@angular/material/divider";
import { Router } from "@angular/router";
import { throwError } from "rxjs";
import { catchError, tap } from "rxjs/operators";
// ============================================================================
// INTERFACES - All type definitions in one place
// ============================================================================

interface UserLoginRequest {
  username: string;
  password: string;
}

interface LoginResponse {
  userId: number;
  username: string;
  email: string;
  role: string;
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
// COMPONENT - Complete login functionality with debugging
// ============================================================================

@Component({
  selector: "app-login",
  templateUrl: "./login.component.html",
  styleUrls: ["./login.component.css"],
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatButtonModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatDividerModule,
  ],
})
export class LoginComponent implements OnInit {
  private readonly API_BASE_URL = "http://localhost:8080/v1/api";
  private readonly LOGIN_ENDPOINT = `${this.API_BASE_URL}/user/loginUser`;
  private readonly LOGOUT_ENDPOINT = `${this.API_BASE_URL}/user/logoutUser`;

  private readonly DEBUG_MODE = true; // Set to false in production

  loginForm!: FormGroup;
  showPassword = false;
  isLoading = false;
  errorMessage = "";
  successMessage = "";

  private readonly STORAGE_KEYS = {
    CURRENT_USER: "currentUser",
    USER_ID: "userId",
    USER_ROLE: "userRole",
    USERNAME: "username",
    USER_EMAIL: "userEmail",
  };

  constructor(
    private fb: FormBuilder,
    private router: Router,
    private http: HttpClient,
  ) {
    this.debugLog("🏗️ LoginComponent constructor called");
  }

  ngOnInit(): void {
    this.debugLog("🔄 LoginComponent initialized");
    this.initializeForm();
    this.checkExistingSession();
  }

  /**
   * Centralized debug logging
   */
  private debugLog(message: string, data?: any): void {
    if (this.DEBUG_MODE) {
      const timestamp = new Date().toLocaleTimeString();
      console.log(`[${timestamp}] ${message}`);
      if (data !== undefined) {
        console.log("📦 Data:", data);
      }
    }
  }

  private debugError(message: string, error?: any): void {
    if (this.DEBUG_MODE) {
      const timestamp = new Date().toLocaleTimeString();
      console.error(`[${timestamp}] ❌ ${message}`);
      if (error !== undefined) {
        console.error("Error details:", error);
      }
    }
  }

  private debugSuccess(message: string, data?: any): void {
    if (this.DEBUG_MODE) {
      const timestamp = new Date().toLocaleTimeString();
      console.log(
        `%c[${timestamp}] ✅ ${message}`,
        "color: green; font-weight: bold;",
      );
      if (data !== undefined) {
        console.log("📦 Data:", data);
      }
    }
  }

  private debugWarn(message: string, data?: any): void {
    if (this.DEBUG_MODE) {
      const timestamp = new Date().toLocaleTimeString();
      console.warn(`[${timestamp}] ⚠️ ${message}`);
      if (data !== undefined) {
        console.warn("Data:", data);
      }
    }
  }

  private initializeForm(): void {
    this.debugLog("📝 Initializing login form with validators");

    this.loginForm = this.fb.group({
      username: [
        "",
        [
          Validators.required,
          Validators.minLength(3),
          Validators.maxLength(20),
          this.noWhitespaceValidator,
        ],
      ],
      password: [
        "",
        [
          Validators.required,
          Validators.minLength(8),
          Validators.maxLength(20),
        ],
      ],
    });

    this.debugSuccess("Form initialized successfully", {
      controls: Object.keys(this.loginForm.controls),
      validators:
        "Username: required, minLength(3), maxLength(20), noWhitespace | Password: required, minLength(8), maxLength(20)",
    });
  }

  private noWhitespaceValidator(
    control: AbstractControl,
  ): { [key: string]: boolean } | null {
    const isWhitespace = (control.value || "").trim().length === 0;
    return isWhitespace ? { whitespace: true } : null;
  }

  get username(): AbstractControl | null {
    return this.loginForm.get("username");
  }

  get password(): AbstractControl | null {
    return this.loginForm.get("password");
  }

  private checkExistingSession(): void {
    this.debugLog("🔍 Checking for existing session...");

    const currentUser = this.getCurrentUser();

    if (currentUser) {
      this.debugSuccess("Existing session found!", {
        userId: currentUser.userId,
        username: currentUser.username,
        email: currentUser.email,
        role: currentUser.role,
      });

      console.log(
        "%c👤 User is already logged in!",
        "color: blue; font-weight: bold; font-size: 14px;",
      );
      console.table({
        "User ID": currentUser.userId,
        Username: currentUser.username,
        Email: currentUser.email,
        Role: currentUser.role,
      });

      this.navigateBasedOnRole(currentUser.role);
    } else {
      this.debugLog("No existing session found. User needs to login.");
    }
  }

  private setCurrentUser(user: LoginResponse): void {
    this.debugLog("💾 Creating session storage for user...");

    try {
      sessionStorage.setItem(
        this.STORAGE_KEYS.CURRENT_USER,
        JSON.stringify(user),
      );
      sessionStorage.setItem(this.STORAGE_KEYS.USER_ID, user.userId.toString());
      sessionStorage.setItem(this.STORAGE_KEYS.USER_ROLE, user.role);
      sessionStorage.setItem(this.STORAGE_KEYS.USERNAME, user.username);
      sessionStorage.setItem(this.STORAGE_KEYS.USER_EMAIL, user.email);

      this.debugSuccess("✨ SESSION CREATED SUCCESSFULLY! ✨");
      console.log(
        "%c🎉 Session Storage Created!",
        "color: green; font-weight: bold; font-size: 16px; background: #e8f5e9; padding: 5px;",
      );
      console.group("📋 Session Details:");
      console.log("├─ User ID:", user.userId);
      console.log("├─ Username:", user.username);
      console.log("├─ Email:", user.email);
      console.log("└─ Role:", user.role);
      console.groupEnd();

      // Verify session was created
      this.verifySession();
    } catch (error) {
      this.debugError("Failed to store user data in session storage", error);
    }
  }

  private verifySession(): void {
    this.debugLog("🔐 Verifying session storage...");

    const sessionData = {
      "Current User": sessionStorage.getItem(this.STORAGE_KEYS.CURRENT_USER),
      "User ID": sessionStorage.getItem(this.STORAGE_KEYS.USER_ID),
      "User Role": sessionStorage.getItem(this.STORAGE_KEYS.USER_ROLE),
      Username: sessionStorage.getItem(this.STORAGE_KEYS.USERNAME),
      "User Email": sessionStorage.getItem(this.STORAGE_KEYS.USER_EMAIL),
    };

    console.log("%c✓ Session Verification:", "color: blue; font-weight: bold;");
    console.table(sessionData);

    const allKeysPresent = Object.values(this.STORAGE_KEYS).every(
      (key) => sessionStorage.getItem(key) !== null,
    );

    if (allKeysPresent) {
      this.debugSuccess("All session keys verified successfully!");
    } else {
      this.debugWarn("Some session keys are missing!");
    }
  }

  /**
   * Retrieve current user from session storage
   */
  private getCurrentUser(): LoginResponse | null {
    this.debugLog("🔎 Attempting to retrieve user from session storage...");

    const userJson = sessionStorage.getItem(this.STORAGE_KEYS.CURRENT_USER);

    if (userJson) {
      try {
        const user = JSON.parse(userJson) as LoginResponse;
        this.debugSuccess("User data retrieved from session", user);
        return user;
      } catch (error) {
        this.debugError("Error parsing user data from session storage", error);
        this.clearSession();
        return null;
      }
    }

    this.debugLog("No user data found in session storage");
    return null;
  }

  private clearSession(): void {
    this.debugLog("🧹 Clearing session storage...");

    const keysBeforeClear = Object.values(this.STORAGE_KEYS).map((key) => ({
      key,
      value: sessionStorage.getItem(key),
    }));

    Object.values(this.STORAGE_KEYS).forEach((key) => {
      sessionStorage.removeItem(key);
    });

    console.log("%c🗑️ Session Cleared!", "color: orange; font-weight: bold;");
    console.log("Keys removed:", keysBeforeClear);

    this.debugSuccess("Session storage cleared successfully");
  }

  isAuthenticated(): boolean {
    const authenticated = this.getCurrentUser() !== null;
    this.debugLog(
      `Authentication check: ${authenticated ? "✅ Authenticated" : "❌ Not authenticated"}`,
    );
    return authenticated;
  }

  getUserRole(): string | null {
    const role = sessionStorage.getItem(this.STORAGE_KEYS.USER_ROLE);
    this.debugLog("Retrieved user role:", role);
    return role;
  }

  getUserId(): string | null {
    const userId = sessionStorage.getItem(this.STORAGE_KEYS.USER_ID);
    return userId;
  }

  togglePasswordVisibility(): void {
    this.showPassword = !this.showPassword;
  }

  navigateToSignup(): void {
    this.debugLog("🔄 Navigating to signup page");
    this.router.navigate(["/addUser"]);
  }

  navigateToHome(): void {
    this.debugLog("🔄 Navigating to home page");
    this.router.navigate(["/"]);
  }

  navigateToForgotPassword(): void {
    this.debugLog("🔄 Navigating to reset password page");
    this.router.navigate(["/reset-password"]);
  }

  onSubmit(): void {
    console.log(
      "%c🚀 LOGIN ATTEMPT STARTED",
      "color: purple; font-weight: bold; font-size: 14px; background: #f3e5f5; padding: 5px;",
    );

    // Clear previous messages
    this.errorMessage = "";
    this.successMessage = "";

    // Log form state
    this.debugLog("Form submission initiated", {
      formValid: this.loginForm.valid,
      formValue: {
        username: this.loginForm.value.username,
        password: "***hidden***",
      },
      formErrors: this.loginForm.errors,
    });

    // Validate form
    if (this.loginForm.invalid) {
      this.debugWarn("Form validation failed");
      this.markFormGroupTouched(this.loginForm);

      console.group("❌ Form Validation Errors:");
      Object.keys(this.loginForm.controls).forEach((key) => {
        const control = this.loginForm.get(key);
        if (control && control.errors) {
          console.log(`├─ ${key}:`, control.errors);
        }
      });
      console.groupEnd();

      this.errorMessage = "Please fill in all required fields correctly.";
      return;
    }

    this.debugSuccess("Form validation passed");

    // Start loading
    this.isLoading = true;

    // Prepare login request
    const loginRequest: UserLoginRequest = {
      username: this.loginForm.value.username.trim(),
      password: this.loginForm.value.password,
    };

    console.log("%c📤 Sending API Request", "color: blue; font-weight: bold;");
    console.log("Endpoint:", this.LOGIN_ENDPOINT);
    console.log("Request Data:", {
      username: loginRequest.username,
      password: "***hidden***",
    });

    // Make API call
    this.performLogin(loginRequest);
  }

  /**
   * Perform the login API call
   */
  private performLogin(loginRequest: UserLoginRequest): void {
    this.debugLog("🌐 Making HTTP POST request to login endpoint");

    const startTime = Date.now();

    this.http
      .post<ApiResponse<LoginResponse>>(this.LOGIN_ENDPOINT, loginRequest)
      .pipe(
        tap((response: ApiResponse<LoginResponse>) => {
          const endTime = Date.now();
          const duration = endTime - startTime;

          console.log(
            "%c📥 API Response Received",
            "color: green; font-weight: bold;",
          );
          console.log(`⏱️ Response time: ${duration}ms`);
          console.log("Response:", response);

          if (response.success && response.data) {
            this.debugSuccess("Login API call successful", response.data);

            console.log(
              "%c✅ USER VALIDATION SUCCESSFUL!",
              "color: green; font-weight: bold; font-size: 16px; background: #e8f5e9; padding: 8px;",
            );
            console.log(
              "%c👤 User Details:",
              "color: blue; font-weight: bold;",
            );
            console.table({
              "User ID": response.data.userId,
              Username: response.data.username,
              Email: response.data.email,
              Role: response.data.role,
            });

            this.handleLoginSuccess(response.data, response.message);
          } else {
            this.debugError("Login failed - Invalid response", response);
            throw new Error(response.message || "Login failed");
          }
        }),
        catchError((error: HttpErrorResponse) => {
          const endTime = Date.now();
          const duration = endTime - startTime;

          console.log(`⏱️ Request failed after: ${duration}ms`);
          this.handleLoginError(error);
          return throwError(() => error);
        }),
      )
      .subscribe({
        complete: () => {
          this.isLoading = false;
          this.debugLog("Login HTTP request completed");
        },
      });
  }

  /**
   * Handle successful login response
   */
  private handleLoginSuccess(loginData: LoginResponse, message: string): void {
    console.log(
      "%c🎊 LOGIN SUCCESS HANDLER",
      "color: green; font-weight: bold; font-size: 14px; background: #e8f5e9; padding: 5px;",
    );

    this.debugLog("Processing successful login...");

    // Store user data in session storage
    this.setCurrentUser(loginData);

    // Show success message
    this.successMessage = message || "Login successful! Redirecting...";
    this.debugSuccess(this.successMessage);

    console.log(
      "%c🔄 Preparing to redirect user...",
      "color: blue; font-weight: bold;",
    );
    console.log("Target role:", loginData.role);

    // Navigate based on user role after a short delay
    setTimeout(() => {
      this.navigateBasedOnRole(loginData.role);
    }, 500);
  }

  /**
   * Handle login errors with detailed messages
   */
  private handleLoginError(error: HttpErrorResponse): void {
    console.log(
      "%c❌ LOGIN ERROR HANDLER",
      "color: red; font-weight: bold; font-size: 14px; background: #ffebee; padding: 5px;",
    );

    this.isLoading = false;

    this.debugError("Login failed", {
      status: error.status,
      statusText: error.statusText,
      error: error.error,
      message: error.message,
    });

    // Extract error message from backend
    if (error.error && typeof error.error === "object") {
      const errorResponse = error.error as ErrorResponse;
      this.errorMessage =
        errorResponse.message || "An error occurred during login.";

      console.group("🔍 Error Details:");
      console.log("├─ Success:", errorResponse.success);
      console.log("├─ Message:", errorResponse.message);
      console.log("└─ Timestamp:", errorResponse.timestamp);
      console.groupEnd();
    } else if (error.status === 0) {
      this.errorMessage =
        "Unable to connect to the server. Please check your internet connection.";
      this.debugError("Network error - Server unreachable");
    } else if (error.status === 401) {
      this.errorMessage = "Invalid username or password. Please try again.";
      this.debugError("Authentication failed - Invalid credentials");
    } else if (error.status === 403) {
      this.errorMessage =
        "Your account has been blocked. Please contact support.";
      this.debugError("Access forbidden - Account blocked");
    } else if (error.status === 404) {
      this.errorMessage = "User not found. Please register first.";
      this.debugError("User not found in system");
    } else if (error.status >= 500) {
      this.errorMessage = "Server error. Please try again later.";
      this.debugError("Server error encountered");
    } else {
      this.errorMessage =
        error.message || "An unexpected error occurred. Please try again.";
      this.debugError("Unexpected error occurred");
    }

    console.log(
      "%c💬 Error Message Displayed:",
      "color: red; font-weight: bold;",
      this.errorMessage,
    );
  }

  // ==========================================================================
  // NAVIGATION
  // ==========================================================================

  /**
   * Navigate user to appropriate dashboard based on role
   */
  private navigateBasedOnRole(role: string): void {
    const roleUpper = role.toUpperCase();

    console.log(
      "%c🧭 NAVIGATION HANDLER",
      "color: purple; font-weight: bold; font-size: 14px; background: #f3e5f5; padding: 5px;",
    );
    this.debugLog(`Determining navigation route for role: ${roleUpper}`);

    let targetRoute = "";

    switch (roleUpper) {
      case "ADMIN":
        targetRoute = "/admin/dashboard";
        this.debugSuccess("Navigating to ADMIN dashboard");
        break;
      case "HOST":
        targetRoute = "/host/dashboard";
        this.debugSuccess("Navigating to HOST dashboard");
        break;
      case "CLIENT":
        targetRoute = "/client/dashboard";
        this.debugSuccess("Navigating to CLIENT dashboard");
        break;
      default:
        targetRoute = "/";
        this.debugWarn(`Unknown role: ${role}. Navigating to home page`);
        break;
    }

    console.log(`➡️ Redirecting to: ${targetRoute}`);
    this.router.navigate([targetRoute]);
  }

  // ==========================================================================
  // LOGOUT FUNCTIONALITY
  // ==========================================================================

  /**
   * Logout user and clear session
   */
  logout(): void {
    console.log(
      "%c🚪 LOGOUT INITIATED",
      "color: orange; font-weight: bold; font-size: 14px; background: #fff3e0; padding: 5px;",
    );

    const userId = this.getUserId();
    this.debugLog("Starting logout process", { userId });

    if (userId) {
      // Call logout API
      const logoutEndpoint = `${this.LOGOUT_ENDPOINT}/${userId}`;

      console.log("📤 Calling logout API:", logoutEndpoint);

      this.http
        .post<ApiResponse<string>>(logoutEndpoint, {})
        .pipe(
          catchError((error: HttpErrorResponse) => {
            this.debugError("Logout API error", error);
            return throwError(() => error);
          }),
        )
        .subscribe({
          next: (response) => {
            this.debugSuccess("Logout API call successful", response);
          },
          error: (error) => {
            this.debugError(
              "Logout API failed, proceeding with local logout",
              error,
            );
          },
          complete: () => {
            this.performLogout();
          },
        });
    } else {
      this.debugWarn("No user ID found, performing local logout only");
      this.performLogout();
    }
  }

  /**
   * Perform logout cleanup and navigation
   */
  private performLogout(): void {
    this.debugLog("🧹 Performing logout cleanup");

    console.log(
      "%c👋 User logged out successfully",
      "color: blue; font-weight: bold;",
    );

    this.clearSession();
    this.loginForm.reset();
    this.errorMessage = "";
    this.successMessage = "";

    this.debugSuccess("Logout completed. Redirecting to login page...");
    this.router.navigate(["/login"]);
  }

  // ==========================================================================
  // UTILITY METHODS
  // ==========================================================================

  /**
   * Mark all controls in a form group as touched
   */
  private markFormGroupTouched(formGroup: FormGroup): void {
    Object.keys(formGroup.controls).forEach((key) => {
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
    const control = this.loginForm.get(fieldName);

    if (control && control.touched && control.errors) {
      if (control.errors["required"]) {
        return `${this.capitalizeFirstLetter(fieldName)} is required.`;
      }
      if (control.errors["minlength"]) {
        return `${this.capitalizeFirstLetter(fieldName)} must be at least ${control.errors["minlength"].requiredLength} characters.`;
      }
      if (control.errors["maxlength"]) {
        return `${this.capitalizeFirstLetter(fieldName)} cannot exceed ${control.errors["maxlength"].requiredLength} characters.`;
      }
      if (control.errors["whitespace"]) {
        return `${this.capitalizeFirstLetter(fieldName)} cannot be empty or contain only spaces.`;
      }
    }

    return "";
  }

  /**
   * Capitalize first letter of a string
   */
  private capitalizeFirstLetter(text: string): string {
    return text.charAt(0).toUpperCase() + text.slice(1);
  }

  /**
   * Check if a field has error
   */
  hasError(fieldName: string): boolean {
    const control = this.loginForm.get(fieldName);
    return !!(control && control.invalid && control.touched);
  }

  /**
   * Reset form and clear messages
   */
  resetForm(): void {
    this.debugLog("🔄 Resetting form");
    this.loginForm.reset();
    this.errorMessage = "";
    this.successMessage = "";
    this.showPassword = false;
    this.debugSuccess("Form reset completed");
  }
}
