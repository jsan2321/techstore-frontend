import { bootstrapApplication } from '@angular/platform-browser';
import * as Sentry from '@sentry/angular';
import { appConfig } from './app/app.config';
import { App } from './app/app';
import { RUNTIME_CONFIG } from './app/core/config/runtime-config';

if (RUNTIME_CONFIG.sentryDsn) {
  Sentry.init({
    dsn: RUNTIME_CONFIG.sentryDsn,
    environment: RUNTIME_CONFIG.sentryEnvironment ?? 'production',
    release: RUNTIME_CONFIG.sentryRelease,
    integrations: [Sentry.browserTracingIntegration()],
    tracesSampleRate: 0.1,
    tracePropagationTargets: [window.location.origin],
    sendDefaultPii: false,
    beforeSend(event) {
      delete event.user;
      if (event.request) {
        delete event.request.data;
        delete event.request.cookies;
        delete event.request.headers;
      }
      return event;
    }
  });
}

bootstrapApplication(App, appConfig)
  .catch((err) => console.error(err));
