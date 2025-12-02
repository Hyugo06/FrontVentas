import {Component, OnDestroy, OnInit} from '@angular/core';
import {RouterOutlet, RouterLink, Router, NavigationEnd} from '@angular/router';
import { CommonModule } from '@angular/common';
import {NavbarComponent} from './components/navbar/navbar';
import {filter, Subscription} from 'rxjs';
import {ConfirmModalComponent} from './components/confirm-modal/confirm-modal';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, CommonModule, NavbarComponent,ConfirmModalComponent],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class AppComponent implements OnInit, OnDestroy {

  public showPublicNavbar: boolean = true;
  private routerSubscription: Subscription | undefined;

  constructor(private router: Router) {}

  ngOnInit() {
    // Nos suscribimos a los eventos de navegación
    this.routerSubscription = this.router.events.pipe(
      filter(event => event instanceof NavigationEnd)
    ).subscribe((event: any) => {
      // Lógica maestra:
      // Si la URL empieza con '/admin' O es la página de '/login', OCULTAMOS la navbar pública.
      // En todos los demás casos (tienda, carrito, checkout), la mostramos.
      const isAdmin = event.urlAfterRedirects.startsWith('/admin');
      const isLogin = event.urlAfterRedirects.includes('/login');

      this.showPublicNavbar = !(isAdmin || isLogin);
    });
  }

  ngOnDestroy() {
    if (this.routerSubscription) {
      this.routerSubscription.unsubscribe();
    }
  }
}
