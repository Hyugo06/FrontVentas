import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { Observable } from 'rxjs';
import { Auth } from '../../services/auth';
import { CartStatusComponent } from '../cart-status/cart-status';
import {Modal} from '../../services/modal';

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
    private router: Router,
    private modalService: Modal // <-- ¡INYECTAR EL SERVICIO!
  ) {
    this.isLoggedIn$ = this.authService.isLoggedIn$();
    this.isLoggedIn$.subscribe(isLoggedIn => {
      if (isLoggedIn) {
        this.currentUsername = this.authService.getUsername();
      } else {
        this.currentUsername = null;
      }
    });
  }

  public showLoginButton(): boolean {
    // Solo mostramos el botón si NO estamos logueados Y NO estamos en la página de login
    return !this.authService.isLoggedIn() && this.router.url !== '/login';
  }

  public isAdministrator(): boolean {
    return this.authService.isLoggedIn() && this.authService.getRole() === 'ADMIN';
  }

  public logout(): void {
    this.modalService.open('¿Estás seguro de que deseas cerrar sesión?')
      .subscribe((result: any) => {
        if (result) {
          this.authService.logout();
          this.router.navigate(['/']);
        }
      });
  }
}
