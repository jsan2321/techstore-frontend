import { HttpErrorResponse } from '@angular/common/http';
import { CommonModule } from '@angular/common';
import { Component, OnInit, inject, signal } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { finalize } from 'rxjs';
import { AuthService } from '../../../../core/auth/auth.service';
import { ProductDetail, ProductListItem } from '../../../../data/models/product.models';
import { CartService } from '../../../../data/services/cart.service';
import { ProductService } from '../../../../data/services/product.service';
import { LoadingSpinnerComponent } from '../../../../shared/components/loading-spinner/loading-spinner.component';
import { ProductCardComponent } from '../../../../shared/components/product-card/product-card.component';

@Component({
  selector: 'app-product-detail',
  standalone: true,
  imports: [CommonModule, RouterLink, LoadingSpinnerComponent, ProductCardComponent],
  templateUrl: './product-detail.component.html'
})
export class ProductDetailComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly productService = inject(ProductService);
  private readonly cartService = inject(CartService);
  private readonly authService = inject(AuthService);

  readonly product = signal<ProductDetail | null>(null);
  readonly loading = signal(true);
  readonly errorMessage = signal<string | null>(null);
  readonly cartMessage = signal<string | null>(null);
  readonly cartError = signal<string | null>(null);
  readonly quantity = signal(1);
  readonly relatedProducts = signal<ProductListItem[]>([]);

  ngOnInit(): void {
    this.route.paramMap.subscribe(params => {
      const rawId = params.get('productId');
      const productId = Number(rawId);

      if (!rawId || !Number.isInteger(productId) || productId <= 0) {
        this.errorMessage.set('Invalid product id.');
        this.loading.set(false);
        return;
      }

      this.quantity.set(1);
      this.loadProduct(productId);
    });
  }

  updateQuantity(value: string): void {
    const parsed = Number(value);
    if (!Number.isFinite(parsed) || parsed <= 0) {
      this.quantity.set(1);
      return;
    }
    const current = this.product();
    const maxStock = current?.stock ?? Number.POSITIVE_INFINITY;
    const normalized = Math.floor(parsed);
    this.quantity.set(Math.min(normalized, Math.max(1, maxStock)));
  }

  getDiscountedPrice(): number {
    const current = this.product();
    if (!current) return 0;
    const discount = current.discountPercentage ?? 0;
    if (discount <= 0) return current.price;
    return current.price - (current.price * discount) / 100;
  }

  addToCart(): void {
    this.cartMessage.set(null);
    this.cartError.set(null);

    const current = this.product();
    if (!current) {
      return;
    }

    if (!this.authService.isAuthenticated()) {
      void this.router.navigate(['/auth/login'], {
        queryParams: { returnUrl: this.router.url }
      });
      return;
    }

    const quantity = this.quantity();

    this.cartService.addItem({ productId: current.id, quantity }).subscribe({
      next: () => {
        this.cartMessage.set(`${current.name} added to cart.`);
        setTimeout(() => this.cartMessage.set(null), 3000);
      },
      error: (error: unknown) => {
        this.cartError.set(this.resolveError(error, 'Could not add this item to your cart.'));
        setTimeout(() => this.cartError.set(null), 5000);
      }
    });
  }

  addRelatedToCart(event: { product: ProductListItem; quantity: number }): void {
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

  private loadProduct(productId: number): void {
    this.loading.set(true);
    this.errorMessage.set(null);

    this.productService
      .getProductById(productId)
      .pipe(finalize(() => this.loading.set(false)))
      .subscribe({
        next: (product) => {
          this.product.set(product);
          this.loadRelatedProducts(product.category, product.id);
        },
        error: (error: unknown) => {
          this.errorMessage.set(this.resolveError(error, 'Could not load this product.'));
        }
      });
  }

  private loadRelatedProducts(category: string, currentProductId: number): void {
    this.productService.searchProducts({ category, size: 5 }).subscribe({
      next: (response) => {
        const filtered = (response.content ?? [])
          .filter((p) => p.id !== currentProductId)
          .slice(0, 4);
        this.relatedProducts.set(filtered);
      },
      error: () => {
        this.relatedProducts.set([]);
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
