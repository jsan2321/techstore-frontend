import { CommonModule } from '@angular/common';
import { Component, OnInit, inject, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { finalize } from 'rxjs';
import { OrderResponse, OrderStatus } from '../../../../data/models/order.models';
import { OrderService } from '../../../../data/services/order.service';
import { LoadingSpinnerComponent } from '../../../../shared/components/loading-spinner/loading-spinner.component';

@Component({
  selector: 'app-order-detail',
  standalone: true,
  imports: [CommonModule, RouterLink, LoadingSpinnerComponent],
  templateUrl: './order-detail.component.html'
})
export class OrderDetailComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly orderService = inject(OrderService);

  readonly loading = signal(true);
  readonly errorMessage = signal<string | null>(null);
  readonly order = signal<OrderResponse | null>(null);
  readonly cancelling = signal(false);

  ngOnInit(): void {
    const rawId = this.route.snapshot.paramMap.get('orderId');
    const orderId = Number(rawId);

    if (!rawId || !Number.isFinite(orderId) || orderId <= 0) {
      this.loading.set(false);
      this.errorMessage.set('Invalid order id.');
      return;
    }

    this.loadOrder(orderId);
  }

  loadOrder(orderId: number): void {
    this.loading.set(true);
    this.errorMessage.set(null);

    this.orderService
      .getOrderById(orderId)
      .pipe(finalize(() => this.loading.set(false)))
      .subscribe({
        next: (order) => this.order.set(order),
        error: (error: unknown) => {
          this.errorMessage.set(this.resolveError(error, 'Could not load order details.'));
        }
      });
  }

  readonly isCancelModalOpen = signal(false);
  readonly cancellationReason = signal('');

  cancelOrder(): void {
    const current = this.order();
    if (!current || !this.canCancel(current.status)) {
      return;
    }
    this.cancellationReason.set('');
    this.isCancelModalOpen.set(true);
  }

  closeCancelModal(): void {
    this.isCancelModalOpen.set(false);
  }

  confirmCancelOrder(): void {
    const current = this.order();
    if (!current || !this.canCancel(current.status)) {
      return;
    }

    const reason = this.cancellationReason().trim() || null;
    this.isCancelModalOpen.set(false);
    this.cancelling.set(true);
    this.errorMessage.set(null);

    this.orderService
      .cancelOrder(current.id, reason)
      .pipe(finalize(() => this.cancelling.set(false)))
      .subscribe({
        next: (updated) => this.order.set(updated),
        error: (error: unknown) => {
          this.errorMessage.set(this.resolveError(error, 'Could not cancel the order.'));
        }
      });
  }

  canCancel(status: OrderStatus): boolean {
    return status === 'PENDING' || status === 'PROCESSING';
  }

  private resolveError(error: unknown, fallback: string): string {
    if (error && typeof error === 'object') {
      const message = (error as { error?: { message?: unknown } }).error?.message;
      if (typeof message === 'string' && message.trim().length > 0) {
        return message;
      }
    }

    return fallback;
  }
}
