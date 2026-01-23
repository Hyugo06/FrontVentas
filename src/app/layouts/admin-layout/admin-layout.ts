import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterOutlet, RouterLink, RouterLinkActive } from '@angular/router';
import { Auth } from '../../services/auth';
import { Modal } from '../../services/modal';

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

  constructor(
    private authService: Auth,
    private router: Router,
    private modalService: Modal
  ) {}

  ngOnInit(): void {
    const nombreGuardado = localStorage.getItem('nombreUsuarioReal');
    if (nombreGuardado) {
      this.nombreMostrar = nombreGuardado;
    } else {
      this.nombreMostrar = this.authService.getUsername();
    }
  }

  // --- AQUÍ ESTÁ LA CORRECCIÓN ---
  public logout(): void {
    // 1. ¡PRIMERO! Cerramos todos los menús para que no estorben visualmente
    this.isMobileMenuOpen = false;
    this.isUserMenuOpen = false;

    // 2. Ahora sí, lanzamos la modal. Al no haber menú, se verá perfecta.
    this.modalService.open('¿Estás seguro de que deseas cerrar sesión?')
      .subscribe((result: any) => {
        if (result) {
          this.authService.logout();
          this.router.navigate(['/login']);
        }
      });
  }
  // -------------------------------

  public toggleMenu(): void {
    this.isMobileMenuOpen = !this.isMobileMenuOpen;
  }

  public closeMenu(): void {
    this.isMobileMenuOpen = false;
  }

  public toggleUserMenu(): void {
    this.isUserMenuOpen = !this.isUserMenuOpen;
  }

  public can(permisoRequerido: string): boolean {
    const rol = this.authService.getRole();
    if (rol === 'ADMIN') return true;

    const permisosGuardados = localStorage.getItem('misPermisos');
    if (!permisosGuardados) return false;

    const listaPermisos: string[] = JSON.parse(permisosGuardados);
    return listaPermisos.includes(permisoRequerido);
  }
}
