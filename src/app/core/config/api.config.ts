export const API_CONFIG = {
  baseUrl: 'http://localhost:8081/api/v1',
  auth: {
    login: '/auth/login',
    googleLogin: '/auth/google-login',
    register: '/auth/register',
    refresh: '/auth/refresh',
    logout: '/auth/logout',
    forgotPassword: '/auth/forgot-password',
    resetPassword: '/auth/reset-password',
    confirmEmail: '/auth/confirm-email',
    resendConfirmation: '/auth/resend-confirmation',
  },
  users: {
    me: '/users/me',
    changePassword: '/users/me/password',
    deactivate: '/users/me/deactivate',
    addresses: '/users/me/addresses',
  },
  products: {
    base: '/products',
  },
  brands: {
    base: '/brands',
  },
  categories: {
    base: '/categories',
  },
  cart: {
    base: '/cart',
    items: '/cart/items',
  },
  orders: {
    base: '/orders',
    my: '/orders/my',
  },
  admin: {
    login: '/admin/auth/login',
    users: '/admin/users',
    products: '/admin/products',
    brands: '/admin/brands',
    categories: '/admin/categories',
  },
} as const;
