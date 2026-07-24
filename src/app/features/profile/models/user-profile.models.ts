export type UserStatus = 'ACTIVE' | 'INACTIVE';

export type AddressType = 'SHIPPING' | 'BILLING' | 'BOTH';

export interface UserProfile {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  phoneNumber: string | null;
  roles: string[];
  status: UserStatus | string;
  emailVerified: boolean;
}

export interface UpdateUserProfileRequest {
  firstName: string;
  lastName: string;
  phoneNumber: string;
}

export interface ChangePasswordRequest {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

export interface SavedAddress {
  id: number;
  label: string;
  recipientName: string;
  street: string;
  addressLine2: string | null;
  city: string;
  state: string;
  zipCode: string;
  country: string;
  type: AddressType | string;
  isDefault: boolean;
}

export interface CreateAddressRequest {
  label: string;
  recipientName: string;
  street: string;
  addressLine2: string | null;
  city: string;
  state: string;
  zipCode: string;
  country: string;
  type: AddressType;
  isDefault: boolean;
}

export interface UpdateAddressRequest {
  label: string;
  recipientName: string;
  street: string;
  addressLine2: string | null;
  city: string;
  state: string;
  zipCode: string;
  country: string;
  type: AddressType;
}
