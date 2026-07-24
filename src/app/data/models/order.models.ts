export type OrderStatus = 'PENDING' | 'PROCESSING' | 'SHIPPED' | 'DELIVERED' | 'CANCELLED';

export type PaymentStatus = 'INITIATED' | 'CAPTURED' | 'FAILED';

export interface OrderItem {
  productId: number;
  productName: string;
  description: string;
  imageUrl: string | null;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
}

export interface ShippingAddressResponse {
  fullName: string;
  addressLine1: string;
  addressLine2: string | null;
  city: string;
  state: string;
  postalCode: string;
  country: string;
  deliveryNotes: string | null;
}

export interface OrderResponse {
  id: number;
  userId: number;
  orderItems: OrderItem[];
  totalAmount: number;
  status: OrderStatus;
  orderDate: string;
  estimatedDelivery: string | null;
  totalItems: number;
  shippingAddress: ShippingAddressResponse | null;
  paymentMethod: string;
  paymentStatus: PaymentStatus | null;
  paymentProviderOrderId: string | null;
  paymentProviderCaptureId: string | null;
  paymentFailureReason: string | null;
}

export interface ShippingAddressRequest {
  fullName: string;
  street: string;
  addressLine2: string | null;
  city: string;
  state: string;
  postalCode: string;
  country: string;
  deliveryNotes: string | null;
}

export interface PlaceOrderRequest {
  shippingAddress: ShippingAddressRequest | null;
  useProfileAddress?: boolean | null;
  deliveryNotes?: string | null;
  paymentMethod: string;
}

export interface CancelOrderRequest {
  reason: string | null;
}

export interface CapturePayPalPaymentRequest {
  providerOrderId: string | null;
}

export interface PayPalPaymentInitiationResponse {
  orderId: number;
  providerOrderId: string;
  approvalUrl: string;
}
