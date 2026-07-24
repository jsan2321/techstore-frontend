import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { API_CONFIG } from '../../core/config/api.config';
import { Brand } from '../models/brand.models';

@Injectable({ providedIn: 'root' })
export class BrandService {
  private readonly http = inject(HttpClient);

  getAllBrands(): Observable<Brand[]> {
    return this.http.get<Brand[]>(this.buildUrl(API_CONFIG.brands.base));
  }

  private buildUrl(path: string): string {
    return API_CONFIG.baseUrl + path;
  }
}
