import { Routes } from "@angular/router";
import { SignupComponent } from "./signup/signup.component";
import { LoginComponent } from "./login/login.component";
import { ClientDashboardComponent } from "./client-dashboard/client-dashboard.component";
import { HostDashboardComponent } from "./host-dashboard/host-dashboard.component";
import { UserProfileComponent } from "./user-profile/user-profile.component";
import { AdminDashboardComponent } from "./admin-dashboard/admin-dashboard.component";

export const routes: Routes = [
  {
    path: "home",
    component: LoginComponent,
  },
  {
    path: "addUser",
    component: SignupComponent,
  },
  {
    path: "client/dashboard",
    component: ClientDashboardComponent,
  },
  {
    path: "host/dashboard",
    component: HostDashboardComponent,
  },
  {
    path: "client/profile",
    component: UserProfileComponent,
  },
  {
    path: "admin/dashboard",
    component: AdminDashboardComponent,
  },
];
