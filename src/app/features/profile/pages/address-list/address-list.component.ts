import { HttpErrorResponse } from '@angular/common/http';
import { Component, OnInit, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { finalize } from 'rxjs';
import { SavedAddress } from '../../models/user-profile.models';
import { UserProfileService } from '../../services/user-profile.service';

@Component({
  selector: 'app-address-list',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './address-list.component.html'
})
export class AddressListComponent implements OnInit {
  private readonly userProfileService = inject(UserProfileService);

  readonly loading = signal(true);
  readonly errorMessage = signal<string | null>(null);
  readonly infoMessage = signal<string | null>(null);
  readonly operationInProgressFor = signal<number | null>(null);
  readonly addresses = signal<SavedAddress[]>([]);

  ngOnInit(): void {
    this.loadAddresses();
  }

  refresh(): void {
    this.loadAddresses();
  }

  setDefault(addressId: number): void {
    this.errorMessage.set(null);
    this.infoMessage.set(null);
    this.operationInProgressFor.set(addressId);

    this.userProfileService
      .setDefaultAddress(addressId)
      .pipe(finalize(() => this.operationInProgressFor.set(null)))
      .subscribe({
        next: (updatedAddress) => {
          this.addresses.update((current) =>
            current.map((address) => ({
              ...address,
              isDefault: address.id === updatedAddress.id
            }))
          );
          this.infoMessage.set('Default address updated.');
        },
        error: (error: unknown) => {
          this.errorMessage.set(this.resolveError(error));
        }
      });
  }

  deleteAddress(addressId: number): void {
    const confirmed = globalThis.confirm('Delete this address?');
    if (!confirmed) {
      return;
    }

    this.errorMessage.set(null);
    this.infoMessage.set(null);
    this.operationInProgressFor.set(addressId);

    this.userProfileService
      .deleteAddress(addressId)
      .pipe(finalize(() => this.operationInProgressFor.set(null)))
      .subscribe({
        next: () => {
          this.addresses.update((current) => current.filter((address) => address.id !== addressId));
          this.infoMessage.set('Address deleted successfully.');
        },
        error: (error: unknown) => {
          this.errorMessage.set(this.resolveError(error));
        }
      });
  }

  private loadAddresses(): void {
    this.loading.set(true);
    this.errorMessage.set(null);
    this.infoMessage.set(null);

    this.userProfileService.listAddresses().subscribe({
      next: (addresses) => {
        this.addresses.set(addresses);
        this.loading.set(false);
      },
      error: (error: unknown) => {
        this.errorMessage.set(this.resolveError(error));
        this.loading.set(false);
      }
    });
  }

  private resolveError(error: unknown): string {
    if (error instanceof HttpErrorResponse) {
      const backendMessage = (error.error as { message?: unknown })?.message;
      if (typeof backendMessage === 'string' && backendMessage.trim().length > 0) {
        return backendMessage;
      }
    }

    return 'Could not process your address request right now. Please try again.';
  }
}
