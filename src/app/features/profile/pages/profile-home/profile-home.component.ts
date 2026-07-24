import { HttpErrorResponse } from '@angular/common/http';
import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { finalize } from 'rxjs';
import { AuthService } from '../../../../core/auth/auth.service';
import { ChangePasswordRequest, UpdateUserProfileRequest, UserProfile } from '../../models/user-profile.models';
import { UserProfileService } from '../../services/user-profile.service';

@Component({
  selector: 'app-profile-home',
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink],
  templateUrl: './profile-home.component.html'
})
export class ProfileHomeComponent implements OnInit {
  private readonly formBuilder = inject(FormBuilder);
  private readonly userProfileService = inject(UserProfileService);
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);

  readonly loading = signal(true);
  readonly errorMessage = signal<string | null>(null);
  readonly updateErrorMessage = signal<string | null>(null);
  readonly passwordErrorMessage = signal<string | null>(null);
  readonly deactivateErrorMessage = signal<string | null>(null);
  readonly updateSuccessMessage = signal<string | null>(null);
  readonly passwordSuccessMessage = signal<string | null>(null);
  readonly deactivateSubmitting = signal(false);
  readonly profileSubmitting = signal(false);
  readonly passwordSubmitting = signal(false);
  readonly user = signal<UserProfile | null>(null);

  readonly isEditingProfile = signal(false);
  readonly showPasswordForm = signal(false);
  readonly showDeactivateForm = signal(false);

  readonly fullName = computed(() => {
    const profile = this.user();
    if (!profile) {
      return '';
    }

    return profile.firstName + ' ' + profile.lastName;
  });

  readonly profileForm = this.formBuilder.nonNullable.group({
    firstName: ['', [Validators.required, Validators.maxLength(50)]],
    lastName: ['', [Validators.required, Validators.maxLength(50)]],
    phoneNumber: ['', [Validators.required, Validators.maxLength(15)]]
  });

  readonly passwordForm = this.formBuilder.nonNullable.group({
    currentPassword: ['', [Validators.required]],
    newPassword: ['', [Validators.required, Validators.minLength(6)]],
    confirmPassword: ['', [Validators.required]]
  });

  readonly deactivateForm = this.formBuilder.nonNullable.group({
    confirmText: ['', [Validators.required]]
  });

  ngOnInit(): void {
    this.loadProfile();
  }

  refresh(): void {
    this.clearMessages();
    this.loadProfile();
  }

  startEditingProfile(): void {
    this.clearMessages();
    this.isEditingProfile.set(true);
    this.profileForm.enable();
  }

  cancelEditingProfile(): void {
    this.clearMessages();
    this.isEditingProfile.set(false);
    const profile = this.user();
    if (profile) {
      this.profileForm.setValue({
        firstName: profile.firstName,
        lastName: profile.lastName,
        phoneNumber: profile.phoneNumber ?? ''
      });
    }
    this.profileForm.disable();
  }

  updateProfile(): void {
    if (this.profileForm.invalid) {
      this.profileForm.markAllAsTouched();
      return;
    }

    this.updateErrorMessage.set(null);
    this.updateSuccessMessage.set(null);
    this.profileSubmitting.set(true);

    const payload: UpdateUserProfileRequest = this.profileForm.getRawValue();

    this.userProfileService
      .updateCurrentUser(payload)
      .pipe(finalize(() => this.profileSubmitting.set(false)))
      .subscribe({
        next: (profile) => {
          this.user.set(profile);
          this.profileForm.setValue({
            firstName: profile.firstName,
            lastName: profile.lastName,
            phoneNumber: profile.phoneNumber ?? ''
          });
          this.profileForm.disable();
          this.isEditingProfile.set(false);
          this.updateSuccessMessage.set('Profile updated successfully.');
        },
        error: (error: unknown) => {
          this.updateErrorMessage.set(this.resolveError(error));
        }
      });
  }

  changePassword(): void {
    if (this.passwordForm.invalid) {
      this.passwordForm.markAllAsTouched();
      return;
    }

    const raw = this.passwordForm.getRawValue();
    if (raw.newPassword !== raw.confirmPassword) {
      this.passwordErrorMessage.set('Passwords do not match.');
      return;
    }

    this.passwordErrorMessage.set(null);
    this.passwordSuccessMessage.set(null);
    this.passwordSubmitting.set(true);

    const payload: ChangePasswordRequest = raw;

    this.userProfileService
      .changePassword(payload)
      .pipe(finalize(() => this.passwordSubmitting.set(false)))
      .subscribe({
        next: () => {
          this.passwordSuccessMessage.set('Password updated successfully.');
          this.passwordForm.reset({
            currentPassword: '',
            newPassword: '',
            confirmPassword: ''
          });
          setTimeout(() => {
            this.showPasswordForm.set(false);
            this.passwordSuccessMessage.set(null);
          }, 3000);
        },
        error: (error: unknown) => {
          this.passwordErrorMessage.set(this.resolveError(error));
        }
      });
  }

  deactivateAccount(): void {
    const confirmText = this.deactivateForm.controls.confirmText.value.trim();
    if (confirmText !== 'DEACTIVATE') {
      this.deactivateErrorMessage.set('Type DEACTIVATE to confirm account deactivation.');
      return;
    }

    this.deactivateErrorMessage.set(null);
    this.deactivateSubmitting.set(true);

    this.userProfileService
      .deactivateCurrentUser()
      .pipe(finalize(() => this.deactivateSubmitting.set(false)))
      .subscribe({
        next: () => {
          this.authService.clearSession();
          void this.router.navigate(['/auth/login'], {
            queryParams: { deactivated: '1' }
          });
        },
        error: (error: unknown) => {
          this.deactivateErrorMessage.set(this.resolveError(error));
        }
      });
  }

  private loadProfile(): void {
    this.loading.set(true);
    this.errorMessage.set(null);

    this.userProfileService.getCurrentUser().subscribe({
      next: (profile) => {
        this.user.set(profile);
        this.profileForm.setValue({
          firstName: profile.firstName,
          lastName: profile.lastName,
          phoneNumber: profile.phoneNumber ?? ''
        });
        this.profileForm.disable();
        this.isEditingProfile.set(false);
        this.loading.set(false);
      },
      error: (error: unknown) => {
        this.errorMessage.set(this.resolveError(error));
        this.loading.set(false);
      }
    });
  }

  private clearMessages(): void {
    this.errorMessage.set(null);
    this.updateErrorMessage.set(null);
    this.passwordErrorMessage.set(null);
    this.deactivateErrorMessage.set(null);
    this.updateSuccessMessage.set(null);
    this.passwordSuccessMessage.set(null);
  }

  private resolveError(error: unknown): string {
    if (error instanceof HttpErrorResponse) {
      const backendMessage = (error.error as { message?: unknown })?.message;
      if (typeof backendMessage === 'string' && backendMessage.trim().length > 0) {
        return backendMessage;
      }
    }

    return 'Could not load your profile right now. Please try again.';
  }
}
