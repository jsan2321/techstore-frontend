import { HttpErrorResponse } from '@angular/common/http';
import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { finalize } from 'rxjs';
import { AuthService } from '../../../../core/auth/auth.service';
import { ForgotPasswordRequest } from '../../models/auth.models';

@Component({
  selector: 'app-forgot-password',
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink],
  templateUrl: './forgot-password.component.html'
})
export class ForgotPasswordComponent {
  private readonly formBuilder = inject(FormBuilder);
  private readonly authService = inject(AuthService);

  readonly isSubmitting = signal(false);
  readonly successMessage = signal<string | null>(null);
  readonly errorMessage = signal<string | null>(null);

  readonly form = this.formBuilder.nonNullable.group({
    email: ['', [Validators.required, Validators.email]]
  });

  submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.successMessage.set(null);
    this.errorMessage.set(null);
    this.isSubmitting.set(true);

    const payload: ForgotPasswordRequest = this.form.getRawValue();

    this.authService
      .forgotPassword(payload)
      .pipe(finalize(() => this.isSubmitting.set(false)))
      .subscribe({
        next: () => {
          this.successMessage.set('If the email exists, a reset link has been sent.');
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
    }

    return 'Could not process the request. Please try again.';
  }
}
