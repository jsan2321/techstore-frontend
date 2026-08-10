import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { AdminService } from '../../services/admin.service';
import {
  AdminProductListItem,
  AdminProductDetail,
  BrandItem,
  CategoryItem,
  PagedResult,
  ProductCreateRequest,
} from '../../models/admin.models';

@Component({
  selector: 'app-admin-products',
  standalone: true,
  imports: [FormsModule, CommonModule],
  templateUrl: './admin-products.component.html',
})
export class AdminProductsComponent implements OnInit {
  private readonly adminService = inject(AdminService);

  // List state
  readonly pagedResult = signal<PagedResult<AdminProductListItem> | null>(null);
  readonly isLoading = signal(true);
  readonly errorMsg = signal<string | null>(null);
  readonly searchQuery = signal('');

  // Grouped Filter states
  readonly activeFilter = signal<'' | 'true' | 'false'>('');
  readonly stockFilter = signal<'' | 'in_stock' | 'out_of_stock'>('');
  readonly discountFilter = signal<'' | 'discounted' | 'regular'>('');
  readonly filterDropdownOpen = signal(false);

  readonly activeFilterCount = computed(() => {
    let count = 0;
    if (this.activeFilter() !== '') count++;
    if (this.stockFilter() !== '') count++;
    if (this.discountFilter() !== '') count++;
    return count;
  });

  // Client-side computed signal to filter by discount
  readonly displayedProducts = computed(() => {
    const raw = this.pagedResult();
    if (!raw) return [];
    let list = raw.content;

    const discountVal = this.discountFilter();
    if (discountVal === 'discounted') {
      list = list.filter((p) => p.discount && p.discount.percentage > 0);
    } else if (discountVal === 'regular') {
      list = list.filter((p) => !p.discount || p.discount.percentage === 0);
    }

    return list;
  });

  // Brands and categories for the form dropdowns
  readonly brands = signal<BrandItem[]>([]);
  readonly categories = signal<CategoryItem[]>([]);

  // Product form modal
  readonly showModal = signal(false);
  readonly editingProduct = signal<AdminProductDetail | null>(null);
  readonly isSaving = signal(false);
  readonly formError = signal<string | null>(null);

  // Form fields
  readonly fName = signal('');
  readonly fBrandId = signal<number | null>(null);
  readonly fCategoryId = signal<number | null>(null);
  readonly fPrice = signal<number | null>(null);
  readonly fStock = signal<number | null>(null);
  readonly fDescription = signal('');
  readonly fApplyDiscount = signal(false);
  readonly fDiscountPct = signal<number | null>(null);
  readonly fFeatured = signal(false);

  // Form image upload fields
  readonly selectedImageFile = signal<File | null>(null);
  readonly imagePreviewUrl = signal<string | null>(null);
  readonly isImageDeleted = signal(false);

  // Delete confirm
  readonly confirmDeleteId = signal<number | null>(null);
  readonly isDeleting = signal(false);

  // Toggle in-progress ids
  readonly toggleInProgress = signal<Set<number>>(new Set());

  ngOnInit(): void {
    this.loadProducts();
    this.adminService.getBrands().subscribe((b) => this.brands.set(b));
    this.adminService.getCategories().subscribe((c) => this.categories.set(c));
  }

  loadProducts(): void {
    this.isLoading.set(true);
    this.errorMsg.set(null);
    const active =
      this.activeFilter() === 'true'
        ? true
        : this.activeFilter() === 'false'
          ? false
          : undefined;
    const inStock =
      this.stockFilter() === 'in_stock'
        ? true
        : this.stockFilter() === 'out_of_stock'
          ? false
          : undefined;
    const q = this.searchQuery().trim() || undefined;

    this.adminService.getProducts(0, 50, q, active, inStock).subscribe({
      next: (result) => {
        this.pagedResult.set(result);
        this.isLoading.set(false);
      },
      error: () => {
        this.errorMsg.set('Failed to load products.');
        this.isLoading.set(false);
      },
    });
  }

  applyFilter(): void {
    this.loadProducts();
  }

  toggleFilterDropdown(): void {
    this.filterDropdownOpen.update((open) => !open);
  }

  resetFilters(): void {
    this.activeFilter.set('');
    this.stockFilter.set('');
    this.discountFilter.set('');
    this.applyFilter();
  }

  openAdd(): void {
    this.editingProduct.set(null);
    this.resetForm();
    this.selectedImageFile.set(null);
    this.imagePreviewUrl.set(null);
    this.isImageDeleted.set(false);
    this.formError.set(null);
    this.showModal.set(true);
  }

