import {ApplicationConfig, importProvidersFrom} from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideClientHydration } from '@angular/platform-browser';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { authInterceptor } from './interceptors/auth-interceptor';
// --- ¡LA IMPORTACIÓN QUE FALTABA! ---
import {FormsModule, ReactiveFormsModule} from '@angular/forms';
// ------------------------------------

import { routes } from './app.routes';
// ... (otras importaciones) ...

export const appConfig: ApplicationConfig = {
  providers: [
    provideRouter(routes),
    provideClientHydration(),

    // --- ESTA LÍNEA ES LA SOLUCIÓN CORRECTA PARA FORMULARIOS ---
    importProvidersFrom(FormsModule, ReactiveFormsModule), // <-- Usa el módulo de formularios

    provideHttpClient(withInterceptors([
      authInterceptor
    ])),
    // ¡BORRA LA LÍNEA 'provideForms()' QUE ESTABA DANDO ERROR!
  ]
};
