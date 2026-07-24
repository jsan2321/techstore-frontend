import { Component, inject, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { AdminService } from '../../services/admin.service';
import { CategoryItem } from '../../models/admin.models';

@Component({
  selector: 'app-admin-categories',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './admin-categories.component.html',
})
export class AdminCategoriesComponent implements OnInit {
  private readonly adminService = inject(AdminService);

  readonly categories = signal<CategoryItem[]>([]);
  readonly isLoading = signal(true);
  readonly errorMsg = signal<string | null>(null);
  readonly formError = signal<string | null>(null);

  // Modal state
  readonly showModal = signal(false);
  readonly editingCategory = signal<CategoryItem | null>(null);
  readonly categoryName = signal('');
  readonly isSaving = signal(false);

  // Delete confirm
  readonly confirmDeleteId = signal<number | null>(null);
  readonly isDeleting = signal(false);

  ngOnInit(): void {
    this.loadCategories();
  }

  loadCategories(): void {
    this.isLoading.set(true);
    this.errorMsg.set(null);
    this.adminService.getCategories().subscribe({
      next: (categories) => {
        this.categories.set(categories);
        this.isLoading.set(false);
      },
      error: () => {
        this.errorMsg.set('Failed to load categories.');
        this.isLoading.set(false);
      },
    });
  }

  openAdd(): void {
    this.editingCategory.set(null);
    this.categoryName.set('');
    this.formError.set(null);
    this.showModal.set(true);
  }

  openEdit(category: CategoryItem): void {
    this.editingCategory.set(category);
    this.categoryName.set(category.name);
    this.formError.set(null);
    this.showModal.set(true);
  }

  closeModal(): void {
    this.showModal.set(false);
  }

  saveCategory(): void {
    const name = this.categoryName().trim();
    if (!name || name.length < 2) {
      this.formError.set('Category name must be at least 2 characters.');
      return;
    }

    this.isSaving.set(true);
    this.formError.set(null);
    const editing = this.editingCategory();

    const op = editing
      ? this.adminService.updateCategory(editing.id, name)
      : this.adminService.createCategory(name);

    op.subscribe({
      next: (category) => {
        if (editing) {
          this.categories.update((list) =>
            list.map((c) => (c.id === category.id ? category : c))
          );
        } else {
          this.categories.update((list) => [...list, category]);
        }
        this.isSaving.set(false);
        this.showModal.set(false);
      },
      error: () => {
        this.formError.set('Failed to save category. It may already exist.');
        this.isSaving.set(false);
      },
    });
  }

  confirmDelete(id: number): void {
    this.confirmDeleteId.set(id);
  }

  cancelDelete(): void {
    this.confirmDeleteId.set(null);
  }

  executeDelete(id: number): void {
    this.isDeleting.set(true);
    this.adminService.deleteCategory(id).subscribe({
      next: () => {
        this.categories.update((list) => list.filter((c) => c.id !== id));
        this.confirmDeleteId.set(null);
        this.isDeleting.set(false);
      },
      error: () => {
        this.errorMsg.set('Could not delete category. It may still be in use.');
        this.confirmDeleteId.set(null);
        this.isDeleting.set(false);
      },
    });
  }
}
