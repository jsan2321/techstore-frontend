import { HttpErrorResponse } from '@angular/common/http';
import { Component, OnInit, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { finalize, switchMap } from 'rxjs';
import { AddressType, CreateAddressRequest, UpdateAddressRequest } from '../../models/user-profile.models';
import { UserProfileService } from '../../services/user-profile.service';

@Component({
  selector: 'app-address-form',
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink],
  templateUrl: './address-form.component.html'
})
export class AddressFormComponent implements OnInit {
  private readonly formBuilder = inject(FormBuilder);
  private readonly userProfileService = inject(UserProfileService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);

  readonly addressTypes: AddressType[] = ['SHIPPING', 'BILLING', 'BOTH'];

  readonly isEditMode = signal(false);
  readonly addressId = signal<number | null>(null);
  readonly isLoading = signal(false);
  readonly isSubmitting = signal(false);
  readonly errorMessage = signal<string | null>(null);

  readonly form = this.formBuilder.nonNullable.group({
    label: ['', [Validators.required, Validators.maxLength(50)]],
    recipientName: ['', [Validators.required, Validators.maxLength(100)]],
    street: ['', [Validators.required, Validators.maxLength(255)]],
    addressLine2: ['', [Validators.maxLength(255)]],
    city: ['', [Validators.required, Validators.maxLength(255)]],
    state: ['', [Validators.required, Validators.maxLength(255)]],
    zipCode: ['', [Validators.required, Validators.maxLength(255)]],
    country: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(2)]],
    type: ['SHIPPING' as AddressType, [Validators.required]],
    isDefault: [false]
  });

  ngOnInit(): void {
    const rawAddressId = this.route.snapshot.paramMap.get('addressId');

    if (!rawAddressId) {
      return;
    }

    const addressId = Number(rawAddressId);
    if (!Number.isInteger(addressId) || addressId <= 0) {
      this.errorMessage.set('Invalid address id.');
      return;
    }

    this.isEditMode.set(true);
    this.addressId.set(addressId);
    this.isLoading.set(true);

    this.userProfileService.getAddress(addressId).subscribe({
      next: (address) => {
        this.form.setValue({
          label: address.label,
          recipientName: address.recipientName,
          street: address.street,
          addressLine2: address.addressLine2 ?? '',
          city: address.city,
          state: address.state,
          zipCode: address.zipCode,
          country: address.country,
          type: this.ensureAddressType(address.type),
          isDefault: address.isDefault
        });
        this.isLoading.set(false);
      },
      error: (error: unknown) => {
        this.errorMessage.set(this.resolveError(error));
        this.isLoading.set(false);
      }
    });
  }

  submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.errorMessage.set(null);
    this.isSubmitting.set(true);

    const raw = this.form.getRawValue();
    const normalizedCountry = raw.country.toUpperCase();
    const normalizedAddressLine2 = raw.addressLine2.trim().length > 0 ? raw.addressLine2 : null;

    if (this.isEditMode()) {
      const id = this.addressId();
      if (!id) {
        this.errorMessage.set('Address id is missing.');
        this.isSubmitting.set(false);
        return;
      }

      const payload: UpdateAddressRequest = {
        label: raw.label,
        recipientName: raw.recipientName,
        street: raw.street,
        addressLine2: normalizedAddressLine2,
        city: raw.city,
        state: raw.state,
        zipCode: raw.zipCode,
        country: normalizedCountry,
        type: raw.type
      };

      this.userProfileService
        .updateAddress(id, payload)
        .pipe(
          switchMap(() => {
            if (raw.isDefault) {
              return this.userProfileService.setDefaultAddress(id);
            }

            return this.userProfileService.getAddress(id);
          }),
          finalize(() => this.isSubmitting.set(false))
        )
        .subscribe({
          next: () => {
            void this.router.navigate(['/profile/addresses']);
          },
          error: (error: unknown) => {
            this.errorMessage.set(this.resolveError(error));
          }
        });

      return;
    }

    const payload: CreateAddressRequest = {
      label: raw.label,
      recipientName: raw.recipientName,
      street: raw.street,
      addressLine2: normalizedAddressLine2,
      city: raw.city,
      state: raw.state,
      zipCode: raw.zipCode,
      country: normalizedCountry,
      type: raw.type,
      isDefault: raw.isDefault
    };

    this.userProfileService
      .createAddress(payload)
      .pipe(finalize(() => this.isSubmitting.set(false)))
      .subscribe({
        next: () => {
          void this.router.navigate(['/profile/addresses']);
        },
        error: (error: unknown) => {
          this.errorMessage.set(this.resolveError(error));
        }
      });
  }

  private ensureAddressType(value: string): AddressType {
    if (value === 'BILLING' || value === 'BOTH') {
      return value;
    }

    return 'SHIPPING';
  }

  private resolveError(error: unknown): string {
    if (error instanceof HttpErrorResponse) {
      const backendMessage = (error.error as { message?: unknown })?.message;
      if (typeof backendMessage === 'string' && backendMessage.trim().length > 0) {
        return backendMessage;
      }
    }

    return 'Could not save this address right now. Please try again.';
  }
}
