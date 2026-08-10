import { TestBed } from '@angular/core/testing';
import { TokenService } from './token.service';

describe('TokenService', () => {
  let service: TokenService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(TokenService);
    localStorage.clear();
    sessionStorage.clear();
  });

  it('keeps the access token in memory and sessionStorage', () => {
    service.setAccessToken('header.payload.signature');

    expect(service.getAccessToken()).toBe('header.payload.signature');
    expect(sessionStorage.getItem('access_token')).toBe('header.payload.signature');
    expect(localStorage.getItem('access_token')).toBeNull();
  });

  it('clears access token from memory and sessionStorage', () => {
    service.setAccessToken('header.payload.signature');
    service.clearTokens();

    expect(service.getAccessToken()).toBeNull();
    expect(sessionStorage.getItem('access_token')).toBeNull();
  });
});
