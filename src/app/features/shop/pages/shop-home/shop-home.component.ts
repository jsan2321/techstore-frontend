import { HttpErrorResponse } from '@angular/common/http';
import { Component, OnInit, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { finalize, forkJoin } from 'rxjs';
import { AuthService } from '../../../../core/auth/auth.service';
import { Brand } from '../../../../data/models/brand.models';
import { Category } from '../../../../data/models/category.models';
import { ProductListItem, ProductSearchCriteria } from '../../../../data/models/product.models';
import { BrandService } from '../../../../data/services/brand.service';
import { CartService } from '../../../../data/services/cart.service';
import { CategoryService } from '../../../../data/services/category.service';
import { ProductService } from '../../../../data/services/product.service';
import { EmptyStateComponent } from '../../../../shared/components/empty-state/empty-state.component';
import { LoadingSpinnerComponent } from '../../../../shared/components/loading-spinner/loading-spinner.component';
import { PaginationComponent } from '../../../../shared/components/pagination/pagination.component';
import { ProductCardComponent } from '../../../../shared/components/product-card/product-card.component';

@Component({
  selector: 'app-shop-home',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    RouterLink,
    ProductCardComponent,
    PaginationComponent,
    LoadingSpinnerComponent,
    EmptyStateComponent
  ],
  templateUrl: './shop-home.component.html'
})
export class ShopHomeComponent implements OnInit {
  private readonly formBuilder = inject(FormBuilder);
  private readonly productService = inject(ProductService);
  private readonly brandService = inject(BrandService);
  private readonly categoryService = inject(CategoryService);
  private readonly cartService = inject(CartService);
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);

  readonly loading = signal(false);
  readonly errorMessage = signal<string | null>(null);
  readonly cartMessage = signal<string | null>(null);
  readonly cartError = signal<string | null>(null);
  readonly products = signal<ProductListItem[]>([]);
  readonly brands = signal<Brand[]>([]);
  readonly categories = signal<Category[]>([]);
  readonly page = signal(0);
  readonly size = signal(12);
  readonly totalPages = signal(0);
  readonly totalElements = signal(0);

  readonly filtersForm = this.formBuilder.nonNullable.group({
    query: [''],
    category: [''],
    brand: [''],
    minPrice: ['', [Validators.min(0)]],
    maxPrice: ['', [Validators.min(0)]],
    inStock: [false],
    sortBy: ['name'],
    sortDirection: ['asc']
  });

  ngOnInit(): void {
    this.loadFilters();

    this.route.queryParams.subscribe((params) => {
      const normalized = this.normalizeQueryParams(params);
      this.applyQueryToForm(normalized);
      this.fetchProducts(normalized);
    });
  }

  applyFilters(): void {
    const raw = this.filtersForm.getRawValue();

    const queryParams = this.cleanQueryParams({
      q: raw.query?.trim() || null,
      category: raw.category || null,
      brand: raw.brand || null,
      minPrice: this.parseNumber(raw.minPrice),
      maxPrice: this.parseNumber(raw.maxPrice),
      inStock: raw.inStock ? true : null,
      sortBy: raw.sortBy || null,
      sortDirection: raw.sortDirection || null,
      page: 0,
      size: this.size()
    });

    void this.router.navigate([], { relativeTo: this.route, queryParams });
  }

  clearFilters(): void {
    this.filtersForm.reset({
      query: '',
      category: '',
      brand: '',
      minPrice: '',
      maxPrice: '',
      inStock: false,
      sortBy: 'name',
      sortDirection: 'asc'
    });

    void this.router.navigate([], { relativeTo: this.route, queryParams: { page: 0, size: this.size() } });
  }

  onPageChange(nextPage: number): void {
    const queryParams = this.cleanQueryParams({
      ...this.route.snapshot.queryParams,
      page: nextPage
    });

    void this.router.navigate([], { relativeTo: this.route, queryParams });
  }

  addToCart(event: { product: ProductListItem; quantity: number }): void {
    const { product, quantity } = event;
    this.cartMessage.set(null);
    this.cartError.set(null);

    if (!this.authService.isAuthenticated()) {
      void this.router.navigate(['/auth/login'], {
        queryParams: { returnUrl: this.router.url }
      });
      return;
    }

    this.cartService.addItem({ productId: product.id, quantity }).subscribe({
      next: () => {
        this.cartMessage.set(`${product.name} added to cart.`);
        setTimeout(() => this.cartMessage.set(null), 3000);
      },
      error: (error: unknown) => {
        this.cartError.set(this.resolveError(error, 'Could not add this item to your cart.'));
        setTimeout(() => this.cartError.set(null), 5000);
      }
    });
  }

  private loadFilters(): void {
    forkJoin({
      brands: this.brandService.getAllBrands(),
      categories: this.categoryService.getAllCategories()
    }).subscribe({
      next: ({ brands, categories }) => {
        this.brands.set(brands);
        this.categories.set(categories);
      },
      error: () => {
        this.brands.set([]);
        this.categories.set([]);
      }
    });
  }

  private fetchProducts(criteria: ProductSearchCriteria): void {
    this.loading.set(true);
    this.errorMessage.set(null);

    this.productService
      .searchProducts(criteria)
      .pipe(finalize(() => this.loading.set(false)))
      .subscribe({
        next: (response) => {
          this.products.set(response.content ?? []);
          this.page.set(response.page);
          this.size.set(response.size);
          this.totalPages.set(response.totalPages);
          this.totalElements.set(response.totalElements);
        },
        error: (error: unknown) => {
          this.errorMessage.set(this.resolveError(error, 'Could not load products right now.'));
        }
      });
  }

  private normalizeQueryParams(params: Record<string, string | number | boolean>): ProductSearchCriteria {
    const minPrice = this.parseNumber(params['minPrice']);
    const maxPrice = this.parseNumber(params['maxPrice']);
    const page = this.parseInteger(params['page'], 0);
    const size = this.parseInteger(params['size'], this.size());
    const inStock = params['inStock'] === 'true' ? true : undefined;
    const sortDirection = params['sortDirection'] === 'desc' ? 'desc' : 'asc';
    const sortBy = typeof params['sortBy'] === 'string' ? params['sortBy'] : 'name';
    const query = typeof params['q'] === 'string' ? params['q'] : '';

    return {
      category: typeof params['category'] === 'string' ? params['category'] : undefined,
      brand: typeof params['brand'] === 'string' ? params['brand'] : undefined,
      minPrice,
      maxPrice,
      inStock,
      nameContains: query || undefined,
      page,
      size,
      sortBy,
      sortDirection
    };
  }

  private applyQueryToForm(criteria: ProductSearchCriteria): void {
    this.filtersForm.patchValue(
      {
        query: criteria.nameContains ?? '',
        category: criteria.category ?? '',
        brand: criteria.brand ?? '',
        minPrice: criteria.minPrice?.toString() ?? '',
        maxPrice: criteria.maxPrice?.toString() ?? '',
        inStock: criteria.inStock ?? false,
        sortBy: criteria.sortBy ?? 'name',
        sortDirection: criteria.sortDirection ?? 'asc'
      },
      { emitEvent: false }
    );
  }

  private parseNumber(value: unknown): number | undefined {
    if (typeof value === 'number') {
      return Number.isFinite(value) ? value : undefined;
    }

    if (typeof value === 'string' && value.trim().length > 0) {
      const parsed = Number(value);
      return Number.isFinite(parsed) ? parsed : undefined;
    }

    return undefined;
  }

  private parseInteger(value: unknown, fallback: number): number {
    const parsed = typeof value === 'string' ? Number.parseInt(value, 10) : Number(value);
    if (Number.isFinite(parsed) && parsed >= 0) {
      return parsed;
    }

    return fallback;
  }

  private cleanQueryParams(params: Record<string, unknown>): Record<string, string | number | boolean> {
    const cleaned: Record<string, string | number | boolean> = {};

    Object.entries(params).forEach(([key, value]) => {
      if (value === null || value === undefined || value === '' || value === false) {
        return;
      }

      cleaned[key] = value as string | number | boolean;
    });

    return cleaned;
  }

  private resolveError(error: unknown, fallback: string): string {
    if (error instanceof HttpErrorResponse) {
      const backendMessage = (error.error as { message?: unknown })?.message;
      if (typeof backendMessage === 'string' && backendMessage.trim().length > 0) {
        return backendMessage;
      }
    }

    return fallback;
  }
}
