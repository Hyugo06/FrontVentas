import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core'; // ¡Importa inject!
import { Auth } from '../services/auth'; // ¡Importa tu servicio!

export const authInterceptor: HttpInterceptorFn = (req, next) => {

  // Inyectamos el servicio de autenticación
  const authService = inject(Auth);

  // Obtenemos el token guardado
  const authToken = authService.getAuthToken();

  // Si el token existe...
  if (authToken) {
    // Clonamos la petición (request) y le añadimos el header
    const authReq = req.clone({
      setHeaders: {
        Authorization: authToken
      }
    });
    // Continuamos con la petición clonada (que ya tiene el header)
    return next(authReq);
  }

  // Si no hay token, continuamos con la petición original
  return next(req);
};
