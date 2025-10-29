import { Injectable } from "@angular/core";
import { Router } from "@angular/router";

@Injectable({
  providedIn: "root",
})
export class AuthService {
  constructor(private router: Router) {}

  // Logout method - clears session and redirects to landing
  logout(): void {
    // Clear any stored authentication data
    localStorage.removeItem("adminToken");
    localStorage.removeItem("adminUser");
    sessionStorage.clear();

    // Navigate to landing page
    this.router.navigate(["/home"]);
  }

  // Check if admin is logged in (for future use)
  isLoggedIn(): boolean {
    return !!localStorage.getItem("adminToken");
  }
}
