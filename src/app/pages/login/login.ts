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
    this.error = null;
    const username = this.credenciales.username;

    // 1. Llamamos al servicio Y NOS SUSCRIBIMOS
    this.authService.login(username, this.credenciales.password).subscribe({

      // 2. El bloque NEXT solo se ejecuta si el login (y la llamada a /me) fue exitoso
      next: (usuario) => {
        // 3. Leemos el ROL que guardó el servicio
        const rol = this.authService.getRole();

        // 4. Redirigimos basándonos en el ROL
        if (rol === 'ADMIN') {
          this.router.navigate(['/admin/productos']);
        } else {
          this.router.navigate(['/productos']);
        }
      },

      // 5. El bloque ERROR se ejecuta si la contraseña es incorrecta
      error: (err: HttpErrorResponse) => {
        console.error("Error en login:", err);
        this.error = "Usuario o contraseña incorrectos.";
      }
    });
  }
}
