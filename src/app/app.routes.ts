import { Routes } from "@angular/router";
import { SignupComponent } from "./signup/signup.component";
import { LoginComponent } from "./login/login.component";
import { ClientDashboardComponent } from "./client-dashboard/client-dashboard.component";
import { HostDashboardComponent } from "./host-dashboard/host-dashboard.component";
import { UserProfileComponent } from "./user-profile/user-profile.component";
import { AdminDashboardComponent } from "./admin-dashboard/admin-dashboard.component";
import { SearchPropertiesComponent } from "./client/search-properties/search-properties.component";
import { MyBookingsComponent } from "./client/my-bookings/my-bookings.component";
import { MyComplaintsComponent } from "./client/my-complaints/my-complaints.component";
import { BookingDetailsComponent } from "./client/booking-details/booking-details.component";
import { PropertyDetailsComponent } from "./client/property-details/property-details.component";
import { ResetPasswordComponent } from "./reset-password/reset-password.component";
import { AccountDeletedComponent } from "./account-deleted/account-deleted.component";
import { NotFoundComponent } from "./not-found/not-found.component";

export const routes: Routes = [
  // Default route - redirect to home
  {
    path: "",
    redirectTo: "/home",
    pathMatch: "full"
  },
  // Login page
  {
    path: "home",
    component: LoginComponent,
  },
  // Alternative login route (for consistency)
  {
    path: "loginUser",
    component: LoginComponent,
  },
  // Signup page
  {
    path: "addUser",
    component: SignupComponent,
  },
  // Reset password page
  {
    path: "reset-password",
    component: ResetPasswordComponent,
  },
  // Client routes
  {
    path: "client/dashboard",
    component: ClientDashboardComponent,
  },
  {
    path: "client/search-properties",
    component: SearchPropertiesComponent,
  },
  {
    path: "client/my-bookings",
    component: MyBookingsComponent,
  },
  {
    path: "client/my-complaints",
    component: MyComplaintsComponent,
  },
  {
    path: "client/booking-details/:id",
    component: BookingDetailsComponent,
  },
  {
    path: "client/property-details/:id",
    component: PropertyDetailsComponent,
  },
  {
    path: "client/profile",
    component: UserProfileComponent,
  },
  // Host routes
  {
    path: "host/dashboard",
    component: HostDashboardComponent,
  },
  // Admin routes
  {
    path: "admin/dashboard",
    component: AdminDashboardComponent,
  },
  // Utility pages
  {
    path: "account-deleted",
    component: AccountDeletedComponent,
  },
  // 404 page - must be last
  {
    path: "**",
    component: NotFoundComponent,
  },
];
