import { HttpErrorResponse } from '@angular/common/http';
import { Component, OnInit, inject, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { finalize } from 'rxjs';
import { AuthService } from '../../../../core/auth/auth.service';
import { Category } from '../../../../data/models/category.models';
import { ProductListItem } from '../../../../data/models/product.models';
import { CartService } from '../../../../data/services/cart.service';
import { CategoryService } from '../../../../data/services/category.service';
import { ProductService } from '../../../../data/services/product.service';
import { LoadingSpinnerComponent } from '../../../../shared/components/loading-spinner/loading-spinner.component';
import { ProductCardComponent } from '../../../../shared/components/product-card/product-card.component';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    ProductCardComponent,
    LoadingSpinnerComponent
  ],
  templateUrl: './home.component.html'
})
export class HomeComponent implements OnInit {
  private readonly productService = inject(ProductService);
  private readonly categoryService = inject(CategoryService);
  private readonly cartService = inject(CartService);
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);

  readonly loading = signal(false);
  readonly errorMessage = signal<string | null>(null);
  readonly cartMessage = signal<string | null>(null);
  readonly cartError = signal<string | null>(null);
  readonly featuredProducts = signal<ProductListItem[]>([]);
  readonly categories = signal<Category[]>([]);

  ngOnInit(): void {
    this.fetchCategories();
    this.fetchFeaturedProducts();
  }

  selectCategory(categoryName: string): void {
    void this.router.navigate(['/shop'], {
      queryParams: { category: categoryName }
    });
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
        // Clear message after 3 seconds
        setTimeout(() => this.cartMessage.set(null), 3000);
      },
      error: (error: unknown) => {
        this.cartError.set(this.resolveError(error, 'Could not add this item to your cart.'));
        setTimeout(() => this.cartError.set(null), 5000);
      }
    });
  }

  private fetchCategories(): void {
    this.categoryService.getAllCategories().subscribe({
      next: (cats) => this.categories.set(cats),
      error: () => this.categories.set([])
    });
  }

  private fetchFeaturedProducts(): void {
    this.loading.set(true);
    this.errorMessage.set(null);

    this.productService
      .searchProducts({ featured: true, size: 4 })
      .pipe(finalize(() => this.loading.set(false)))
      .subscribe({
        next: (response) => {
          this.featuredProducts.set(response.content ?? []);
        },
        error: (error: unknown) => {
          this.errorMessage.set(this.resolveError(error, 'Could not load featured products.'));
        }
      });
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
