import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { Auth } from '../services/auth';

export const authGuard = () => {
  const authService = inject(Auth);
  const router = inject(Router);

  // 1. Preguntamos al servicio: "¿Está logueado?"
  if (authService.isLoggedIn()) {
    return true; // ¡Pase usted!
  }

  // 2. Si no está logueado, lo mandamos al Login
  router.navigate(['/login']);
  return false;
};
