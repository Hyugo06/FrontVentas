import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { Auth } from '../services/auth';

export const adminGuard: CanActivateFn = (route, state) => {

  const authService = inject(Auth);
  const router = inject(Router);

  const rol = authService.getRole();

  if (authService.isLoggedIn() && (rol === 'ADMIN' || rol === 'MODERADOR')) {
    return true; // ¡Pase usted!
  }

  // Si no es ninguno de los dos, fuera.
  console.warn('Acceso denegado: Se requiere nivel de administración');
  router.navigate(['/login']);
  return false;
};
