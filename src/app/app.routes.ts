import { Routes } from '@angular/router';
import { SignupComponent } from './signup/signup.component';

export const routes: Routes = [
    {
    path: 'v1/api/user',
    redirectTo: '/addUser',
    pathMatch: 'full',
  },
  {
    path: 'addUser',
    component: SignupComponent,
  }
];
