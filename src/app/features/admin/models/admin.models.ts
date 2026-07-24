// ─── Admin User Models ───────────────────────────────────────────────────────

export interface AdminUserResponse {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  phoneNumber: string | null;
  roles: string[];
  status: 'ACTIVE' | 'INACTIVE';
  emailVerified: boolean;
}

// ─── Admin Product Models ─────────────────────────────────────────────────────

export interface AdminProductListItem {
  id: number;
  name: string;
  category: string;
  originalPrice: number;
  effectivePrice: number;
  stock: number;
  discount: { percentage: number } | null;
}

export interface AdminProductDetail {
  id: number;
  name: string;
  brand: string;
  originalPrice: number;
  effectivePrice: number;
  stock: number;
  description: string;
  category: string;
  imageUrl: string | null;
  active: boolean;
  featured: boolean;
  discount: { percentage: number } | null;
}

export interface ProductCreateRequest {
  name: string;
  brandId: number;
  price: number;
  stock: number;
  description: string;
  categoryId: number;
  applyDiscount: boolean;
  discountPercentage: number | null;
  featured: boolean;
}

// ─── Brand / Category Models ──────────────────────────────────────────────────

export interface BrandItem {
  id: number;
  name: string;
}

export interface CategoryItem {
  id: number;
  name: string;
}

// ─── Pagination ───────────────────────────────────────────────────────────────

export interface PagedResult<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  number: number;
  size: number;
}

// ─── Admin Auth ───────────────────────────────────────────────────────────────

export interface AdminLoginRequest {
  email: string;
  password: string;
}

// ─── Admin Order Models ───────────────────────────────────────────────────────

export interface UserSummaryResponse {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  status: string;
  emailVerified: boolean;
}

export interface AdminOrderResponse {
  id: number;
  userId: number;
  user: UserSummaryResponse | null;
  orderItems: Array<{
    productId: number;
    productName: string;
    description: string;
    imageUrl: string | null;
    quantity: number;
    unitPrice: number;
    totalPrice: number;
  }>;
  totalAmount: number;
  status: 'PENDING' | 'PROCESSING' | 'SHIPPED' | 'DELIVERED' | 'CANCELLED';
  orderDate: string;
  estimatedDelivery: string | null;
  totalItems: number;
  shippingAddress: {
    fullName: string;
    addressLine1: string;
    addressLine2: string | null;
    city: string;
    state: string;
    postalCode: string;
    country: string;
    deliveryNotes: string | null;
  } | null;
  paymentMethod: string;
  paymentStatus: 'INITIATED' | 'CAPTURED' | 'FAILED' | null;
  paymentProviderOrderId: string | null;
  paymentProviderCaptureId: string | null;
  paymentFailureReason: string | null;
}

export interface AdminPagedOrders {
  content: AdminOrderResponse[];
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
  first: boolean;
  last: boolean;
}
