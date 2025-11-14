import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { Observable } from 'rxjs';
import { Auth } from '../../services/auth';
import { CartStatusComponent } from '../cart-status/cart-status';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [CommonModule, RouterLink, CartStatusComponent],
  templateUrl: './navbar.html',
  styleUrl: './navbar.css'
})
export class NavbarComponent {

  public isLoggedIn$: Observable<boolean>;
  public currentUsername: string | null = null; // <-- ¡AÑADE ESTA PROPIEDAD!

  constructor(
    private authService: Auth,
    private router: Router
  ) {
    // 1. Nos suscribimos al observable de estado de login
    this.isLoggedIn$ = this.authService.isLoggedIn$();

    // --- ¡AÑADE ESTA LÓGICA! ---
    // 2. Nos suscribimos a los cambios para actualizar el nombre de usuario
    this.isLoggedIn$.subscribe(isLoggedIn => {
      if (isLoggedIn) {
        // Si está logueado, obtenemos el nombre guardado
        this.currentUsername = this.authService.getUsername();
      } else {
        // Si cierra sesión, lo limpiamos
        this.currentUsername = null;
      }
    });
  }

  // (Tu método isAdministrator() está bien)
  public isAdministrator(): boolean {
    // Antes (INCORRECTO): return this.authService.getUsername() === 'admin';
    // Ahora (CORRECTO):
    return this.authService.isLoggedIn() && this.authService.getRole() === 'ADMIN';
  }
  // --

  public logout(): void {
    this.authService.logout();
    this.router.navigate(['/']);
  }
}
