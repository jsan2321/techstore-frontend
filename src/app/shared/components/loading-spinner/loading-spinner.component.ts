import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-loading-spinner',
  standalone: true,
  template: `
    <div class="flex items-center justify-center gap-3 text-sm text-[color:var(--ink-700)]">
      <span
        class="inline-flex h-9 w-9 animate-spin rounded-full border-2 border-[color:var(--sand-300)] border-t-[color:var(--accent-600)]"
      ></span>
      <span>{{ label }}</span>
    </div>
  `
})
export class LoadingSpinnerComponent {
  @Input() label = 'Loading...';
}
