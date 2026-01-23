import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { Auth } from '../../services/auth';
import { HttpErrorResponse } from '@angular/common/http';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './login.html',
  styleUrl: './login.css'
})
export class LoginComponent implements OnInit {

  public credenciales = {
    username: '',
    password: ''
  };

  public error: string | null = null;
  public showPassword: boolean = false;

  // 1. NUEVA VARIABLE (Único cambio estructural)
  public cargando: boolean = false;

  constructor(
    private authService: Auth,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.authService.logout();
    console.log("--> [LOGIN INIT] Memoria limpia. Listo para nuevo usuario.");
  }

  public togglePasswordVisibility(): void {
    this.showPassword = !this.showPassword;
  }

  public login(): void {
    console.log("--> 1. [LOGIN] Iniciando...");

    this.error = null;
    const username = this.credenciales.username;

    if (!username || !this.credenciales.password) {
      this.error = "Por favor ingresa usuario y contraseña";
      return;
    }

    // 2. ACTIVAR CARGA (Bloquea el botón)
    this.cargando = true;

    // TU SERVICIO ORIGINAL SE MANTIENE INTACTO
    this.authService.login(username, this.credenciales.password).subscribe({
      next: (usuario) => {
        console.log("--> [LOGIN] ¡Éxito! Bienvenido:", usuario.nombreUsuario);

        localStorage.setItem('nombreUsuarioReal', usuario.nombres);
        localStorage.setItem('misPermisos', JSON.stringify(usuario.permisos || []));

        // TU LÓGICA DE REDIRECCIÓN ORIGINAL SE MANTIENE INTACTA
        this.redirigirSegunPermisos(usuario);

        // No ponemos cargando = false aquí para que el botón siga bloqueado mientras redirige
      },
      error: (err: HttpErrorResponse) => {
        console.error("--> [LOGIN ERROR]:", err);

        // 3. DESACTIVAR CARGA SI FALLA (Para permitir intentar de nuevo)
        this.cargando = false;

        if (err.status === 401) {
          this.error = "Usuario o contraseña incorrectos";
        } else {
          this.error = "Error de conexión con el servidor";
        }
      }
    });
  }

  // ESTA FUNCIÓN ES LA TUYA ORIGINAL, NO SE HA TOCADO NADA
  private redirigirSegunPermisos(usuario: any): void {
    const rol = usuario.rol;
    const permisos = usuario.permisos || [];

    if (rol === 'ADMIN') {
      this.router.navigate(['/admin/dashboard']);
      return;
    }

    if (rol === 'MODERADOR') {
      if (permisos.includes('VER_DASHBOARD')) {
        this.router.navigate(['/admin/dashboard']);
        return;
      }
      if (permisos.includes('GESTIONAR_PRODUCTOS')) {
        this.router.navigate(['/admin/productos']);
        return;
      }
      if (permisos.includes('GESTIONAR_VENTAS')) {
        this.router.navigate(['/admin/ventas']);
        return;
      }
      if (permisos.includes('GESTIONAR_CUPONES')) {
        this.router.navigate(['/admin/cupones']);
        return;
      }
      if (permisos.includes('GESTIONAR_USUARIOS')) {
        this.router.navigate(['/admin/usuarios']);
        return;
      }
      if (permisos.includes('GESTIONAR_CLIENTES')) {
        this.router.navigate(['/admin/clientes']);
        return;
      }
      if (permisos.includes('GESTIONAR_CATEGORIAS')) {
        this.router.navigate(['/admin/categorias']);
        return;
      }
      if (permisos.includes('GESTIONAR_MARCAS')) {
        this.router.navigate(['/admin/marcas']);
        return;
      }
    }

    if (rol === 'VENDEDOR') {
      this.router.navigate(['/productos']);
      return;
    }

    this.router.navigate(['/productos']);
  }
}
