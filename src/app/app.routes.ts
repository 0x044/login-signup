import { Routes } from "@angular/router";
import { SignupComponent } from "./signup/signup.component";
import { LoginComponent } from "./login/login.component";

export const routes: Routes = [
  {
    path: "home",
    component: LoginComponent,
  },
  {
    path: "addUser",
    component: SignupComponent,
  },
];
