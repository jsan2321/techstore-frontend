import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AdminService } from '../../services/admin.service';
import { AdminOrderResponse } from '../../models/admin.models';
import { LoadingSpinnerComponent } from '../../../../shared/components/loading-spinner/loading-spinner.component';

@Component({
  selector: 'app-admin-orders',
  standalone: true,
  imports: [CommonModule, FormsModule, LoadingSpinnerComponent],
  templateUrl: './admin-orders.component.html'
})
export class AdminOrdersComponent implements OnInit {
  private readonly adminService = inject(AdminService);

  readonly orders = signal<AdminOrderResponse[]>([]);
  readonly isLoading = signal(true);
  readonly errorMsg = signal<string | null>(null);

  // Search & Filter state
  readonly searchQuery = signal('');
  readonly statusFilter = signal<'ALL' | 'PENDING' | 'PROCESSING' | 'SHIPPED' | 'DELIVERED' | 'CANCELLED'>('ALL');

  // Drawer detail inspection
  readonly selectedOrder = signal<AdminOrderResponse | null>(null);

  // Custom Cancellation Modal State
  readonly isCancelModalOpen = signal(false);
  readonly cancellationReason = signal('');
  readonly orderToCancel = signal<AdminOrderResponse | null>(null);
  readonly isCancelling = signal(false);

  // Transition actions in progress
  readonly actionInProgress = signal<Set<number>>(new Set());

  // Filtered orders list
  readonly filteredOrders = computed(() => {
    const q = this.searchQuery().toLowerCase().trim();
    const status = this.statusFilter();

    return this.orders().filter((o) => {
      // Filter by Status
      const matchesStatus = status === 'ALL' || o.status === status;

      // Filter by Search Query (Customer Name, Email, or Order ID)
      const matchesSearch =
        !q ||
        o.id.toString().includes(q) ||
        (o.user &&
          (o.user.firstName.toLowerCase().includes(q) ||
            o.user.lastName.toLowerCase().includes(q) ||
            o.user.email.toLowerCase().includes(q))) ||
        (o.shippingAddress && o.shippingAddress.fullName.toLowerCase().includes(q));

      return matchesStatus && matchesSearch;
    });
  });

  ngOnInit(): void {
    this.loadOrders();
  }

  loadOrders(): void {
    this.isLoading.set(true);
    this.errorMsg.set(null);

    // Fetch page size 100 which clamps correctly on backend
    this.adminService.getOrders(0, 100).subscribe({
      next: (res) => {
        this.orders.set(res.content);
        this.isLoading.set(false);

        // If inspecting an order, refresh its reference inside the drawer
        const currentSelected = this.selectedOrder();
        if (currentSelected) {
          const updated = res.content.find((o) => o.id === currentSelected.id);
          if (updated) {
            this.selectedOrder.set(updated);
          }
        }
      },
      error: () => {
        this.errorMsg.set('Failed to load orders. Please try again.');
        this.isLoading.set(false);
      }
    });
  }

  setStatus(status: 'ALL' | 'PENDING' | 'PROCESSING' | 'SHIPPED' | 'DELIVERED' | 'CANCELLED'): void {
    this.statusFilter.set(status);
  }

  // FULFILLMENT LIFECYCLE TRANSITIONS

  processOrder(order: AdminOrderResponse): void {
    this.markInProgress(order.id);
    this.adminService.processOrder(order.id).subscribe({
      next: () => {
        this.clearInProgress(order.id);
        this.loadOrders();
      },
      error: () => this.clearInProgress(order.id)
    });
  }

  shipOrder(order: AdminOrderResponse): void {
    this.markInProgress(order.id);
    this.adminService.shipOrder(order.id).subscribe({
      next: () => {
        this.clearInProgress(order.id);
        this.loadOrders();
      },
      error: () => this.clearInProgress(order.id)
    });
  }

  deliverOrder(order: AdminOrderResponse): void {
    this.markInProgress(order.id);
    this.adminService.deliverOrder(order.id).subscribe({
      next: () => {
        this.clearInProgress(order.id);
        this.loadOrders();
      },
      error: () => this.clearInProgress(order.id)
    });
  }

  // CANCELLATION FLOW

  openCancelModal(order: AdminOrderResponse): void {
    this.orderToCancel.set(order);
    this.cancellationReason.set('');
    this.isCancelModalOpen.set(true);
  }

  closeCancelModal(): void {
    this.isCancelModalOpen.set(false);
    this.orderToCancel.set(null);
    this.cancellationReason.set('');
  }

  confirmCancelOrder(): void {
    const order = this.orderToCancel();
    if (!order) return;

    this.isCancelling.set(true);
    this.markInProgress(order.id);
    const reason = this.cancellationReason().trim() || undefined;

    this.adminService.cancelOrderAdmin(order.id, reason).subscribe({
      next: () => {
        this.isCancelling.set(false);
        this.clearInProgress(order.id);
        this.closeCancelModal();
        this.loadOrders();
      },
      error: () => {
        this.isCancelling.set(false);
        this.clearInProgress(order.id);
      }
    });
  }

  // DETAIL DRAWER MANAGEMENT

  openDetails(order: AdminOrderResponse): void {
    this.selectedOrder.set(order);
  }

  closeDetails(): void {
    this.selectedOrder.set(null);
  }

  // IN PROGRESS HELPERS

  private markInProgress(id: number): void {
    this.actionInProgress.update((set) => new Set([...set, id]));
  }

  private clearInProgress(id: number): void {
    this.actionInProgress.update((set) => {
      const next = new Set(set);
      next.delete(id);
      return next;
    });
  }

  isInProgress(id: number): boolean {
    return this.actionInProgress().has(id);
  }
}
