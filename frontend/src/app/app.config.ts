import { ApplicationConfig, provideZoneChangeDetection, SecurityContext } from '@angular/core';
import {
  provideRouter,
  withViewTransitions,
  withComponentInputBinding,
  withInMemoryScrolling,
} from '@angular/router';
import { provideHttpClient, withInterceptors, withFetch } from '@angular/common/http';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';

// Third-party libraries
import { provideMarkdown } from 'ngx-markdown';
import { provideCharts, withDefaultRegisterables } from 'ng2-charts';

// Local imports
import { routes } from './app.routes';
import { AuthInterceptor } from './core/auth.interceptor';

export const appConfig: ApplicationConfig = {
  providers: [
    provideZoneChangeDetection({ eventCoalescing: true }),

    provideRouter(
      routes,
      withViewTransitions(),
      withComponentInputBinding(),
      withInMemoryScrolling({ scrollPositionRestoration: 'enabled' })
    ),

    // 3. HTTP: Added withFetch for better performance (uses native Fetch API)
    provideHttpClient(withFetch(), withInterceptors([AuthInterceptor])),

    provideAnimationsAsync(),

    provideMarkdown({
      sanitize: SecurityContext.NONE,
    }),
    provideCharts(withDefaultRegisterables()),
  ],
};
