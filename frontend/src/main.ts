// 1. THIS MUST BE THE FIRST LINE
(window as any).global = window;

import { bootstrapApplication } from '@angular/platform-browser';
import { appConfig } from './app/app.config';
import { App } from './app/app';

// 2. Then bootstrap
bootstrapApplication(App, appConfig).catch((err) => console.error(err));
