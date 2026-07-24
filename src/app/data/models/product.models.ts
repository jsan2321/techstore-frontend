export interface ProductDiscountInfo {
  percentage: number;
}

export interface ProductListItem {
  id: number;
  name: string;
  brand: string;
  originalPrice: number;
  effectivePrice: number;
  stock: number;
  description: string;
  category: string;
  imageUrl: string | null;
  discount?: ProductDiscountInfo | null;
}

export interface ProductDetail {
  id: number;
  name: string;
  brand: string;
  price: number;
  stock: number;
  description: string;
  category: string;
  imageUrl: string | null;
  discountPercentage?: number | null;
}

export interface ProductSearchCriteria {
  category?: string;
  brand?: string;
  minPrice?: number;
  maxPrice?: number;
  inStock?: boolean;
  featured?: boolean;
  nameContains?: string;
  page?: number;
  size?: number;
  sortBy?: string;
  sortDirection?: 'asc' | 'desc';
}
