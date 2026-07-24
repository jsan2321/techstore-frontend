export interface CartItem {
  productId: number;
  productName: string;
  description: string;
  imageUrl: string | null;
  quantity: number;
  unitPrice: number;
  originalPrice: number;
  discountPercentage?: number | null;
  totalPrice: number;
}

export interface CartResponse {
  id: number;
  userId: number;
  items: CartItem[];
  totalAmount: number;
  itemCount: number;
  totalItems: number;
}

export interface AddItemRequest {
  productId: number;
  quantity: number;
}

export interface UpdateQuantityRequest {
  quantity: number;
}
