import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { Auth } from '../../../services/auth';

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

  // --- MÉTODO REUTILIZABLE ---
  cargarUsuarios(): void {
    this.cargando = true;
    this.error = null;

    this.authService.getAllUsuarios().subscribe({
      next: (data: any) => {
        this.usuarios = data;
        this.cargando = false;
      },
      error: (err: any) => {
        console.error('Error cargando usuarios:', err);
        this.error = 'No se pudieron cargar los usuarios.';
        this.cargando = false;
      }
    });
  }

  eliminarUsuario(usuario: any): void { // <--- Aceptamos el objeto entero o el ID, pero mejor el objeto para confirmar
    if (confirm(`¿Estás seguro de desactivar a ${usuario.nombreUsuario}?`)) {
      this.cargando = true;
      // Usamos el ID del usuario que recibimos
      this.authService.deleteUsuario(usuario.idUsuario).subscribe({
        next: () => {
          this.cargarUsuarios();
        },
        error: (err: any) => {
          this.cargando = false;
          console.error('Error al desactivar:', err);
          this.error = 'Error al desactivar la cuenta.';
        }
      });
    }
  }
}
