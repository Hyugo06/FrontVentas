import { Component, OnInit } from '@angular/core'; // <--- 1. Importa OnInit
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
export class LoginComponent implements OnInit { // <--- 2. Implementa OnInit

  public credenciales = {
    username: '',
    password: ''
  };

  public error: string | null = null;
  public showPassword: boolean = false; // Variable para controlar la visibilidad

  constructor(
    private authService: Auth,
    private router: Router
  ) {}

  // --- 3. AGREGA ESTE BLOQUE NUEVO ---
  ngOnInit(): void {
    // Apenas carga la pantalla de Login, borramos cualquier rastro del usuario anterior.
    // Esto evita que el Interceptor use un token viejo por error.
    this.authService.logout();
    console.log("--> [LOGIN INIT] Memoria limpia. Listo para nuevo usuario.");
  }
  // -----------------------------------

  public togglePasswordVisibility(): void {
    this.showPassword = !this.showPassword;
  }

  // En login.ts

  public login(): void {
    console.log("--> 1. [LOGIN] Iniciando...");

    this.error = null;
    const username = this.credenciales.username;

    if (!username || !this.credenciales.password) {
      this.error = "Por favor ingresa usuario y contraseña";
      return;
    }

    this.authService.login(username, this.credenciales.password).subscribe({
      next: (usuario) => {
        console.log("--> [LOGIN] ¡Éxito! Bienvenido:", usuario.nombreUsuario);

        // Guardamos datos auxiliares
        localStorage.setItem('nombreUsuarioReal', usuario.nombres);
        localStorage.setItem('misPermisos', JSON.stringify(usuario.permisos || []));

        // --- LÓGICA DE ATERRIZAJE INTELIGENTE ---
        this.redirigirSegunPermisos(usuario);
      },
      error: (err: HttpErrorResponse) => {
        console.error("--> [LOGIN ERROR]:", err);
        if (err.status === 401) {
          this.error = "Usuario o contraseña incorrectos";
        } else {
          this.error = "Error de conexión con el servidor";
        }
      }
    });
  }

  // --- NUEVA FUNCIÓN PRIVADA ---
  private redirigirSegunPermisos(usuario: any): void {
    const rol = usuario.rol;
    const permisos = usuario.permisos || [];

    // 1. ADMIN: Pase VIP directo al Dashboard
    if (rol === 'ADMIN') {
      this.router.navigate(['/admin/dashboard']);
      return;
    }

    // 2. MODERADOR: Verificar a dónde puede ir
    if (rol === 'MODERADOR') {
      // ¿Tiene permiso explícito para Dashboard?
      if (permisos.includes('VER_DASHBOARD')) {
        this.router.navigate(['/admin/dashboard']);
        return;
      }
      // Si no, buscamos la primera puerta abierta (Orden de prioridad)
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
      if (permisos.includes('GESTIONAR_CATEGORIAS')) {
        this.router.navigate(['/admin/categorias']);
        return;
      }
      if (permisos.includes('GESTIONAR_MARCAS')) {
        this.router.navigate(['/admin/marcas']);
        return;
      }
    }

    // 3. VENDEDOR o cualquier otro: A su zona de trabajo
    if (rol === 'VENDEDOR') {
      this.router.navigate(['/productos']);
      return;
    }

    // 4. CLIENTE o Fallback
    this.router.navigate(['/productos']);
  }
}
