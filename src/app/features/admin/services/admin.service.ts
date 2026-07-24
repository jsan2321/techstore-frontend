import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { API_CONFIG } from '../../../core/config/api.config';
import { AuthService } from '../../../core/auth/auth.service';
import { AuthResponse } from '../../auth/models/auth.models';
import {
  AdminLoginRequest,
  AdminUserResponse,
  AdminProductListItem,
  AdminProductDetail,
  ProductCreateRequest,
  BrandItem,
  CategoryItem,
  PagedResult,
  AdminPagedOrders,
  AdminOrderResponse
} from '../models/admin.models';
import { OrderResponse } from '../../../data/models/order.models';
import { SavedAddress } from '../../profile/models/user-profile.models';

@Injectable({ providedIn: 'root' })
export class AdminService {
  private readonly http = inject(HttpClient);
  private readonly authService = inject(AuthService);
  private readonly base = API_CONFIG.baseUrl;

  // ─── Auth ────────────────────────────────────────────────────────────────────

  adminLogin(request: AdminLoginRequest): Observable<AuthResponse> {
    return this.http
      .post<AuthResponse>(this.base + API_CONFIG.admin.login, request)
      .pipe(tap((res) => this.authService.setSession(res.accessToken, res.refreshToken)));
  }

  // ─── Users ───────────────────────────────────────────────────────────────────

  getUsers(page = 0, size = 50, status?: string): Observable<AdminUserResponse[]> {
    let params = new HttpParams().set('page', page).set('size', size);
    if (status) params = params.set('status', status);
    return this.http.get<AdminUserResponse[]>(this.base + API_CONFIG.admin.users, { params });
  }

  deactivateUser(userId: number): Observable<AdminUserResponse> {
    return this.http.put<AdminUserResponse>(
      `${this.base}${API_CONFIG.admin.users}/${userId}/deactivate`,
      {}
    );
  }

  reactivateUser(userId: number): Observable<AdminUserResponse> {
    return this.http.put<AdminUserResponse>(
      `${this.base}${API_CONFIG.admin.users}/${userId}/reactivate`,
      {}
    );
  }

  deleteUser(userId: number): Observable<void> {
    return this.http.delete<void>(`${this.base}${API_CONFIG.admin.users}/${userId}`);
  }

  getUserAddresses(userId: number): Observable<SavedAddress[]> {
    return this.http.get<SavedAddress[]>(`${this.base}${API_CONFIG.admin.users}/${userId}/addresses`);
  }

  // ─── Products ─────────────────────────────────────────────────────────────────

  getProducts(
    page = 0,
    size = 20,
    nameContains?: string,
    active?: boolean,
    inStock?: boolean
  ): Observable<PagedResult<AdminProductListItem>> {
    let params = new HttpParams().set('page', page).set('size', size);
    if (nameContains) params = params.set('nameContains', nameContains);
    if (active !== undefined) params = params.set('active', active);
    if (inStock !== undefined) params = params.set('inStock', inStock);
    return this.http.get<PagedResult<AdminProductListItem>>(
      this.base + API_CONFIG.admin.products,
      { params }
    );
  }

  getProductById(id: number): Observable<AdminProductDetail> {
    return this.http.get<AdminProductDetail>(`${this.base}${API_CONFIG.admin.products}/${id}`);
  }

  createProduct(request: ProductCreateRequest): Observable<AdminProductDetail> {
    return this.http.post<AdminProductDetail>(this.base + API_CONFIG.admin.products, request);
  }

  updateProduct(id: number, request: ProductCreateRequest): Observable<AdminProductDetail> {
    return this.http.put<AdminProductDetail>(
      `${this.base}${API_CONFIG.admin.products}/${id}`,
      request
    );
  }

  deleteProduct(id: number): Observable<void> {
    return this.http.delete<void>(`${this.base}${API_CONFIG.admin.products}/${id}`);
  }

  activateProduct(id: number): Observable<AdminProductDetail> {
    return this.http.patch<AdminProductDetail>(
      `${this.base}${API_CONFIG.admin.products}/${id}/activate`,
      {}
    );
  }

  deactivateProduct(id: number): Observable<AdminProductDetail> {
    return this.http.patch<AdminProductDetail>(
      `${this.base}${API_CONFIG.admin.products}/${id}/deactivate`,
      {}
    );
  }

  uploadProductImage(id: number, file: File): Observable<AdminProductDetail> {
    const formData = new FormData();
    formData.append('image', file);
    return this.http.post<AdminProductDetail>(
      `${this.base}${API_CONFIG.admin.products}/${id}/image`,
      formData
    );
  }

  deleteProductImage(id: number): Observable<AdminProductDetail> {
    return this.http.delete<AdminProductDetail>(
      `${this.base}${API_CONFIG.admin.products}/${id}/image`
    );
  }

  // ─── Brands ──────────────────────────────────────────────────────────────────

  getBrands(): Observable<BrandItem[]> {
    return this.http.get<BrandItem[]>(this.base + API_CONFIG.brands.base);
  }

  createBrand(name: string): Observable<BrandItem> {
    return this.http.post<BrandItem>(this.base + API_CONFIG.admin.brands, { name });
  }

  updateBrand(id: number, name: string): Observable<BrandItem> {
    return this.http.put<BrandItem>(`${this.base}${API_CONFIG.admin.brands}/${id}`, { name });
  }

  deleteBrand(id: number): Observable<void> {
    return this.http.delete<void>(`${this.base}${API_CONFIG.admin.brands}/${id}`);
  }

  // ─── Categories ───────────────────────────────────────────────────────────────

  getCategories(): Observable<CategoryItem[]> {
    return this.http.get<CategoryItem[]>(this.base + API_CONFIG.categories.base);
  }

  createCategory(name: string): Observable<CategoryItem> {
    return this.http.post<CategoryItem>(this.base + API_CONFIG.admin.categories, { name });
  }

  updateCategory(id: number, name: string): Observable<CategoryItem> {
    return this.http.put<CategoryItem>(
      `${this.base}${API_CONFIG.admin.categories}/${id}`,
      { name }
    );
  }

  deleteCategory(id: number): Observable<void> {
    return this.http.delete<void>(`${this.base}${API_CONFIG.admin.categories}/${id}`);
  }

  // ─── Orders ──────────────────────────────────────────────────────────────────

  getOrders(
    page = 0,
    size = 20,
    status?: string
  ): Observable<AdminPagedOrders> {
    let params = new HttpParams().set('page', page).set('size', size);
    if (status) params = params.set('status', status);
    return this.http.get<AdminPagedOrders>(
      `${this.base}/admin/orders`,
      { params }
    );
  }

  processOrder(orderId: number): Observable<OrderResponse> {
    return this.http.post<OrderResponse>(
      `${this.base}/admin/orders/${orderId}/process`,
      {}
    );
  }

  shipOrder(orderId: number): Observable<OrderResponse> {
    return this.http.post<OrderResponse>(
      `${this.base}/admin/orders/${orderId}/ship`,
      {}
    );
  }

  deliverOrder(orderId: number): Observable<OrderResponse> {
    return this.http.post<OrderResponse>(
      `${this.base}/admin/orders/${orderId}/deliver`,
      {}
    );
  }

  cancelOrderAdmin(orderId: number, reason?: string): Observable<OrderResponse> {
    let params = new HttpParams();
    if (reason) params = params.set('reason', reason);
    return this.http.post<OrderResponse>(
      `${this.base}/admin/orders/${orderId}/cancel`,
      {},
      { params }
    );
  }
}
