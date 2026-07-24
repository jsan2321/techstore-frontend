import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { API_CONFIG } from '../../core/config/api.config';
import { Category } from '../models/category.models';

@Injectable({ providedIn: 'root' })
export class CategoryService {
  private readonly http = inject(HttpClient);

  getAllCategories(): Observable<Category[]> {
    return this.http.get<Category[]>(this.buildUrl(API_CONFIG.categories.base));
  }

  private buildUrl(path: string): string {
    return API_CONFIG.baseUrl + path;
  }
}
