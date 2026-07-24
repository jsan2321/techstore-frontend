import { CommonModule } from '@angular/common';
import { Component, OnInit, inject, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { finalize } from 'rxjs';
import { OrderResponse } from '../../../../data/models/order.models';
import { CartService } from '../../../../data/services/cart.service';
import { OrderService } from '../../../../data/services/order.service';
import { LoadingSpinnerComponent } from '../../../../shared/components/loading-spinner/loading-spinner.component';

const PENDING_ORDER_ID_KEY = 'pending_order_id';
const PENDING_PROVIDER_ORDER_KEY = 'pending_provider_order_id';

@Component({
  selector: 'app-payment-status',
  standalone: true,
  imports: [CommonModule, RouterLink, LoadingSpinnerComponent],
  templateUrl: './payment-status.component.html'
})
export class PaymentStatusComponent implements OnInit {
  private readonly orderService = inject(OrderService);
  private readonly cartService = inject(CartService);
  private readonly route = inject(ActivatedRoute);

  readonly loading = signal(true);
  readonly isCancelled = signal(false);
  readonly errorMessage = signal<string | null>(null);
  readonly order = signal<OrderResponse | null>(null);

  ngOnInit(): void {
    const isCancelPath = window.location.pathname.includes('/cancel');
    this.isCancelled.set(isCancelPath);

    if (isCancelPath) {
      this.loadCancelledOrder();
    } else {
      this.capturePayment();
    }
  }

  private capturePayment(): void {
    const orderId = this.getPendingOrderId();
    if (!orderId) {
      this.loading.set(false);
      this.errorMessage.set('Missing order reference. Please check your order history.');
      return;
    }

    const providerOrderId = this.getProviderOrderId();

    this.orderService
      .capturePayPalPayment(orderId, providerOrderId)
      .pipe(finalize(() => this.loading.set(false)))
      .subscribe({
        next: (order) => {
          this.order.set(order);
          this.cartService.resetCart();
          sessionStorage.removeItem(PENDING_ORDER_ID_KEY);
          sessionStorage.removeItem(PENDING_PROVIDER_ORDER_KEY);
        },
        error: (error: unknown) => {
          this.errorMessage.set(this.resolveError(error, 'Payment capture failed.'));
        }
      });
  }

  private loadCancelledOrder(): void {
    const orderId = this.getPendingOrderId();
    if (!orderId) {
      this.loading.set(false);
      this.errorMessage.set('Missing order reference.');
      return;
    }

    this.orderService
      .cancelOrder(orderId, 'PayPal checkout cancelled by user')
      .subscribe({
        next: (order) => {
          this.order.set(order);
          this.loading.set(false);
          sessionStorage.removeItem(PENDING_ORDER_ID_KEY);
          sessionStorage.removeItem(PENDING_PROVIDER_ORDER_KEY);
        },
        error: (error: unknown) => {
          // Fall back to just fetching the order details if cancel API fails (e.g. if already cancelled)
          this.orderService
            .getOrderById(orderId)
            .pipe(finalize(() => this.loading.set(false)))
            .subscribe({
              next: (order) => {
                this.order.set(order);
              },
              error: (err: unknown) => {
                this.errorMessage.set(this.resolveError(err, 'Could not retrieve order details.'));
              }
            });
        }
      });
  }

  private getPendingOrderId(): number | null {
    const query = this.route.snapshot.queryParamMap.get('orderId');
    const stored = sessionStorage.getItem(PENDING_ORDER_ID_KEY);
    const value = query ?? stored;

    if (!value) {
      return null;
    }

    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
  }

  private getProviderOrderId(): string | null {
    const queryToken = this.route.snapshot.queryParamMap.get('token');
    if (queryToken) {
      return queryToken;
    }

    const stored = sessionStorage.getItem(PENDING_PROVIDER_ORDER_KEY);
    return stored ?? null;
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
