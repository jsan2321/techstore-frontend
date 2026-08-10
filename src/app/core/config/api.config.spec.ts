import { API_CONFIG } from './api.config';

describe('API_CONFIG', () => {
  it('uses the same-origin proxied API path', () => {
    expect(API_CONFIG.baseUrl).toBe('/api/v1');
  });

  it('keeps authentication endpoints under the API base path', () => {
    expect(API_CONFIG.baseUrl + API_CONFIG.auth.refresh).toBe('/api/v1/auth/refresh');
    expect(API_CONFIG.baseUrl + API_CONFIG.auth.logout).toBe('/api/v1/auth/logout');
  });
});
