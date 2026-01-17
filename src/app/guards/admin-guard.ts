import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { Auth } from '../services/auth';

export const adminGuard: CanActivateFn = (route, state) => {

  const authService = inject(Auth);
  const router = inject(Router);

  const rol = authService.getRole();

  // 👇 AQUÍ AGREGAMOS AL VENDEDOR 👇
  if (authService.isLoggedIn() && (rol === 'ADMIN' || rol === 'MODERADOR' || rol === 'VENDEDOR')) {
    return true; // ¡Pase usted también!
  }

  // Si no es ninguno de los tres, fuera.
  console.warn('Acceso denegado: Rol no autorizado para el panel');
  router.navigate(['/login']);
  return false;
};
