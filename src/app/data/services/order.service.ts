import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { API_CONFIG } from '../../core/config/api.config';
import {
  CancelOrderRequest,
  CapturePayPalPaymentRequest,
  OrderResponse,
  PayPalPaymentInitiationResponse,
  PlaceOrderRequest
} from '../models/order.models';

@Injectable({ providedIn: 'root' })
export class OrderService {
  private readonly http = inject(HttpClient);

  placeOrder(request: PlaceOrderRequest): Observable<OrderResponse> {
    return this.http.post<OrderResponse>(this.buildUrl(API_CONFIG.orders.base), request);
  }

  getMyOrders(): Observable<OrderResponse[]> {
    return this.http.get<OrderResponse[]>(this.buildUrl(API_CONFIG.orders.my));
  }

  getOrderById(orderId: number): Observable<OrderResponse> {
    return this.http.get<OrderResponse>(this.buildUrl(API_CONFIG.orders.base + '/' + orderId));
  }

  cancelOrder(orderId: number, reason?: string | null): Observable<OrderResponse> {
    const payload: CancelOrderRequest = { reason: reason ?? null };
    return this.http.post<OrderResponse>(this.buildUrl(API_CONFIG.orders.base + '/' + orderId + '/cancel'), payload);
  }

  initiatePayPalPayment(orderId: number): Observable<PayPalPaymentInitiationResponse> {
    return this.http.post<PayPalPaymentInitiationResponse>(
      this.buildUrl(API_CONFIG.orders.base + '/' + orderId + '/payments/paypal/initiate'),
      {}
    );
  }

  capturePayPalPayment(orderId: number, providerOrderId?: string | null): Observable<OrderResponse> {
    const payload: CapturePayPalPaymentRequest = { providerOrderId: providerOrderId ?? null };
    return this.http.post<OrderResponse>(
      this.buildUrl(API_CONFIG.orders.base + '/' + orderId + '/payments/paypal/capture'),
      payload
    );
  }

  private buildUrl(path: string): string {
    return API_CONFIG.baseUrl + path;
  }
}
