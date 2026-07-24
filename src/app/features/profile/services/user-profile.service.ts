import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { API_CONFIG } from '../../../core/config/api.config';
import {
  ChangePasswordRequest,
  CreateAddressRequest,
  SavedAddress,
  UpdateAddressRequest,
  UpdateUserProfileRequest,
  UserProfile
} from '../models/user-profile.models';

@Injectable({ providedIn: 'root' })
export class UserProfileService {
  private readonly http = inject(HttpClient);

  getCurrentUser(): Observable<UserProfile> {
    return this.http.get<UserProfile>(this.buildUrl(API_CONFIG.users.me));
  }

  updateCurrentUser(request: UpdateUserProfileRequest): Observable<UserProfile> {
    return this.http.put<UserProfile>(this.buildUrl(API_CONFIG.users.me), request);
  }

  changePassword(request: ChangePasswordRequest): Observable<void> {
    return this.http.put<void>(this.buildUrl(API_CONFIG.users.changePassword), request);
  }

  deactivateCurrentUser(): Observable<UserProfile> {
    return this.http.put<UserProfile>(this.buildUrl(API_CONFIG.users.deactivate), {});
  }

  listAddresses(): Observable<SavedAddress[]> {
    return this.http.get<SavedAddress[]>(this.buildUrl(API_CONFIG.users.addresses));
  }

  getAddress(addressId: number): Observable<SavedAddress> {
    return this.http.get<SavedAddress>(this.buildUrl(API_CONFIG.users.addresses + '/' + addressId));
  }

  createAddress(request: CreateAddressRequest): Observable<SavedAddress> {
    return this.http.post<SavedAddress>(this.buildUrl(API_CONFIG.users.addresses), request);
  }

  updateAddress(addressId: number, request: UpdateAddressRequest): Observable<SavedAddress> {
    return this.http.put<SavedAddress>(
      this.buildUrl(API_CONFIG.users.addresses + '/' + addressId),
      request
    );
  }

  deleteAddress(addressId: number): Observable<void> {
    return this.http.delete<void>(this.buildUrl(API_CONFIG.users.addresses + '/' + addressId));
  }

  setDefaultAddress(addressId: number): Observable<SavedAddress> {
    return this.http.put<SavedAddress>(
      this.buildUrl(API_CONFIG.users.addresses + '/' + addressId + '/default'),
      {}
    );
  }

  private buildUrl(path: string): string {
    return API_CONFIG.baseUrl + path;
  }
}
