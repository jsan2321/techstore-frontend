import { CommonModule } from '@angular/common';
import { Component, OnInit, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { finalize, switchMap } from 'rxjs';
import { CartItem, CartResponse } from '../../../../data/models/cart.models';
import { CartService } from '../../../../data/services/cart.service';
import { EmptyStateComponent } from '../../../../shared/components/empty-state/empty-state.component';
import { LoadingSpinnerComponent } from '../../../../shared/components/loading-spinner/loading-spinner.component';

@Component({
  selector: 'app-cart-home',
  standalone: true,
  imports: [CommonModule, RouterLink, EmptyStateComponent, LoadingSpinnerComponent],
  templateUrl: './cart-home.component.html'
})
export class CartHomeComponent implements OnInit {
  private readonly cartService = inject(CartService);

  readonly cart = signal<CartResponse | null>(null);
  readonly quantities = signal<Record<number, number>>({});
  readonly loading = signal(true);
  readonly errorMessage = signal<string | null>(null);
  readonly infoMessage = signal<string | null>(null);
  readonly updatingItemId = signal<number | null>(null);
  readonly removingItemId = signal<number | null>(null);
  readonly clearing = signal(false);

  ngOnInit(): void {
    this.loadCart();
  }

  loadCart(): void {
    this.loading.set(true);
    this.errorMessage.set(null);
    this.infoMessage.set(null);

    this.cartService
      .getCart()
      .pipe(finalize(() => this.loading.set(false)))
      .subscribe({
        next: (cart) => this.applyCart(cart),
        error: (error: unknown) => {
          this.errorMessage.set(this.resolveError(error, 'Could not load your cart.'));
        }
      });
  }

  setQuantity(productId: number, value: string): void {
    const parsed = Number.parseInt(value, 10);
    const next = Number.isFinite(parsed) && parsed > 0 ? parsed : 1;

    this.quantities.update((current) => ({
      ...current,
      [productId]: next
    }));
  }

  updateItemQuantity(item: CartItem): void {
    const quantities = this.quantities();
    const requested = quantities[item.productId] ?? item.quantity;

    if (requested === item.quantity) {
      return;
    }

    this.errorMessage.set(null);
    this.infoMessage.set(null);
    this.updatingItemId.set(item.productId);

    this.cartService
      .updateItemQuantity(item.productId, { quantity: requested })
      .pipe(finalize(() => this.updatingItemId.set(null)))
      .subscribe({
        next: (cart) => {
          this.applyCart(cart);
          this.infoMessage.set('Cart updated successfully.');
          setTimeout(() => this.infoMessage.set(null), 3000);
        },
        error: (error: unknown) => {
          this.errorMessage.set(this.resolveError(error, 'Could not update the cart item.'));
          setTimeout(() => this.errorMessage.set(null), 5000);
        }
      });
  }

  removeItem(item: CartItem): void {
    this.errorMessage.set(null);
    this.infoMessage.set(null);
    this.removingItemId.set(item.productId);

    this.cartService
      .removeItem(item.productId)
      .pipe(finalize(() => this.removingItemId.set(null)))
      .subscribe({
        next: (cart) => {
          this.applyCart(cart);
          this.infoMessage.set('Item removed from cart.');
        },
        error: (error: unknown) => {
          this.errorMessage.set(this.resolveError(error, 'Could not remove the cart item.'));
        }
      });
  }

  clearCart(): void {
    if (!this.cart()?.items.length) {
      return;
    }

    this.errorMessage.set(null);
    this.infoMessage.set(null);
    this.clearing.set(true);

    this.cartService
      .clearCart()
      .pipe(
        switchMap(() => this.cartService.getCart()),
        finalize(() => this.clearing.set(false))
      )
      .subscribe({
        next: (cart) => {
          this.applyCart(cart);
          this.infoMessage.set('Cart cleared successfully.');
        },
        error: (error: unknown) => {
          this.errorMessage.set(this.resolveError(error, 'Could not clear the cart.'));
        }
      });
  }

  private applyCart(cart: CartResponse): void {
    this.cart.set(cart);
    const map: Record<number, number> = {};
    cart.items.forEach((item) => {
      map[item.productId] = item.quantity;
    });
    this.quantities.set(map);
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
