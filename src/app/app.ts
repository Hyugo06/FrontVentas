import {Component, OnDestroy} from '@angular/core';
import {RouterOutlet, RouterLink, Router, NavigationEnd} from '@angular/router';
import { CommonModule } from '@angular/common';
// import { ProductoService } from './services/producto'; // (Solo si lo necesitas aquí)

// --- ¡¡AÑADE ESTA LÍNEA QUE FALTABA!! ---
import { CartStatusComponent } from './components/cart-status/cart-status';
import {NavbarComponent} from './components/navbar/navbar';
import {filter, Subscription} from 'rxjs';

@Component({
  selector: 'app-root',
  standalone: true,
  // --- ¡AÑADE CommonModule y NavbarComponent AQUÍ! ---
  imports: [RouterOutlet, CommonModule, NavbarComponent],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class AppComponent implements OnDestroy { // <-- Implementa OnDestroy

  public isAdminRoute: boolean = false;
  private routerSubscription: Subscription;

  constructor(private router: Router) {
    // 1. Comprueba la ruta en la carga inicial
    this.isAdminRoute = this.router.url.startsWith('/admin');

    // 2. Escucha los cambios de ruta
    this.routerSubscription = this.router.events.pipe(
      filter(event => event instanceof NavigationEnd)
    ).subscribe(event => {
      // Actualiza la variable cada vez que cambia la ruta
      this.isAdminRoute = (event as NavigationEnd).urlAfterRedirects.startsWith('/admin');
    });
  }

  // 3. Limpia la suscripción para evitar fugas de memoria
  ngOnDestroy(): void {
    if (this.routerSubscription) {
      this.routerSubscription.unsubscribe();
    }
  }
}
