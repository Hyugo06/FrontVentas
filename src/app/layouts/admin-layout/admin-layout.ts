import { Component, OnInit, Inject, PLATFORM_ID } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { Router, RouterOutlet, RouterLink, RouterLinkActive } from '@angular/router';
import { Auth } from '../../services/auth';
import { Modal } from '../../services/modal';
import { BehaviorSubject } from 'rxjs';

import Swal from 'sweetalert2';

@Component({
  selector: 'app-admin-layout',
  standalone: true,
  imports: [CommonModule, RouterOutlet, RouterLink, RouterLinkActive],
  templateUrl: './admin-layout.html',
  styleUrl: './admin-layout.css'
})
export class AdminLayoutComponent implements OnInit {

  public nombreMostrar: string | null = null;
  public isMobileMenuOpen: boolean = false;
  public isUserMenuOpen: boolean = false;
  public isProductosMenuOpen: boolean = false;

  // Lógica del modo oscuro integrada
  private darkModeSubject = new BehaviorSubject<boolean>(false);
  public darkMode$ = this.darkModeSubject.asObservable();
  private isBrowser: boolean;

  constructor(
    private authService: Auth,
    private router: Router,
    private modalService: Modal,
    @Inject(PLATFORM_ID) private platformId: Object
  ) {
    this.isBrowser = isPlatformBrowser(this.platformId);
  }

  ngOnInit(): void {
    const nombreGuardado = localStorage.getItem('nombreUsuarioReal');
    if (nombreGuardado) {
      this.nombreMostrar = nombreGuardado;
    } else {
      this.nombreMostrar = this.authService.getUsername();
    }
    const rol = this.authService.getRole();
    if (rol !== 'ADMIN' && rol !== 'MODERADOR') {
      console.warn("🚨 ACCESO DENEGADO: Vendedor intentando entrar a Admin");
      this.router.navigate(['/productos'], { replaceUrl: true });
    }

    // Inicializar el tema guardado al cargar la página
    this.inicializarTema();
  }

  private inicializarTema(): void {
    if (!this.isBrowser) return;
    const temaGuardado = localStorage.getItem('theme');
    const prefiereOscuro = window.matchMedia('(prefers-color-scheme: dark)').matches;

    if (temaGuardado === 'dark' || (!temaGuardado && prefiereOscuro)) {
      this.setModoOscuro(true);
    } else {
      this.setModoOscuro(false);
    }
  }

  public toggleTema(): void {
    this.setModoOscuro(!this.darkModeSubject.value);
  }

  private setModoOscuro(activar: boolean): void {
    this.darkModeSubject.next(activar);
    if (!this.isBrowser) return;

    const htmlRoot = document.documentElement; // Etiqueta <html>
    if (activar) {
      htmlRoot.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      htmlRoot.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  }

  public logout(): void {
    this.isMobileMenuOpen = false;
    this.isUserMenuOpen = false;

    Swal.fire({
      html: `
      <div class="flex flex-col items-center mb-2">
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="w-14 h-14 text-red-500 logout-animate-icon mb-3">
          <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" class="opacity-50"></path>
          <polyline points="16 17 21 12 16 7"></polyline>
          <line x1="21" y1="12" x2="9" y2="12"></line>
        </svg>
        <h2 class="text-lg font-bold text-gray-800">¿Cerrar sesión?</h2>
        <p class="text-sm text-gray-500 leading-tight mt-1">¿Seguro que quieres salir del panel?</p>
      </div>
    `,
      width: '300px',
      showCancelButton: true,
      confirmButtonText: 'Sí, salir',
      cancelButtonText: 'Cancelar',
      allowOutsideClick: true,
      allowEscapeKey: true,
      reverseButtons: true,
      buttonsStyling: false,
      customClass: {
        popup: 'rounded-2xl shadow-xl p-4',
        actions: 'gap-2 mt-2',
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

  public toggleMenu(): void { this.isMobileMenuOpen = !this.isMobileMenuOpen; }
  public closeMenu(): void { this.isMobileMenuOpen = false; }
  public toggleUserMenu(): void { this.isUserMenuOpen = !this.isUserMenuOpen; }
  public toggleProductosMenu(): void { this.isProductosMenuOpen = !this.isProductosMenuOpen; }

  public can(permisoRequerido: string): boolean {
    const rol = this.authService.getRole();
    if (rol === 'ADMIN') return true;
    const permisosGuardados = localStorage.getItem('misPermisos');
    if (!permisosGuardados) return false;
    const listaPermisos: string[] = JSON.parse(permisosGuardados);
    return listaPermisos.includes(permisoRequerido);
  }
}
