import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { Auth } from '../services/auth';

export const authInterceptor: HttpInterceptorFn = (req, next) => {

  const authService = inject(Auth);
  const authToken = authService.getAuthToken();

  // --- 1. LA NUEVA REGLA DE SEGURIDAD (ANTI-FANTASMAS) ---
  // Si la URL es para el login ("/me") Y ya trae una autorización manual...
  // ¡DEJAMOS QUE PASE SIN TOCARLA!
  if (req.url.includes('/me') && req.headers.has('Authorization')) {
    return next(req);
  }
  // -------------------------------------------------------

  // 2. Comportamiento normal para el resto de peticiones
  if (authToken) {
    const authReq = req.clone({
      setHeaders: {
        Authorization: authToken
      }
    });
    return next(authReq);
  }

  return next(req);
};
