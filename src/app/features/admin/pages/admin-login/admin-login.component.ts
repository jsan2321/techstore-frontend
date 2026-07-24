import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { finalize } from 'rxjs';
import { AdminService } from '../../services/admin.service';
import { HttpErrorResponse } from '@angular/common/http';

@Component({
  selector: 'app-admin-login',
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink],
  templateUrl: './admin-login.component.html',
})
export class AdminLoginComponent {
  private readonly fb = inject(FormBuilder);
  private readonly adminService = inject(AdminService);
  private readonly router = inject(Router);

  readonly isSubmitting = signal(false);
  readonly errorMessage = signal<string | null>(null);

  readonly form = this.fb.nonNullable.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required]],
  });

  submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.errorMessage.set(null);
    this.isSubmitting.set(true);

    this.adminService
      .adminLogin(this.form.getRawValue())
      .pipe(finalize(() => this.isSubmitting.set(false)))
      .subscribe({
        next: () => void this.router.navigate(['/admin']),
        error: (err: unknown) => this.errorMessage.set(this.resolveError(err)),
      });
  }

  private resolveError(err: unknown): string {
    if (err instanceof HttpErrorResponse) {
      if (err.status === 403) return "Access denied. You don't have admin privileges.";
      if (err.status === 401) return 'Invalid email or password.';
      const msg = (err.error as { message?: unknown })?.message;
      if (typeof msg === 'string' && msg.trim()) return msg;
    }
    return 'Could not sign in right now. Please try again.';
  }
}
