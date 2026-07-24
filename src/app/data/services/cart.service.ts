import { HttpClient } from '@angular/common/http';
import { Injectable, inject, signal } from '@angular/core';
import { Observable, catchError, of, tap } from 'rxjs';
import { API_CONFIG } from '../../core/config/api.config';
import { AddItemRequest, CartResponse, UpdateQuantityRequest } from '../models/cart.models';

@Injectable({ providedIn: 'root' })
export class CartService {
  private readonly http = inject(HttpClient);

  readonly cartCount = signal(0);

  getCart(): Observable<CartResponse> {
    return this.http.get<CartResponse>(this.buildUrl(API_CONFIG.cart.base)).pipe(
      tap((cart) => this.cartCount.set(cart.totalItems))
    );
  }

  loadCartSummary(): Observable<CartResponse | null> {
    return this.getCart().pipe(
      catchError(() => {
        this.cartCount.set(0);
        return of(null);
      })
    );
  }

  addItem(request: AddItemRequest): Observable<CartResponse> {
    return this.http.post<CartResponse>(this.buildUrl(API_CONFIG.cart.items), request).pipe(
      tap((cart) => this.cartCount.set(cart.totalItems))
    );
  }

  updateItemQuantity(productId: number, request: UpdateQuantityRequest): Observable<CartResponse> {
    return this.http
      .put<CartResponse>(this.buildUrl(API_CONFIG.cart.items + '/' + productId), request)
      .pipe(tap((cart) => this.cartCount.set(cart.totalItems)));
  }

  removeItem(productId: number): Observable<CartResponse> {
    return this.http
      .delete<CartResponse>(this.buildUrl(API_CONFIG.cart.items + '/' + productId))
      .pipe(tap((cart) => this.cartCount.set(cart.totalItems)));
  }

  clearCart(): Observable<void> {
    return this.http.delete<void>(this.buildUrl(API_CONFIG.cart.base)).pipe(
      tap(() => this.cartCount.set(0))
    );
  }

  resetCart(): void {
    this.cartCount.set(0);
  }

  private buildUrl(path: string): string {
    return API_CONFIG.baseUrl + path;
  }
}
