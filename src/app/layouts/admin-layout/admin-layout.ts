import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterOutlet, RouterLink, RouterLinkActive } from '@angular/router'; // ¡Importa todo esto!
import { Auth } from '../../services/auth';
import {Modal} from '../../services/modal'; // Tu servicio de Auth

@Component({
  selector: 'app-admin-layout',
  standalone: true,
  // ¡Asegúrate de importar RouterOutlet, RouterLink y RouterLinkActive!
  imports: [CommonModule, RouterOutlet, RouterLink, RouterLinkActive],
  templateUrl: './admin-layout.html',
  styleUrl: './admin-layout.css'
})
export class AdminLayoutComponent implements OnInit {

  public currentUsername: string | null = null;
  public isMobileMenuOpen: boolean = false;

  constructor(
    private authService: Auth,
    private router: Router,
    private modalService: Modal // <-- ¡INYECTAR EL SERVICIO!
  ) {}

  ngOnInit(): void {
    // Obtenemos el nombre de usuario al cargar el layout
    this.currentUsername = this.authService.getUsername();
  }

  public logout(): void {
    // 1. Abrir el modal preguntando
    this.modalService.open('¿Estás seguro de que deseas cerrar sesión?')
      .subscribe((result: any) => {
        // 2. Si el usuario dice "Sí" (true)
        if (result) {
          this.authService.logout();
          this.router.navigate(['/login']);
        }
      });
  }

  public toggleMenu(): void {
    this.isMobileMenuOpen = !this.isMobileMenuOpen;
  }
}
