import { HttpErrorResponse } from '@angular/common/http';
import { AfterViewInit, Component, ElementRef, OnDestroy, ViewChild, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { finalize } from 'rxjs';
import { AuthService } from '../../../../core/auth/auth.service';
import { GoogleIdentityService } from '../../../../core/auth/google-identity.service';
import { LoginRequest } from '../../models/auth.models';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink],
  templateUrl: './login.component.html'
})
export class LoginComponent implements AfterViewInit, OnDestroy {
  @ViewChild('googleButtonHost', { static: false })
  private googleButtonHost?: ElementRef<HTMLDivElement>;

  private readonly formBuilder = inject(FormBuilder);
  private readonly authService = inject(AuthService);
  private readonly googleIdentityService = inject(GoogleIdentityService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);

  readonly isSubmitting = signal(false);
  readonly errorMessage = signal<string | null>(null);
  readonly googleInfoMessage = signal<string | null>(null);
  readonly infoMessage = signal<string | null>(this.resolveInfoMessage());

  readonly form = this.formBuilder.nonNullable.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required]]
  });

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
    this.infoMessage.set(null);
    this.isSubmitting.set(true);

    const payload: LoginRequest = this.form.getRawValue();

    this.authService
      .login(payload)
      .pipe(finalize(() => this.isSubmitting.set(false)))
      .subscribe({
        next: () => {
          const returnUrl = this.route.snapshot.queryParamMap.get('returnUrl') || '/shop';
          void this.router.navigateByUrl(returnUrl);
        },
        error: (error: unknown) => {
          this.errorMessage.set(this.resolveError(error));
        }
      });
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
          const returnUrl = this.route.snapshot.queryParamMap.get('returnUrl') || '/shop';
          void this.router.navigateByUrl(returnUrl);
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

      if (error.status === 401) {
        return 'Invalid email or password.';
      }
    }

    return 'Could not sign in right now. Please try again.';
  }

  private resolveInfoMessage(): string | null {
    const query = this.route.snapshot.queryParamMap;

    if (query.get('reset') === '1') {
      return 'Password updated successfully. Please sign in.';
    }

    return null;
  }
}
