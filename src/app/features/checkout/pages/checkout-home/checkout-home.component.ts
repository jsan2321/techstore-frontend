import { CommonModule } from '@angular/common';
import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { finalize, forkJoin } from 'rxjs';
import { CartResponse } from '../../../../data/models/cart.models';
import { ShippingAddressRequest } from '../../../../data/models/order.models';
import { CartService } from '../../../../data/services/cart.service';
import { OrderService } from '../../../../data/services/order.service';
import { UserProfileService } from '../../../../features/profile/services/user-profile.service';
import { SavedAddress } from '../../../../features/profile/models/user-profile.models';
import { EmptyStateComponent } from '../../../../shared/components/empty-state/empty-state.component';
import { LoadingSpinnerComponent } from '../../../../shared/components/loading-spinner/loading-spinner.component';

const PENDING_ORDER_ID_KEY = 'pending_order_id';
const PENDING_PROVIDER_ORDER_KEY = 'pending_provider_order_id';

@Component({
  selector: 'app-checkout-home',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, EmptyStateComponent, LoadingSpinnerComponent],
  templateUrl: './checkout-home.component.html'
})
export class CheckoutHomeComponent implements OnInit {
  private readonly cartService = inject(CartService);
  private readonly orderService = inject(OrderService);
  private readonly userProfileService = inject(UserProfileService);
  private readonly formBuilder = inject(FormBuilder);
  private readonly router = inject(Router);

  readonly loading = signal(true);
  readonly submitting = signal(false);
  readonly errorMessage = signal<string | null>(null);
  readonly cart = signal<CartResponse | null>(null);
  readonly addresses = signal<SavedAddress[]>([]);
  readonly addressMode = signal<'saved' | 'new'>('saved');
  readonly selectedAddressId = signal<number | null>(null);

  readonly hasSavedAddresses = computed(() => this.addresses().length > 0);

  readonly newAddressForm = this.formBuilder.nonNullable.group({
    fullName: ['', [Validators.required, Validators.maxLength(100)]],
    street: ['', [Validators.required, Validators.maxLength(255)]],
    addressLine2: ['', [Validators.maxLength(100)]],
    city: ['', [Validators.required, Validators.maxLength(100)]],
    state: ['', [Validators.required, Validators.maxLength(100)]],
    postalCode: ['', [Validators.required, Validators.maxLength(20)]],
    country: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(2)]],
    deliveryNotes: ['', [Validators.maxLength(500)]]
  });

  ngOnInit(): void {
    this.loadCheckoutData();
  }

  loadCheckoutData(): void {
    this.loading.set(true);
    this.errorMessage.set(null);

    forkJoin({
      cart: this.cartService.getCart(),
      addresses: this.userProfileService.listAddresses()
    })
      .pipe(finalize(() => this.loading.set(false)))
      .subscribe({
        next: ({ cart, addresses }) => {
          this.cart.set(cart);
          this.addresses.set(addresses);
          this.setDefaultAddressSelection(addresses);
          if (!addresses.length) {
            this.addressMode.set('new');
          }
        },
        error: (error: unknown) => {
          this.errorMessage.set(this.resolveError(error, 'Could not load checkout details.'));
        }
      });
  }

  setMode(mode: 'saved' | 'new'): void {
    this.addressMode.set(mode);
  }

  selectAddress(addressId: number): void {
    this.selectedAddressId.set(addressId);
  }

  placeOrder(): void {
    if (!this.cart() || this.cart()!.items.length === 0) {
      this.errorMessage.set('Your cart is empty.');
      return;
    }

    const mode = this.addressMode();
    const addressPayload = mode === 'new' ? this.buildNewAddressPayload() : this.buildSavedAddressPayload();
    if (!addressPayload) {
      return;
    }

    this.errorMessage.set(null);
    this.submitting.set(true);

    this.orderService
      .placeOrder({
        shippingAddress: addressPayload,
        deliveryNotes: addressPayload.deliveryNotes,
        paymentMethod: 'PAYPAL'
      })
      .pipe(finalize(() => this.submitting.set(false)))
      .subscribe({
        next: (order) => {
          const orderId = order.id;
          sessionStorage.setItem(PENDING_ORDER_ID_KEY, String(orderId));
          this.initiatePayPal(orderId);
        },
        error: (error: unknown) => {
          this.errorMessage.set(this.resolveError(error, 'Could not place your order.'));
        }
      });
  }

  private initiatePayPal(orderId: number): void {
    this.submitting.set(true);

    this.orderService
      .initiatePayPalPayment(orderId)
      .pipe(finalize(() => this.submitting.set(false)))
      .subscribe({
        next: (response) => {
          sessionStorage.setItem(PENDING_PROVIDER_ORDER_KEY, response.providerOrderId);
          window.location.assign(response.approvalUrl);
        },
        error: (error: unknown) => {
          this.errorMessage.set(this.resolveError(error, 'Could not start PayPal checkout.'));
        }
      });
  }

  private buildNewAddressPayload(): ShippingAddressRequest | null {
    if (this.newAddressForm.invalid) {
      this.newAddressForm.markAllAsTouched();
      this.errorMessage.set('Please complete the shipping address form.');
      return null;
    }

    const raw = this.newAddressForm.getRawValue();

    return {
      fullName: raw.fullName,
      street: raw.street,
      addressLine2: raw.addressLine2.trim() ? raw.addressLine2 : null,
      city: raw.city,
      state: raw.state,
      postalCode: raw.postalCode,
      country: raw.country.toUpperCase(),
      deliveryNotes: raw.deliveryNotes.trim() ? raw.deliveryNotes : null
    };
  }

  private buildSavedAddressPayload(): ShippingAddressRequest | null {
    const addressId = this.selectedAddressId();
    const address = this.addresses().find((item) => item.id === addressId);

    if (!address) {
      this.errorMessage.set('Please select a saved address.');
      return null;
    }

    const notes = this.newAddressForm.controls.deliveryNotes.value?.trim() ?? '';

    return {
      fullName: address.recipientName,
      street: address.street,
      addressLine2: address.addressLine2,
      city: address.city,
      state: address.state,
      postalCode: address.zipCode,
      country: address.country,
      deliveryNotes: notes.length ? notes : null
    };
  }

  private setDefaultAddressSelection(addresses: SavedAddress[]): void {
    if (!addresses.length) {
      this.selectedAddressId.set(null);
      return;
    }

    const defaultAddress = addresses.find((address) => address.isDefault) ?? addresses[0];
    this.selectedAddressId.set(defaultAddress.id);
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
