import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-empty-state',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="rounded-3xl border border-dashed border-neutral-300 bg-neutral-50/70 p-8 sm:p-12 text-center flex flex-col items-center justify-center">
      <div class="flex h-14 w-14 items-center justify-center rounded-2xl bg-white border border-neutral-200 text-neutral-400 shadow-sm mb-4">
        <svg class="h-7 w-7 text-neutral-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5">
          <path stroke-linecap="round" stroke-linejoin="round" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
        </svg>
      </div>
      <h3 class="text-lg font-bold text-neutral-900">{{ title }}</h3>
      <p class="mt-1.5 max-w-md text-sm text-neutral-500 leading-relaxed">{{ message }}</p>
      <ng-content></ng-content>
    </div>
  `
})
export class EmptyStateComponent {
  @Input() title = 'Nothing to show';
  @Input() message = 'Try adjusting your filters or check back later.';
}
