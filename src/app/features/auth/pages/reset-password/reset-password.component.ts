import { HttpErrorResponse } from '@angular/common/http';
import { Component, inject, signal } from '@angular/core';
import {
  AbstractControl,
  FormBuilder,
  ReactiveFormsModule,
  ValidationErrors,
  ValidatorFn,
  Validators
} from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { finalize } from 'rxjs';
import { AuthService } from '../../../../core/auth/auth.service';
import { ResetPasswordRequest } from '../../models/auth.models';

const passwordsMatchValidator: ValidatorFn = (
  form: AbstractControl
): ValidationErrors | null => {
  const newPassword = form.get('newPassword')?.value as string | null;
  const confirmPassword = form.get('confirmPassword')?.value as string | null;

  if (!newPassword || !confirmPassword) {
    return null;
  }

  return newPassword === confirmPassword ? null : { passwordMismatch: true };
};

@Component({
  selector: 'app-reset-password',
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink],
  templateUrl: './reset-password.component.html'
})
export class ResetPasswordComponent {
  private readonly formBuilder = inject(FormBuilder);
  private readonly authService = inject(AuthService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);

  private readonly token = this.route.snapshot.queryParamMap.get('token') ?? '';

  readonly isSubmitting = signal(false);
  readonly successMessage = signal<string | null>(null);
  readonly errorMessage = signal<string | null>(
    this.token ? null : 'No reset token found. Please use the link from your email.'
  );

  readonly form = this.formBuilder.nonNullable.group(
    {
      newPassword: ['', [Validators.required, Validators.minLength(6)]],
      confirmPassword: ['', [Validators.required]]
    },
    { validators: [passwordsMatchValidator] }
  );

  submit(): void {
    if (!this.token) {
      this.errorMessage.set('No reset token found. Please use the link from your email.');
      return;
    }

    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.successMessage.set(null);
    this.errorMessage.set(null);
    this.isSubmitting.set(true);

    const payload: ResetPasswordRequest = {
      token: this.token,
      ...this.form.getRawValue()
    };

    this.authService
      .resetPassword(payload)
      .pipe(finalize(() => this.isSubmitting.set(false)))
      .subscribe({
        next: () => {
          this.successMessage.set('Password updated successfully. You can now sign in.');
          void this.router.navigate(['/auth/login'], { queryParams: { reset: '1' } });
        },
        error: (error: unknown) => {
          this.errorMessage.set(this.resolveError(error));
        }
      });
  }

  private resolveError(error: unknown): string {
    if (error instanceof HttpErrorResponse) {
      const backendMessage = (error.error as { message?: unknown })?.message;
      if (typeof backendMessage === 'string' && backendMessage.trim().length > 0) {
        return backendMessage;
      }

      if (error.status === 400) {
        return 'Invalid or expired reset token.';
      }
    }

    return 'Could not reset password right now. Please try again.';
  }
}
