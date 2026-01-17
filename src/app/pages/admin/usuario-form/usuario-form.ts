import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { Router, ActivatedRoute, RouterLink } from '@angular/router';
import { HttpErrorResponse } from '@angular/common/http';
import Swal from 'sweetalert2';
// Importa tu servicio de autenticación/usuario
import { Auth } from '../../../services/auth'; //


const PERMISOS_DISPONIBLES = [
  { key: 'VER_DASHBOARD', label: 'Ver Dashboard / Resumen' },
  { key: 'GESTIONAR_PRODUCTOS', label: 'Gestionar Productos' },
  { key: 'GESTIONAR_VENTAS', label: 'Gestionar Ventas' },
  { key: 'GESTIONAR_USUARIOS', label: 'Gestionar Usuarios' },
  { key: 'GESTIONAR_CATEGORIAS', label: 'Gestionar Categorías' },
  { key: 'GESTIONAR_MARCAS', label: 'Gestionar Marcas' }
];

@Component({
  selector: 'app-usuario-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink], //
  templateUrl: './usuario-form.html',
  styleUrl: './usuario-form.css'
})
export class UsuarioFormComponent implements OnInit { //

  public listaPermisos = PERMISOS_DISPONIBLES;
  public usuarioForm: FormGroup;
  public esEdicion: boolean = false;
  public usuarioId: string | null = null;
  public cargando: boolean = true;
  public error: string | null = null;

  public roles: string[] = ['ADMIN', 'VENDEDOR', 'MODERADOR'];

  constructor(
    private fb: FormBuilder,
    private authService: Auth, // Usamos Auth para todas las llamadas de API de usuario
    private router: Router,
    private route: ActivatedRoute
  ) {
    // Definición del formulario de usuario con los nuevos campos
    this.usuarioForm = this.fb.group({
      idUsuario: [null],

      // --- ¡NUEVOS CAMPOS AÑADIDOS! ---
      nombres: ['', Validators.required],
      apellidos: ['', Validators.required],
      celular: ['', [Validators.required, Validators.pattern('^[0-9]{9}$')]],
      // ---

      nombreUsuario: ['', [Validators.required, Validators.minLength(4)]],
      hashContrasena: ['', [Validators.minLength(6)]], // Requerido solo al crear
      rol: ['VENDEDOR', Validators.required],
      activo: [true, Validators.required],
      permisos: [[]]
    });
  }

  onPermisoChange(event: any, permiso: string) {
    const permisosActuales = this.usuarioForm.get('permisos')?.value || [];

    if (event.target.checked) {
      // Si marcó el check, agregamos el permiso a la lista
      this.usuarioForm.patchValue({
        permisos: [...permisosActuales, permiso]
      });
    } else {
      // Si desmarcó, lo sacamos de la lista
      this.usuarioForm.patchValue({
        permisos: permisosActuales.filter((p: string) => p !== permiso)
      });
    }
  }

  ngOnInit(): void {
    this.usuarioId = this.route.snapshot.paramMap.get('id');

    if (this.usuarioId) {
      // --- MODO EDICIÓN ---
      this.esEdicion = true;
      // Hacemos la contraseña opcional en modo edición
      this.usuarioForm.get('hashContrasena')?.clearValidators();
      this.cargarDatosUsuario(this.usuarioId);
    } else {
      // --- MODO NUEVO ---
      this.esEdicion = false;
      this.cargando = false;
      // La contraseña SÍ es requerida (como se definió en el constructor)
    }
  }

  /**
   * Carga los datos del usuario en el formulario (Modo Edición)
   */
  cargarDatosUsuario(id: string): void {
    this.authService.getUsuarioPorId(id).subscribe({ //
      next: (usuario: any) => {
        // Mapear TODOS los datos al formulario
        this.usuarioForm.patchValue({
          idUsuario: usuario.idUsuario,
          nombres: usuario.nombres,
          apellidos: usuario.apellidos,
          celular: usuario.celular,
          nombreUsuario: usuario.nombreUsuario,
          rol: usuario.rol,
          activo: usuario.activo,
          permisos: usuario.permisos || []
          // No cargamos el hashContrasena por seguridad
        });
        this.cargando = false;
      },
      error: (err: any) => {
        this.error = 'Usuario no encontrado o error de conexión.';
        this.cargando = false;
      }
    });
  }

  /**
   * Maneja el envío del formulario (POST o PUT)
   */
  onSubmit(): void {
    // 1. Validación de campos vacíos
    if (this.usuarioForm.invalid) {
      Swal.fire({
        title: 'Faltan datos',
        text: 'Por favor, completa todos los campos requeridos (*).',
        icon: 'warning',
        confirmButtonColor: '#4f46e5', // Color Indigo
        confirmButtonText: 'Revisar'
      });
      return;
    }

    const userData = this.usuarioForm.value;

    // Si la contraseña está vacía en modo edición, la eliminamos
    if (this.esEdicion && (!userData.hashContrasena || userData.hashContrasena.length === 0)) {
      delete userData.hashContrasena;
    }

    this.error = null;
    this.cargando = true;

    if (this.esEdicion && this.usuarioId) {
      // --- LÓGICA DE ACTUALIZAR (PUT) ---
      this.authService.updateUsuario(parseInt(this.usuarioId, 10), userData).subscribe({
        next: (response: any) => {
          this.cargando = false; // Detenemos la carga visual

          Swal.fire({
            title: '¡Cambios Guardados!',
            text: `El usuario ${response.nombreUsuario} ha sido actualizado correctamente.`,
            icon: 'success',
            confirmButtonText: 'Entendido',
            confirmButtonColor: '#4f46e5'
          }).then((result) => {
            // Solo redirigimos cuando el usuario cierra la alerta
            if (result.isConfirmed || result.isDismissed) {
              this.router.navigate(['/admin/usuarios']);
            }
          });
        },
        error: (err: HttpErrorResponse) => {
          this.cargando = false;
          Swal.fire({
            title: 'Error al actualizar',
            text: err.error?.message || 'No se pudieron guardar los cambios.',
            icon: 'error',
            confirmButtonColor: '#ef4444' // Rojo para errores
          });
        }
      });
    } else {
      // --- LÓGICA DE CREAR (POST) ---
      this.authService.register(userData).subscribe({
        next: (response: any) => {
          this.cargando = false;

          Swal.fire({
            title: '¡Usuario Creado!',
            text: `Bienvenido al equipo, ${response.nombreUsuario}.`,
            icon: 'success',
            confirmButtonText: 'Excelente',
            confirmButtonColor: '#4f46e5'
          }).then((result) => {
            if (result.isConfirmed || result.isDismissed) {
              this.router.navigate(['/admin/usuarios']);
            }
          });
        },
        error: (err: HttpErrorResponse) => {
          this.cargando = false;
          Swal.fire({
            title: 'No se pudo crear',
            text: err.error?.message || 'Es posible que el usuario ya exista.',
            icon: 'error',
            confirmButtonColor: '#ef4444'
          });
        }
      });
    }
  }
}
