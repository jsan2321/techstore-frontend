import { HttpErrorResponse } from '@angular/common/http';
import { Component, OnInit, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { finalize } from 'rxjs';
import { AuthService } from '../../../../core/auth/auth.service';
import { ResendEmailConfirmationRequest } from '../../models/auth.models';

@Component({
  selector: 'app-confirm-email',
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink],
  templateUrl: './confirm-email.component.html'
})
export class ConfirmEmailComponent implements OnInit {
  private readonly authService = inject(AuthService);
  private readonly route = inject(ActivatedRoute);
  private readonly formBuilder = inject(FormBuilder);

  readonly token = signal<string | null>(null);
  readonly email = signal<string | null>(null);

  readonly verificationStatus = signal<'idle' | 'verifying' | 'success' | 'error'>('idle');
  readonly errorMessage = signal<string | null>(null);

  readonly isResending = signal(false);
  readonly resendSuccess = signal<string | null>(null);
  readonly resendError = signal<string | null>(null);
  readonly showEmailInput = signal(false);

  readonly resendForm = this.formBuilder.nonNullable.group({
    email: ['', [Validators.required, Validators.email]]
  });

  ngOnInit(): void {
    this.route.queryParams.subscribe((params) => {
      const token = params['token'];
      const email = params['email'];

      this.token.set(token || null);
      this.email.set(email || null);

      if (email) {
        this.resendForm.controls.email.setValue(email);
        this.showEmailInput.set(false);
      } else {
        this.showEmailInput.set(true);
      }

      if (token) {
        this.confirm(token);
      } else {
        this.verificationStatus.set('idle');
      }
    });
  }

  confirm(token: string): void {
    this.verificationStatus.set('verifying');
    this.errorMessage.set(null);

    this.authService
      .confirmEmail(token)
      .pipe(finalize(() => {}))
      .subscribe({
        next: () => {
          this.verificationStatus.set('success');
        },
        error: (error: unknown) => {
          this.verificationStatus.set('error');
          this.errorMessage.set(this.resolveError(error));
        }
      });
  }

  resend(): void {
    let emailToSend = '';

    if (this.showEmailInput()) {
      if (this.resendForm.invalid) {
        this.resendForm.markAllAsTouched();
        return;
      }
      emailToSend = this.resendForm.controls.email.value;
    } else {
      emailToSend = this.email() || '';
    }

    if (!emailToSend) {
      this.resendError.set('Please enter a valid email address.');
      this.showEmailInput.set(true);
      return;
    }

    this.resendError.set(null);
    this.resendSuccess.set(null);
    this.isResending.set(true);

    const payload: ResendEmailConfirmationRequest = { email: emailToSend };

    this.authService
      .resendConfirmation(payload)
      .pipe(finalize(() => this.isResending.set(false)))
      .subscribe({
        next: () => {
          this.resendSuccess.set(`Confirmation email sent. Please check ${emailToSend}.`);
          this.email.set(emailToSend);
          this.showEmailInput.set(false);
        },
        error: (error: unknown) => {
          this.resendError.set(this.resolveError(error));
        }
      });
  }

  toggleEmailInput(): void {
    this.showEmailInput.set(!this.showEmailInput());
    if (this.showEmailInput() && this.email()) {
      this.resendForm.controls.email.setValue(this.email() || '');
    }
  }

  private resolveError(error: unknown): string {
    if (error instanceof HttpErrorResponse) {
      const backendMessage = (error.error as { message?: unknown })?.message;
      if (typeof backendMessage === 'string' && backendMessage.trim().length > 0) {
        return backendMessage;
      }

      if (error.status === 400) {
        return 'Invalid or expired confirmation token.';
      }
    }

    return 'Could not complete email confirmation right now.';
  }
}
