import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { forkJoin, finalize } from 'rxjs';
import { AdminService } from '../../services/admin.service';
import { AdminOrderResponse } from '../../models/admin.models';
import { LoadingSpinnerComponent } from '../../../../shared/components/loading-spinner/loading-spinner.component';

@Component({
  selector: 'app-admin-dashboard',
  standalone: true,
  imports: [CommonModule, RouterLink, LoadingSpinnerComponent],
  templateUrl: './admin-dashboard.component.html'
})
export class AdminDashboardComponent implements OnInit {
  private readonly adminService = inject(AdminService);

  readonly loading = signal(true);
  readonly errorMessage = signal<string | null>(null);

  readonly totalUsers = signal<number>(0);
  readonly totalProducts = signal<number>(0);
  readonly totalOrders = signal<number>(0);
  readonly totalRevenue = signal<number>(0);
  readonly recentOrders = signal<AdminOrderResponse[]>([]);

  ngOnInit(): void {
    this.loadKPIs();
  }

  loadKPIs(): void {
    this.loading.set(true);
    this.errorMessage.set(null);

    forkJoin({
      users: this.adminService.getUsers(0, 100),
      products: this.adminService.getProducts(0, 1),
      orders: this.adminService.getOrders(0, 100)
    })
      .pipe(finalize(() => this.loading.set(false)))
      .subscribe({
        next: ({ users, products, orders }) => {
          this.totalUsers.set(users.length);
          this.totalProducts.set(products.totalElements);
          this.totalOrders.set(orders.totalElements);

          // Calculate revenue: sum totalAmount of CAPTURED orders
          const revenue = orders.content
            .filter((o) => o.paymentStatus === 'CAPTURED')
            .reduce((sum, o) => sum + o.totalAmount, 0);
          this.totalRevenue.set(revenue);

          // Store last 5 orders
          const sorted = [...orders.content].sort((a, b) => b.id - a.id).slice(0, 5);
          this.recentOrders.set(sorted);
        },
        error: (err: unknown) => {
          this.errorMessage.set('Failed to load dashboard KPIs. Please try again.');
        }
      });
  }
}
