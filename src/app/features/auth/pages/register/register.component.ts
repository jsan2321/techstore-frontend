import { HttpErrorResponse } from '@angular/common/http';
import { AfterViewInit, Component, ElementRef, OnDestroy, ViewChild, inject, signal } from '@angular/core';
import {
  AbstractControl,
  FormBuilder,
  ReactiveFormsModule,
  ValidationErrors,
  ValidatorFn,
  Validators
} from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { finalize } from 'rxjs';
import { AuthService } from '../../../../core/auth/auth.service';
import { GoogleIdentityService } from '../../../../core/auth/google-identity.service';
import { RegisterRequest } from '../../models/auth.models';

const passwordsMatchValidator: ValidatorFn = (
  form: AbstractControl
): ValidationErrors | null => {
  const password = form.get('password')?.value as string | null;
  const confirmPassword = form.get('confirmPassword')?.value as string | null;

  if (!password || !confirmPassword) {
    return null;
  }

  return password === confirmPassword ? null : { passwordMismatch: true };
};

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink],
  templateUrl: './register.component.html'
})
export class RegisterComponent implements AfterViewInit, OnDestroy {
  @ViewChild('googleButtonHost', { static: false })
  private googleButtonHost?: ElementRef<HTMLDivElement>;

  private readonly formBuilder = inject(FormBuilder);
  private readonly authService = inject(AuthService);
  private readonly googleIdentityService = inject(GoogleIdentityService);
  private readonly router = inject(Router);

  readonly isSubmitting = signal(false);
  readonly errorMessage = signal<string | null>(null);
  readonly googleInfoMessage = signal<string | null>(null);

  readonly form = this.formBuilder.nonNullable.group(
    {
      firstName: ['', [Validators.required, Validators.maxLength(50)]],
      lastName: ['', [Validators.required, Validators.maxLength(50)]],
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]],
      confirmPassword: ['', [Validators.required]]
    },
    { validators: [passwordsMatchValidator] }
  );

  ngAfterViewInit(): void {
    void this.initializeGoogleSignIn();
  }

  ngOnDestroy(): void {
    this.googleIdentityService.cancelOneTap();
  }

  submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.errorMessage.set(null);
    this.isSubmitting.set(true);

    const { firstName, lastName, email, password } = this.form.getRawValue();
    const payload: RegisterRequest = { firstName, lastName, email, password };

    this.authService
      .register(payload)
      .pipe(finalize(() => this.isSubmitting.set(false)))
      .subscribe({
        next: () => {
          void this.router.navigate(['/auth/confirm-email'], {
            queryParams: { email }
          });
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

      if (error.status === 409) {
        return 'This email is already registered.';
      }
    }

    return 'Could not create account right now. Please try again.';
  }

  private async initializeGoogleSignIn(): Promise<void> {
    const clientId = this.googleIdentityService.getClientId();
    if (!clientId) {
      this.googleInfoMessage.set(
        'Google Sign-In is not configured yet. Add your Google Client ID in src/index.html.'
      );
      return;
    }

    try {
      await this.googleIdentityService.loadSdk();
      this.googleIdentityService.initialize(clientId, (credential) => {
        this.handleGoogleCredential(credential);
      });

      if (this.googleButtonHost?.nativeElement) {
        this.googleIdentityService.renderButton(this.googleButtonHost.nativeElement);
      }

      this.googleIdentityService.promptOneTap();
    } catch {
      this.googleInfoMessage.set('Could not load Google Sign-In. Please try again later.');
    }
  }

  private handleGoogleCredential(idToken: string): void {
    this.errorMessage.set(null);
    this.isSubmitting.set(true);

    this.authService
      .loginWithGoogle({ idToken })
      .pipe(finalize(() => this.isSubmitting.set(false)))
      .subscribe({
        next: () => {
          void this.router.navigate(['/shop']);
        },
        error: (error: unknown) => {
          this.errorMessage.set(this.resolveError(error));
        }
      });
  }
}
