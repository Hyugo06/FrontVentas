import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { Router, ActivatedRoute, RouterLink } from '@angular/router';
import { HttpErrorResponse } from '@angular/common/http';

// --- Importa tu servicio de autenticación/usuario ---
import { Auth } from '../../../services/auth';
import {Usuario} from '../../../services/usuario';

@Component({
  selector: 'app-usuario-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink], // <-- Asegúrate de tener RouterLink
  templateUrl: './usuario-form.html',
  styleUrl: './usuario-form.css'
})
export class UsuarioFormComponent implements OnInit {

  public usuarioForm: FormGroup;
  public esEdicion: boolean = false;
  public usuarioId: string | null = null;
  public cargando: boolean = true;
  public error: string | null = null;

  // Roles disponibles para el dropdown
  public roles: string[] = ['ADMIN', 'VENDEDOR'];

  constructor(
    private fb: FormBuilder,
    private usuarioService: Usuario,
    private authService: Auth, // Usamos Auth para la gestión de usuarios
    private router: Router,
    private route: ActivatedRoute
  ) {
    // Definición del formulario de usuario
    this.usuarioForm = this.fb.group({
      idUsuario: [null], // Se llena solo en edición
      nombreUsuario: ['', [Validators.required, Validators.minLength(4)]],
      // NOTA: En edición, la contraseña no es requerida.
      // Solo se envía si el admin quiere cambiarla.
      hashContrasena: ['', [Validators.minLength(6)]],
      rol: ['VENDEDOR', Validators.required],
      activo: [true, Validators.required]
    });
  }

  ngOnInit(): void {
    // 1. Verificar si estamos en modo edición
    this.usuarioId = this.route.snapshot.paramMap.get('id');

    if (this.usuarioId) {
      this.esEdicion = true;
      this.cargarDatosUsuario(this.usuarioId);
    } else {
      this.esEdicion = false;
      this.cargando = false;
    }
  }

  /**
   * Carga los datos del usuario en el formulario para edición.
   */
  cargarDatosUsuario(id: string): void {
    this.authService.getUsuarioPorId(id).subscribe({
      next: (usuario: any) => {
        // Mapear los datos de la respuesta al formulario
        this.usuarioForm.patchValue({
          idUsuario: usuario.idUsuario,
          nombreUsuario: usuario.nombreUsuario,
          rol: usuario.rol,
          activo: usuario.activo
          // NO cargamos el hashContrasena por seguridad. Se queda vacío.
        });
        this.cargando = false;
      },
      error: (err: HttpErrorResponse) => {
        this.error = 'Usuario no encontrado o error de conexión.';
        this.cargando = false;
        console.error('Error cargando datos del usuario:', err);
      }
    });
  }

  /**
   * Maneja el envío del formulario (POST o PUT)
   */
  onSubmit(): void {
    // Si el formulario es inválido y no estamos en edición (donde la contraseña es opcional)
    if (this.usuarioForm.invalid) {
      this.error = 'Por favor, completa correctamente todos los campos.';
      return;
    }

    const userData = this.usuarioForm.value;

    // Si la contraseña está vacía, la eliminamos del objeto para no enviarla al backend
    if (this.esEdicion && (!userData.hashContrasena || userData.hashContrasena.length === 0)) {
      delete userData.hashContrasena;
    }

    this.error = null; // Limpiamos el error

    // Si es Edición (PUT)
    if (this.esEdicion && this.usuarioId) {
      const idNumber = parseInt(this.usuarioId, 10);
      this.actualizarUsuario(idNumber, userData);
    }
    // Si es Creación (POST)
    else {
      this.crearUsuario(userData);
    }
  }

  crearUsuario(data: any): void {
    this.usuarioService.register(data).subscribe({
      next: (response: any) => { // <-- Arregla el tipo 'response'
        alert(`Producto ${response.nombreUsuario} creado con éxito!`);
        this.router.navigate(['/admin/productos']);
      },
      error: (err: HttpErrorResponse) => { // <-- Arregla el tipo 'err'
        this.error = `Error al crear: ${err.error.message || err.statusText}`;
        console.error('Error al crear usuario:', err);
      }
    });
  }

  actualizarUsuario(id: number, data: any): void {
    // ...
    this.usuarioService.updateUsuario(id, data).subscribe({
      next: (response: any) => { // <-- Arregla el tipo 'response'
        alert(`Producto ${response.nombreUsuario} actualizado con éxito!`);
        this.router.navigate(['/admin/productos']);
      },
      error: (err: HttpErrorResponse) => { // <-- Arregla el tipo 'err'
        this.error = `Error al actualizar: ${err.error.message || err.statusText}`;
        console.error('Error al actualizar usuario:', err);
      }
    });
  }
}
