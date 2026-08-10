export type RuntimeConfig = {
  sentryDsn?: string;
  sentryEnvironment?: string;
  sentryRelease?: string;
};

declare global {
  interface Window {
    __TECHSTORE_CONFIG__?: RuntimeConfig;
  }
}

export const RUNTIME_CONFIG: RuntimeConfig = window.__TECHSTORE_CONFIG__ ?? {};
