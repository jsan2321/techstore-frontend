import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-empty-state',
  standalone: true,
  template: `
    <div class="rounded-3xl border border-dashed border-[color:var(--sand-300)] bg-white/70 px-6 py-8 text-center">
      <h3 class="text-xl font-semibold text-[color:var(--ink-900)]">{{ title }}</h3>
      <p class="mt-2 text-sm text-[color:var(--ink-700)]">{{ message }}</p>
    </div>
  `
})
export class EmptyStateComponent {
  @Input() title = 'Nothing to show';
  @Input() message = 'Try adjusting your filters or check back later.';
}
