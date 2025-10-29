import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-account-deleted',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule
  ],
  templateUrl: './account-deleted.component.html',
  styleUrls: ['./account-deleted.component.css']
})
export class AccountDeletedComponent implements OnInit {
  
  constructor(private router: Router) {}
  
  ngOnInit(): void {
    // Auto-redirect to home after 10 seconds
    setTimeout(() => {
      this.router.navigate(['/home']);
    }, 10000);
  }
  
  goToHome(): void {
    this.router.navigate(['/home']);
  }
}

