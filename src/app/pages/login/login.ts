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

        // Guardamos datos (auth.ts ya guardó token y rol, aquí guardamos extras)
        localStorage.setItem('nombreUsuarioReal', usuario.nombres);
        localStorage.setItem('misPermisos', JSON.stringify(usuario.permisos || []));

        const rol = usuario.rol;
        // Redirección basada en el ROL FRESCO que acaba de llegar
        if (rol === 'ADMIN' || rol === 'MODERADOR') {
          this.router.navigate(['/admin/dashboard']);
        } else {
          this.router.navigate(['/productos']);
        }
      },
      error: (err: HttpErrorResponse) => {
        console.error("--> [LOGIN] Error:", err);
        this.error = "Usuario o contraseña incorrectos.";
      }
    });
  }
}
