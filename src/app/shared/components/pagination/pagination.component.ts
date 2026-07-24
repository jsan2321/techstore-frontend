import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';

@Component({
  selector: 'app-pagination',
  standalone: true,
  imports: [CommonModule],
  template: `
    @if (totalPages > 1) {
      <nav class="flex flex-wrap items-center justify-between gap-3" aria-label="Pagination">
        <div class="text-sm text-[color:var(--ink-700)]">
          Page {{ page + 1 }} of {{ totalPages }}
        </div>
        <div class="flex flex-wrap items-center gap-2">
          <button
            type="button"
            class="rounded-full border border-[color:var(--sand-300)] bg-white px-3 py-1.5 text-xs font-semibold uppercase tracking-widest text-[color:var(--ink-700)] transition hover:border-[color:var(--accent-600)] hover:text-[color:var(--accent-600)] disabled:cursor-not-allowed disabled:opacity-40"
            [disabled]="page <= 0"
            (click)="pageChange.emit(page - 1)"
          >
            Prev
          </button>
          @for (pageIndex of pages; track pageIndex) {
            <button
              type="button"
              class="h-9 w-9 rounded-full border text-sm font-semibold transition"
              [ngClass]="
                pageIndex === page
                  ? 'border-[color:var(--accent-600)] bg-[color:var(--accent-600)] text-white'
                  : 'border-[color:var(--sand-300)] bg-white text-[color:var(--ink-700)] hover:border-[color:var(--accent-600)] hover:text-[color:var(--accent-600)]'
              "
              (click)="pageChange.emit(pageIndex)"
            >
              {{ pageIndex + 1 }}
            </button>
          }
          <button
            type="button"
            class="rounded-full border border-[color:var(--sand-300)] bg-white px-3 py-1.5 text-xs font-semibold uppercase tracking-widest text-[color:var(--ink-700)] transition hover:border-[color:var(--accent-600)] hover:text-[color:var(--accent-600)] disabled:cursor-not-allowed disabled:opacity-40"
            [disabled]="page >= totalPages - 1"
            (click)="pageChange.emit(page + 1)"
          >
            Next
          </button>
        </div>
      </nav>
    }
  `
})
export class PaginationComponent {
  @Input() page = 0;
  @Input() totalPages = 0;
  @Output() pageChange = new EventEmitter<number>();

  get pages(): number[] {
    const count = Math.min(this.totalPages, 5);
    const start = Math.max(0, Math.min(this.page - 2, this.totalPages - count));
    return Array.from({ length: count }, (_, index) => start + index);
  }
}
