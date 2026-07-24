import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { API_CONFIG } from '../../core/config/api.config';
import { PagedResult } from '../../shared/models/paged-result.model';
import { ProductDetail, ProductListItem, ProductSearchCriteria } from '../models/product.models';

@Injectable({ providedIn: 'root' })
export class ProductService {
  private readonly http = inject(HttpClient);

  searchProducts(criteria: ProductSearchCriteria): Observable<PagedResult<ProductListItem>> {
    let params = new HttpParams();

    if (criteria.category) {
      params = params.set('category', criteria.category);
    }
    if (criteria.brand) {
      params = params.set('brand', criteria.brand);
    }
    if (typeof criteria.minPrice === 'number') {
      params = params.set('minPrice', String(criteria.minPrice));
    }
    if (typeof criteria.maxPrice === 'number') {
      params = params.set('maxPrice', String(criteria.maxPrice));
    }
    if (typeof criteria.inStock === 'boolean') {
      params = params.set('inStock', String(criteria.inStock));
    }
    if (typeof criteria.featured === 'boolean') {
      params = params.set('featured', String(criteria.featured));
    }
    if (criteria.nameContains) {
      params = params.set('q', criteria.nameContains);
    }
    if (typeof criteria.page === 'number') {
      params = params.set('page', String(criteria.page));
    }
    if (typeof criteria.size === 'number') {
      params = params.set('size', String(criteria.size));
    }
    if (criteria.sortBy) {
      params = params.set('sortBy', criteria.sortBy);
    }
    if (criteria.sortDirection) {
      params = params.set('sortDirection', criteria.sortDirection);
    }

    return this.http.get<PagedResult<ProductListItem>>(this.buildUrl(API_CONFIG.products.base), {
      params
    });
  }

  getProductById(productId: number): Observable<ProductDetail> {
    return this.http.get<ProductDetail>(this.buildUrl(API_CONFIG.products.base + '/' + productId));
  }

  private buildUrl(path: string): string {
    return API_CONFIG.baseUrl + path;
  }
}
