import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { Router, ActivatedRoute, RouterLink } from '@angular/router';
import { HttpErrorResponse } from '@angular/common/http';

// Importa tu servicio de autenticación/usuario
import { Auth } from '../../../services/auth'; //

@Component({
  selector: 'app-usuario-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink], //
  templateUrl: './usuario-form.html',
  styleUrl: './usuario-form.css'
})
export class UsuarioFormComponent implements OnInit { //

  public usuarioForm: FormGroup;
  public esEdicion: boolean = false;
  public usuarioId: string | null = null;
  public cargando: boolean = true;
  public error: string | null = null;

  public roles: string[] = ['ADMIN', 'VENDEDOR'];

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
      activo: [true, Validators.required]
    });
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
          activo: usuario.activo
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
    if (this.usuarioForm.invalid) {
      this.error = 'Por favor, completa todos los campos requeridos (*).';
      return;
    }

    const userData = this.usuarioForm.value;

    // Si la contraseña está vacía en modo edición, la eliminamos
    // para que el backend no intente hashear un string vacío.
    if (this.esEdicion && (!userData.hashContrasena || userData.hashContrasena.length === 0)) {
      delete userData.hashContrasena;
    }

    this.error = null;
    this.cargando = true;

    if (this.esEdicion && this.usuarioId) {
      // --- LÓGICA DE ACTUALIZAR (PUT) ---
      this.authService.updateUsuario(parseInt(this.usuarioId, 10), userData).subscribe({ //
        next: (response: any) => {
          alert(`Usuario ${response.nombreUsuario} actualizado con éxito!`);
          this.router.navigate(['/admin/usuarios']);
        },
        error: (err: HttpErrorResponse) => {
          this.error = `Error al actualizar: ${err.error?.message || err.statusText}`;
          this.cargando = false;
        }
      });
    } else {
      // --- LÓGICA DE CREAR (POST) ---
      this.authService.register(userData).subscribe({ //
        next: (response: any) => {
          alert(`Usuario ${response.nombreUsuario} creado con éxito!`);
          this.router.navigate(['/admin/usuarios']);
        },
        error: (err: HttpErrorResponse) => {
          this.error = `Error al crear: ${err.error?.message || 'El usuario ya existe'}`;
          this.cargando = false;
        }
      });
    }
  }
}
