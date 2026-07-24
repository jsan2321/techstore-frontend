import { Injectable } from '@angular/core';

type GoogleCredentialResponse = {
  credential: string;
};

type GoogleIdInitializeConfig = {
  client_id: string;
  callback: (response: GoogleCredentialResponse) => void;
  auto_select?: boolean;
  cancel_on_tap_outside?: boolean;
};

type GoogleButtonConfig = {
  type?: 'standard' | 'icon';
  theme?: 'outline' | 'filled_blue' | 'filled_black';
  size?: 'large' | 'medium' | 'small';
  text?: 'signin_with' | 'signup_with' | 'continue_with' | 'signin';
  shape?: 'rectangular' | 'pill' | 'circle' | 'square';
  logo_alignment?: 'left' | 'center';
  width?: number;
};

type GoogleAccountsIdApi = {
  initialize: (config: GoogleIdInitializeConfig) => void;
  renderButton: (parent: HTMLElement, options: GoogleButtonConfig) => void;
  prompt: () => void;
  cancel: () => void;
};

type GoogleWindow = Window & {
  google?: {
    accounts?: {
      id?: GoogleAccountsIdApi;
    };
  };
};

@Injectable({ providedIn: 'root' })
export class GoogleIdentityService {
  private sdkPromise: Promise<void> | null = null;

  getClientId(): string | null {
    const meta = document.querySelector('meta[name="google-signin-client_id"]');
    const content = (meta as HTMLMetaElement | null)?.content?.trim();

    if (!content || content.startsWith('YOUR_GOOGLE_CLIENT_ID')) {
      return null;
    }

    return content;
  }

  loadSdk(): Promise<void> {
    if (this.getApi()) {
      return Promise.resolve();
    }

    if (this.sdkPromise) {
      return this.sdkPromise;
    }

    this.sdkPromise = new Promise<void>((resolve, reject) => {
      const existing = document.getElementById('google-identity-services-sdk') as
        | HTMLScriptElement
        | null;

      if (existing) {
        existing.addEventListener(
          'load',
          () => {
            if (this.getApi()) {
              resolve();
              return;
            }
            reject(new Error('Google Identity SDK loaded but API not available'));
          },
          { once: true }
        );
        existing.addEventListener('error', () => reject(new Error('Failed to load Google Identity SDK')), {
          once: true
        });
        return;
      }

      const script = document.createElement('script');
      script.id = 'google-identity-services-sdk';
      script.src = 'https://accounts.google.com/gsi/client';
      script.async = true;
      script.defer = true;
      script.onload = () => {
        if (this.getApi()) {
          resolve();
          return;
        }
        reject(new Error('Google Identity SDK loaded but API not available'));
      };
      script.onerror = () => reject(new Error('Failed to load Google Identity SDK'));
      document.head.appendChild(script);
    });

    return this.sdkPromise;
  }

  initialize(clientId: string, onCredential: (credential: string) => void): void {
    const api = this.requireApi();
    api.initialize({
      client_id: clientId,
      callback: (response: GoogleCredentialResponse) => {
        onCredential(response.credential);
      },
      auto_select: false,
      cancel_on_tap_outside: true
    });
  }

  renderButton(host: HTMLElement): void {
    const api = this.requireApi();
    host.innerHTML = '';

    api.renderButton(host, {
      type: 'standard',
      theme: 'outline',
      size: 'large',
      text: 'continue_with',
      shape: 'pill',
      logo_alignment: 'left',
      width: 320
    });
  }

  promptOneTap(): void {
    this.requireApi().prompt();
  }

  cancelOneTap(): void {
    const api = this.getApi();
    if (api) {
      api.cancel();
    }
  }

  private getApi(): GoogleAccountsIdApi | null {
    const googleWindow = window as GoogleWindow;
    return googleWindow.google?.accounts?.id ?? null;
  }

  private requireApi(): GoogleAccountsIdApi {
    const api = this.getApi();
    if (!api) {
      throw new Error('Google Identity API is not loaded');
    }
    return api;
  }
}
