import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { Auth } from '../../../services/auth'; // Tu servicio de autenticación/usuario

@Component({
  selector: 'app-user-management',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './user-management.html',
  styleUrl: './user-management.css'
})
export class UserManagementComponent implements OnInit {

  public usuarios: any[] = [];
  public cargando: boolean = true;
  public error: string | null = null;

  constructor(private authService: Auth) {}

  ngOnInit(): void {
    this.cargarUsuarios();
  }

  cargarUsuarios(): void {
    this.cargando = true;
    this.error = null;

    // Llama al nuevo método GET /api/usuarios
    this.authService.getAllUsuarios().subscribe({
      next: (data: any) => {
        this.usuarios = data;
        this.cargando = false;
      },
      error: (err: any) => {
        console.error('Error cargando usuarios:', err);
        this.error = 'No se pudieron cargar los usuarios. Revisa la consola para más detalles.';
        this.cargando = false;
      }
    });
  }

  /**
   * Llama al servicio DELETE para desactivar un usuario (Soft Delete).
   */
  desactivarUsuario(id: number): void {
    if (confirm('¿Estás seguro de que quieres DESACTIVAR este usuario?')) {
      this.authService.deleteUsuario(id).subscribe({
        next: () => {
          // Recargamos la lista después de la desactivación
          this.cargarUsuarios();
        },
        error: (err: any) => {
          console.error('Error al desactivar usuario:', err);
          this.error = 'Error al desactivar la cuenta.';
        }
      });
    }
  }
}
