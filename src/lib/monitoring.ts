import * as Sentry from '@sentry/react';
import LogRocket from 'logrocket';
import setupLogRocketReact from 'logrocket-react';

const SENTRY_DSN = import.meta.env.VITE_SENTRY_DSN;
const LOGROCKET_APP_ID = import.meta.env.VITE_LOGROCKET_APP_ID;
const IS_PRODUCTION = import.meta.env.PROD;

export function initializeMonitoring() {
  // Only initialize in production
  if (!IS_PRODUCTION) {
    console.log('Monitoring disabled in development mode');
    return;
  }

  // Initialize Sentry for error tracking
  if (SENTRY_DSN) {
    Sentry.init({
      dsn: SENTRY_DSN,
      environment: IS_PRODUCTION ? 'production' : 'development',
      integrations: [
        Sentry.browserTracingIntegration(),
        Sentry.replayIntegration({
          maskAllText: true,
          blockAllMedia: true,
        }),
      ],
      // Performance Monitoring
      tracesSampleRate: IS_PRODUCTION ? 0.1 : 1.0,
      // Session Replay
      replaysSessionSampleRate: 0.1,
      replaysOnErrorSampleRate: 1.0,
      // Filter sensitive data
      beforeSend(event) {
        // Remove sensitive information
        if (event.request) {
          delete event.request.cookies;
          delete event.request.headers;
        }
        return event;
      },
    });
    console.log('Sentry initialized');
  } else {
    console.warn('Sentry DSN not configured');
  }

  // Initialize LogRocket for session replay
  if (LOGROCKET_APP_ID) {
    LogRocket.init(LOGROCKET_APP_ID, {
      console: {
        shouldAggregateConsoleErrors: true,
      },
      network: {
        requestSanitizer: (request) => {
          // Sanitize sensitive data from network requests
          if (request.headers?.['Authorization']) {
            request.headers['Authorization'] = '[REDACTED]';
          }
          return request;
        },
        responseSanitizer: (response) => {
          // Sanitize sensitive data from responses
          if (response.headers?.['Set-Cookie']) {
            response.headers['Set-Cookie'] = '[REDACTED]';
          }
          return response;
        },
      },
    });

    // Setup LogRocket React plugin
    setupLogRocketReact(LogRocket);

    // Link LogRocket sessions to Sentry
    if (SENTRY_DSN) {
      LogRocket.getSessionURL((sessionURL) => {
        Sentry.setContext('LogRocket', {
          sessionURL,
        });
      });
    }

    console.log('LogRocket initialized');
  } else {
    console.warn('LogRocket App ID not configured');
  }
}

// Helper to identify user for monitoring
export function identifyUser(userId: string, email: string, fullName?: string) {
  if (!IS_PRODUCTION) return;

  if (SENTRY_DSN) {
    Sentry.setUser({
      id: userId,
      email,
      username: fullName,
    });
  }

  if (LOGROCKET_APP_ID) {
    LogRocket.identify(userId, {
      email,
      name: fullName || '',
    });
  }
}

// Helper to clear user identification on logout
export function clearUserIdentification() {
  if (!IS_PRODUCTION) return;

  if (SENTRY_DSN) {
    Sentry.setUser(null);
  }

  // LogRocket doesn't have a built-in clear method
  // But starting a new session effectively clears the previous user
}

// Helper to capture custom events
export function captureEvent(eventName: string, data?: Record<string, any>) {
  if (!IS_PRODUCTION) return;

  if (LOGROCKET_APP_ID) {
    LogRocket.track(eventName, data);
  }

  if (SENTRY_DSN) {
    Sentry.captureMessage(eventName, {
      level: 'info',
      extra: data,
    });
  }
}

// Helper to capture errors manually
export function captureError(error: Error, context?: Record<string, any>) {
  if (!IS_PRODUCTION) {
    console.error('Error captured:', error, context);
    return;
  }

  if (SENTRY_DSN) {
    Sentry.captureException(error, {
      extra: context,
    });
  }
}