  openEdit(item: AdminProductListItem): void {
    this.formError.set(null);
    this.adminService.getProductById(item.id).subscribe({
      next: (detail) => {
        this.editingProduct.set(detail);
        this.fName.set(detail.name);
        this.fBrandId.set(this.brands().find((b) => b.name === detail.brand)?.id ?? null);
        this.fCategoryId.set(this.categories().find((c) => c.name === detail.category)?.id ?? null);
        this.fPrice.set(detail.originalPrice);
        this.fStock.set(detail.stock);
        this.fDescription.set(detail.description);
        this.fApplyDiscount.set(detail.discount != null);
        this.fDiscountPct.set(detail.discount?.percentage ?? null);
        this.fFeatured.set(detail.featured);

        // Load existing image details
        this.selectedImageFile.set(null);
        this.imagePreviewUrl.set(detail.imageUrl);
        this.isImageDeleted.set(false);

        this.showModal.set(true);
      },
    });
  }

  closeModal(): void {
    this.showModal.set(false);
  }

  saveProduct(): void {
    if (!this.fName().trim() || !this.fBrandId() || !this.fCategoryId() || this.fPrice() == null || this.fStock() == null) {
      this.formError.set('Please fill in all required fields.');
      return;
    }

    const request: ProductCreateRequest = {
      name: this.fName().trim(),
      brandId: this.fBrandId()!,
      categoryId: this.fCategoryId()!,
      price: this.fPrice()!,
      stock: this.fStock()!,
      description: this.fDescription().trim(),
      applyDiscount: this.fApplyDiscount(),
      discountPercentage: this.fApplyDiscount() ? this.fDiscountPct() : null,
      featured: this.fFeatured(),
    };

    this.isSaving.set(true);
    this.formError.set(null);
    const editing = this.editingProduct();
    const op = editing
      ? this.adminService.updateProduct(editing.id, request)
      : this.adminService.createProduct(request);

    op.subscribe({
      next: (res) => {
        this.handlePostSaveImageLifecycle(res.id);
      },
      error: () => {
        this.formError.set('Failed to save product details.');
        this.isSaving.set(false);
      },
    });
  }

  toggleActive(item: AdminProductListItem, activate: boolean): void {
    this.markToggle(item.id);
    const toggle$ = activate
      ? this.adminService.activateProduct(item.id)
      : this.adminService.deactivateProduct(item.id);
    toggle$.subscribe({
      next: () => {
        this.clearToggle(item.id);
        this.loadProducts();
      },
      error: () => this.clearToggle(item.id),
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
    this.adminService.deleteProduct(id).subscribe({
      next: () => {
        this.confirmDeleteId.set(null);
        this.isDeleting.set(false);
        this.loadProducts();
      },
      error: () => {
        this.errorMsg.set('Could not delete product.');
        this.confirmDeleteId.set(null);
        this.isDeleting.set(false);
      },
    });
  }

  private resetForm(): void {
    this.fName.set('');
    this.fBrandId.set(null);
    this.fCategoryId.set(null);
    this.fPrice.set(null);
    this.fStock.set(null);
    this.fDescription.set('');
    this.fApplyDiscount.set(false);
    this.fDiscountPct.set(null);
    this.fFeatured.set(false);
  }

  private markToggle(id: number): void {
    this.toggleInProgress.update((s) => new Set([...s, id]));
  }

  private clearToggle(id: number): void {
    this.toggleInProgress.update((s) => {
      const n = new Set(s);
      n.delete(id);
      return n;
    });
  }

  isToggling(id: number): boolean {
    return this.toggleInProgress().has(id);
  }

  onImageSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files[0]) {
      const file = input.files[0];
      this.selectedImageFile.set(file);
      this.isImageDeleted.set(false);

      const reader = new FileReader();
      reader.onload = () => {
        this.imagePreviewUrl.set(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  }

  removeImage(): void {
    this.selectedImageFile.set(null);
    this.imagePreviewUrl.set(null);
    if (this.editingProduct()?.imageUrl) {
      this.isImageDeleted.set(true);
    }
  }

  private handlePostSaveImageLifecycle(productId: number): void {
    if (this.isImageDeleted()) {
      this.adminService.deleteProductImage(productId).subscribe({
        next: () => {
          this.isImageDeleted.set(false);
          this.checkAndUploadSelectedImage(productId);
        },
        error: () => {
          // Continue to upload even if delete fails
          this.checkAndUploadSelectedImage(productId);
        }
      });
    } else {
      this.checkAndUploadSelectedImage(productId);
    }
  }

  private checkAndUploadSelectedImage(productId: number): void {
    const file = this.selectedImageFile();
    if (file) {
      this.adminService.uploadProductImage(productId, file).subscribe({
        next: () => {
          this.completeProductSave();
        },
        error: () => {
          this.formError.set('Product details saved, but image upload failed.');
          this.isSaving.set(false);
          this.loadProducts(); // reload to show saved details
        }
      });
    } else {
      this.completeProductSave();
    }
  }

  private completeProductSave(): void {
    this.isSaving.set(false);
    this.showModal.set(false);
    this.selectedImageFile.set(null);
    this.imagePreviewUrl.set(null);
    this.isImageDeleted.set(false);
    this.loadProducts();
  }
}
