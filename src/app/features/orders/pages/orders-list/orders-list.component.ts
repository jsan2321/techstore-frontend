import { CommonModule } from '@angular/common';
import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { RouterLink } from '@angular/router';
import { finalize } from 'rxjs';
import { OrderResponse, OrderStatus } from '../../../../data/models/order.models';
import { OrderService } from '../../../../data/services/order.service';
import { EmptyStateComponent } from '../../../../shared/components/empty-state/empty-state.component';
import { LoadingSpinnerComponent } from '../../../../shared/components/loading-spinner/loading-spinner.component';

@Component({
  selector: 'app-orders-list',
  standalone: true,
  imports: [CommonModule, RouterLink, EmptyStateComponent, LoadingSpinnerComponent],
  templateUrl: './orders-list.component.html'
})
export class OrdersListComponent implements OnInit {
  private readonly orderService = inject(OrderService);

  readonly orders = signal<OrderResponse[]>([]);
  readonly loading = signal(true);
  readonly errorMessage = signal<string | null>(null);
  readonly infoMessage = signal<string | null>(null);
  readonly cancellingOrderId = signal<number | null>(null);

  // Status Filter Signals
  readonly activeFilter = signal<'ALL' | OrderStatus>('ALL');
  readonly filteredOrders = computed(() => {
    const allOrders = this.orders();
    const filter = this.activeFilter();
    if (filter === 'ALL') {
      return allOrders;
    }
    return allOrders.filter((o) => o.status === filter);
  });

  // Modal Signals
  readonly isCancelModalOpen = signal(false);
  readonly cancellationReason = signal('');
  readonly selectedOrderToCancel = signal<OrderResponse | null>(null);

  ngOnInit(): void {
    this.loadOrders();
  }

  loadOrders(): void {
    this.loading.set(true);
    this.errorMessage.set(null);

    this.orderService
      .getMyOrders()
      .pipe(finalize(() => this.loading.set(false)))
      .subscribe({
        next: (orders) => {
          const sorted = [...orders].sort((a, b) => (a.orderDate < b.orderDate ? 1 : -1));
          this.orders.set(sorted);
        },
        error: (error: unknown) => {
          this.errorMessage.set(this.resolveError(error, 'Could not load your orders.'));
        }
      });
  }

  cancelOrder(order: OrderResponse): void {
    if (!this.canCancel(order.status)) {
      return;
    }
    this.selectedOrderToCancel.set(order);
    this.cancellationReason.set('');
    this.isCancelModalOpen.set(true);
  }

  closeCancelModal(): void {
    this.selectedOrderToCancel.set(null);
    this.isCancelModalOpen.set(false);
  }

  confirmCancelOrder(): void {
    const order = this.selectedOrderToCancel();
    if (!order || !this.canCancel(order.status)) {
      return;
    }

    const reason = this.cancellationReason().trim() || null;
    this.isCancelModalOpen.set(false);
    this.infoMessage.set(null);
    this.errorMessage.set(null);
    this.cancellingOrderId.set(order.id);

    this.orderService
      .cancelOrder(order.id, reason)
      .pipe(finalize(() => this.cancellingOrderId.set(null)))
      .subscribe({
        next: (updated) => {
          this.orders.update((current) => current.map((item) => (item.id === updated.id ? updated : item)));
          this.infoMessage.set('Order cancelled successfully.');
          this.selectedOrderToCancel.set(null);
        },
        error: (error: unknown) => {
          this.errorMessage.set(this.resolveError(error, 'Could not cancel the order.'));
          this.selectedOrderToCancel.set(null);
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
