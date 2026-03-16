import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { Auth } from '../../../services/auth';

// --- NUEVO: ESTE "MOLDE" EVITA LOS ERRORES EN EL HTML ---
export interface UsuarioItem {
  idUsuario: number;
  nombreUsuario: string;
  nombres: string;
  apellidos: string;
  celular: string;
  rol: string;
  activo: boolean;
}

@Component({
  selector: 'app-user-management',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './user-management.html',
  styleUrl: './user-management.css'
})
export class UserManagementComponent implements OnInit {

  // AHORA USAMOS LA INTERFAZ EN LUGAR DE 'any'
  public usuarios: UsuarioItem[] = [];
  public cargando: boolean = true;
  public error: string | null = null;

  // VARIABLE DEL MODAL
  public usuarioAEliminar: UsuarioItem | null = null;
  public filtroEstado: 'TODOS' | 'ACTIVOS' | 'INACTIVOS' = 'ACTIVOS'; // Por defecto muestra solo Activos

  constructor(private authService: Auth) {}

  ngOnInit(): void {
    this.cargarUsuarios();
  }

  cargarUsuarios(): void {
    this.cargando = true;
    this.error = null;

    this.authService.getAllUsuarios().subscribe({
      next: (data: UsuarioItem[]) => {
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

  get usuariosFiltrados(): UsuarioItem[] {
    if (this.filtroEstado === 'ACTIVOS') {
      return this.usuarios.filter(u => u.activo);
    } else if (this.filtroEstado === 'INACTIVOS') {
      return this.usuarios.filter(u => !u.activo);
    }
    return this.usuarios; // Si es 'TODOS'
  }

  cambiarFiltro(estado: 'TODOS' | 'ACTIVOS' | 'INACTIVOS'): void {
    this.filtroEstado = estado;
  }

  // --- REUTILIZAMOS TU MÉTODO ORIGINAL ---
  // Al poner el signo de interrogación (usuario?), significa que el parámetro es opcional.
  eliminarUsuario(usuario?: UsuarioItem): void {
    if (usuario) {
      // 1. Si enviamos un usuario (al dar clic en el tacho), SOLO ABRE EL MODAL
      this.usuarioAEliminar = usuario;
    } else {
      // 2. Si NO enviamos usuario (al dar clic en el botón "Sí" dentro del modal), SE EJECUTA LA ACCIÓN
      if (!this.usuarioAEliminar) return;

      this.cargando = true;
      this.authService.deleteUsuario(this.usuarioAEliminar.idUsuario).subscribe({
        next: () => {
          this.cargarUsuarios();
          this.usuarioAEliminar = null; // Cierra el modal al terminar
        },
        error: (err: any) => {
          this.cargando = false;
          console.error('Error al procesar:', err);
          this.error = 'Error en la operación.';
          this.usuarioAEliminar = null; // Cierra el modal por seguridad
        }
      });
    }
  }

  // BOTÓN CANCELAR DEL MODAL
  cerrarModal(): void {
    this.usuarioAEliminar = null;
  }
}
