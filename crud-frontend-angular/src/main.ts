import { bootstrapApplication } from '@angular/platform-browser';
import { appConfig } from './app/app.config';
import { AppComponent } from './app/app.component'; // <-- AGORA É app.component


bootstrapApplication(AppComponent, appConfig) // <-- Use AppComponent aqui
  .catch((err) => console.error(err));