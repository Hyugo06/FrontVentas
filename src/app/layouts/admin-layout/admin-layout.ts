import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterOutlet, RouterLink, RouterLinkActive } from '@angular/router'; // ¡Importa todo esto!
import { Auth } from '../../services/auth'; // Tu servicio de Auth

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
    private router: Router
  ) {}

  ngOnInit(): void {
    // Obtenemos el nombre de usuario al cargar el layout
    this.currentUsername = this.authService.getUsername();
  }

  public logout(): void {
    this.authService.logout();
    this.router.navigate(['/login']); // Al cerrar sesión, lo mandamos al login
  }

  public toggleMenu(): void {
    this.isMobileMenuOpen = !this.isMobileMenuOpen;
  }
}
