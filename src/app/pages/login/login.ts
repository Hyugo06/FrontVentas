import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { Auth } from '../../services/auth';
import { HttpErrorResponse } from '@angular/common/http'; // <-- Importa esto

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './login.html',
  styleUrl: './login.css'
})
export class LoginComponent {

  public credenciales = {
    username: '',
    password: ''
  };

  public error: string | null = null; // Para mostrar errores de login

  constructor(
    private authService: Auth,
    private router: Router
  ) {}

  /**
   * ESTE ES EL MÉTODO CORREGIDO
   */
  public login(): void {
    // --- CHIVATO 1: ¿Entra a la función? ---
    console.log("--> 1. [LOGIN] Se presionó el botón. Iniciando función...");
    console.log("--> 2. [LOGIN] Datos:", this.credenciales);

    this.error = null;
    const username = this.credenciales.username;

    // Validación rápida antes de llamar a la API
    if (!username || !this.credenciales.password) {
      console.log("--> [LOGIN] Falta usuario o contraseña. Abortando.");
      this.error = "Por favor ingresa usuario y contraseña";
      return;
    }

    console.log("--> 3. [LOGIN] Llamando al AuthService con URL:", this.authService.apiUrl); // ¡Verifica la IP aquí!

    // 1. Llamamos al servicio Y NOS SUSCRIBIMOS
    this.authService.login(username, this.credenciales.password).subscribe({

      // 2. El bloque NEXT solo se ejecuta si el login (y la llamada a /me) fue exitoso
      next: (usuario) => {
        console.log("--> 4. [LOGIN] ¡ÉXITO! Respuesta del servidor:", usuario); // CHIVATO DE ÉXITO

        // 3. Leemos el ROL que guardó el servicio
        const rol = this.authService.getRole();
        console.log("--> 5. [LOGIN] Rol detectado:", rol);

        // 4. Redirigimos basándonos en el ROL
        if (rol === 'ADMIN') {
          this.router.navigate(['/admin/productos']);
        } else {
          this.router.navigate(['/productos']);
        }
      },

      // 5. El bloque ERROR se ejecuta si falla la red o la contraseña
      error: (err: HttpErrorResponse) => {
        console.error("--> 6. [LOGIN] ERROR FATAL:", err); // CHIVATO DE ERROR
        console.error("--> [LOGIN] Status:", err.status);
        console.error("--> [LOGIN] Mensaje:", err.message);
        this.error = "Usuario o contraseña incorrectos (o error de conexión).";
      }
    });
  }
}
