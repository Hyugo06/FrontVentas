import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { Auth } from '../services/auth'; // Tu servicio de Auth

export const adminGuard: CanActivateFn = (route, state) => {

  const authService = inject(Auth);
  const router = inject(Router);

  // --- ¡¡LÓGICA CORREGIDA!! ---
  // Comprobamos si está logueado Y si el ROL guardado es 'ADMIN'
  if (authService.isLoggedIn() && authService.getRole() === 'ADMIN') {
    return true; // Sí, es admin. Déjalo pasar.
  }

  // Si no es admin, lo redirigimos a la página de login
  console.warn('Acceso denegado: Se requiere rol de ADMIN');
  router.navigate(['/login']);
  return false;
};
