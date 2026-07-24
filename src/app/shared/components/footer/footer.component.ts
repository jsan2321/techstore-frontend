import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-footer',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule],
  templateUrl: './footer.component.html'
})
export class FooterComponent {
  readonly email = signal('');
  readonly subscribed = signal(false);
  readonly isSubmitting = signal(false);

  subscribeNewsletter(): void {
    const emailVal = this.email().trim();
    if (!emailVal || !emailVal.includes('@')) {
      return;
    }
    this.isSubmitting.set(true);
    setTimeout(() => {
      this.isSubmitting.set(false);
      this.subscribed.set(true);
      this.email.set('');
      setTimeout(() => this.subscribed.set(false), 5000);
    }, 1000);
  }
}
