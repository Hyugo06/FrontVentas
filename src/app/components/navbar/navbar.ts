import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { Observable } from 'rxjs';
import { Auth } from '../../services/auth';
import { CartStatusComponent } from '../cart-status/cart-status';
import { Modal } from '../../services/modal';
import {UiService} from '../../services/ui.service';

import Swal from 'sweetalert2';

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
    private modalService: Modal,
    private uiService: UiService
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
    this.uiService.closeMenu();

    Swal.fire({
      // Usamos HTML personalizado para el contenido
      html: `
      <div class="flex flex-col items-center mb-2">
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="w-14 h-14 text-red-500 logout-animate-icon mb-3">
          <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" class="opacity-50"></path>
          <polyline points="16 17 21 12 16 7"></polyline>
          <line x1="21" y1="12" x2="9" y2="12"></line>
        </svg>
        <h2 class="text-lg font-bold text-gray-800">¿Cerrar sesión?</h2>
        <p class="text-sm text-gray-500 leading-tight mt-1">¿Seguro que quieres salir?</p>
      </div>
    `,
      width: '300px',
      showCancelButton: true,
      confirmButtonText: 'Sí, salir',
      cancelButtonText: 'Cancelar',
      allowOutsideClick: true,
      allowEscapeKey: true,
      reverseButtons: true, // Pone el botón Cancelar primero (más seguro)
      buttonsStyling: false, // Desactiva estilos por defecto para usar Tailwind
      customClass: {
        popup: 'rounded-2xl shadow-xl p-4', // Bordes redondeados y padding
        actions: 'gap-2 mt-2', // Espacio entre botones
        confirmButton: 'bg-red-500 hover:bg-red-600 text-white font-medium px-4 py-2 rounded-lg text-sm transition-colors w-full sm:w-auto focus:ring-2 focus:ring-red-500 focus:ring-offset-2',
        cancelButton: 'bg-white hover:bg-gray-50 text-gray-700 font-medium px-4 py-2 rounded-lg border border-gray-200 text-sm transition-colors w-full sm:w-auto'
      }
    }).then((result) => {
      if (result.isConfirmed) {
        this.authService.logout();
        this.router.navigate(['/login']);
      }
    });
  }
}
