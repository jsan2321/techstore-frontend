import { Component, computed, inject } from '@angular/core';
import { ActivatedRoute } from '@angular/router';

@Component({
  selector: 'app-route-placeholder',
  standalone: true,
  template: `
    <section class="placeholder-card">
      <p class="eyebrow">Scaffold</p>
      <h2>{{ title() }}</h2>
      <p>{{ description() }}</p>
    </section>
  `,
  styles: [
    `
      .placeholder-card {
        border: 1px solid #e5ddd2;
        background: #fff;
        border-radius: 0.875rem;
        padding: 1rem 1.1rem;
      }

      .placeholder-card h2 {
        margin: 0;
        color: #222;
      }

      .placeholder-card p {
        margin: 0.55rem 0 0;
        color: #5c5c5c;
      }

      .eyebrow {
        margin: 0 0 0.4rem;
        color: #9c6a32;
        text-transform: uppercase;
        font-size: 0.75rem;
        letter-spacing: 0.04em;
      }
    `
  ]
})
export class RoutePlaceholderComponent {
  private readonly route = inject(ActivatedRoute);

  readonly title = computed(() => (this.route.snapshot.data['title'] as string) ?? 'Page');
  readonly description = computed(
    () => (this.route.snapshot.data['description'] as string) ?? 'This page is ready for implementation.'
  );
}
