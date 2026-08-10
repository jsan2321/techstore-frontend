import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { AdminService } from '../../services/admin.service';
import { BrandItem } from '../../models/admin.models';

@Component({
  selector: 'app-admin-brands',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './admin-brands.component.html',
})
export class AdminBrandsComponent implements OnInit {
  private readonly adminService = inject(AdminService);

  readonly brands = signal<BrandItem[]>([]);
  readonly searchQuery = signal('');
  readonly filteredBrands = computed(() => {
    const query = this.searchQuery().toLowerCase().trim();
    if (!query) return this.brands();
    return this.brands().filter(b => b.name.toLowerCase().includes(query));
  });
  readonly isLoading = signal(true);
  readonly errorMsg = signal<string | null>(null);
  readonly formError = signal<string | null>(null);

  // Modal state
  readonly showModal = signal(false);
  readonly editingBrand = signal<BrandItem | null>(null);
  readonly brandName = signal('');
  readonly isSaving = signal(false);

  // Delete confirm
  readonly confirmDeleteId = signal<number | null>(null);
  readonly isDeleting = signal(false);

  ngOnInit(): void {
    this.loadBrands();
  }

  loadBrands(): void {
    this.isLoading.set(true);
    this.errorMsg.set(null);
    this.adminService.getBrands().subscribe({
      next: (brands) => {
        this.brands.set(brands);
        this.isLoading.set(false);
      },
      error: () => {
        this.errorMsg.set('Failed to load brands.');
        this.isLoading.set(false);
      },
    });
  }

  openAdd(): void {
    this.editingBrand.set(null);
    this.brandName.set('');
    this.formError.set(null);
    this.showModal.set(true);
  }

  openEdit(brand: BrandItem): void {
    this.editingBrand.set(brand);
    this.brandName.set(brand.name);
    this.formError.set(null);
    this.showModal.set(true);
  }

  closeModal(): void {
    this.showModal.set(false);
  }

  saveBrand(): void {
    const name = this.brandName().trim();
    if (!name || name.length < 2) {
      this.formError.set('Brand name must be at least 2 characters.');
      return;
    }

    this.isSaving.set(true);
    this.formError.set(null);
    const editing = this.editingBrand();

    const op = editing
      ? this.adminService.updateBrand(editing.id, name)
      : this.adminService.createBrand(name);

    op.subscribe({
      next: (brand) => {
        if (editing) {
          this.brands.update((list) => list.map((b) => (b.id === brand.id ? brand : b)));
        } else {
          this.brands.update((list) => [...list, brand]);
        }
        this.isSaving.set(false);
        this.showModal.set(false);
      },
      error: () => {
        this.formError.set('Failed to save brand. It may already exist.');
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
    this.adminService.deleteBrand(id).subscribe({
      next: () => {
        this.brands.update((list) => list.filter((b) => b.id !== id));
        this.confirmDeleteId.set(null);
        this.isDeleting.set(false);
      },
      error: () => {
        this.errorMsg.set('Could not delete brand. It may still be in use.');
        this.confirmDeleteId.set(null);
        this.isDeleting.set(false);
      },
    });
  }
}
