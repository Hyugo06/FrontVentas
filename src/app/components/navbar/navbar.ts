import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { Observable } from 'rxjs';
import { Auth } from '../../services/auth';
import { CartStatusComponent } from '../cart-status/cart-status';
import { Modal } from '../../services/modal';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [CommonModule, RouterLink, CartStatusComponent],
  templateUrl: './navbar.html',
  styleUrl: './navbar.css'
})
export class NavbarComponent implements OnInit {

  // Usamos una variable simple para controlar la vista de forma robusta
  public isLogged: boolean = false;
  public currentUsername: string | null = null;
  public isAdmin: boolean = false;

  constructor(
    private authService: Auth,
    private router: Router,
    private modalService: Modal
  ) {}

  ngOnInit(): void {
    // 1. Verificación INICIAL MANUAL (Sincrónico)
    // Esto asegura que si ya hay token, los botones aparezcan INSTANTÁNEAMENTE
    this.checkLoginState();

    // 2. Suscripción a cambios futuros (Asíncrono)
    // Por si te deslogueas o logueas sin recargar la página
    this.authService.isLoggedIn$().subscribe(estado => {
      this.isLogged = estado;
      this.actualizarDatosUsuario();
    });
  }

  private checkLoginState(): void {
    // Preguntamos directamente al servicio: "¿Tengo token?"
    this.isLogged = this.authService.isLoggedIn();
    this.actualizarDatosUsuario();
  }

  private actualizarDatosUsuario(): void {
    if (this.isLogged) {
      this.currentUsername = this.authService.getUsername();
      this.isAdmin = this.authService.getRole() === 'ADMIN';
    } else {
      this.currentUsername = null;
      this.isAdmin = false;
    }
  }

  public showLoginButton(): boolean {
    return !this.isLogged && this.router.url !== '/login';
  }

  public logout(): void {
    this.modalService.open('¿Estás seguro de que deseas cerrar sesión?')
      .subscribe((result: any) => {
        if (result) {
          this.authService.logout();
          this.isLogged = false; // Forzamos actualización visual
          this.router.navigate(['/login']);
        }
      });
  }
}
