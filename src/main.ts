// Reemplaza el contenido de src/main.ts con esto:

import { bootstrapApplication } from '@angular/platform-browser';
import { appConfig } from './app/app.config';
// --- ¡CAMBIO AQUÍ! ---
// No importamos 'App', importamos 'AppComponent'
import { AppComponent } from './app/app';
// ---

bootstrapApplication(AppComponent, appConfig) // <-- Y lo usamos aquí
  .catch((err) => console.error(err));
