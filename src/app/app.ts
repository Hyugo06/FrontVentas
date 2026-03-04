import { Component, OnDestroy, OnInit, ChangeDetectorRef, NgZone } from '@angular/core';
import { RouterOutlet, Router, NavigationEnd } from '@angular/router';
import { CommonModule, Location } from '@angular/common';
import { NavbarComponent } from './components/navbar/navbar';
import { filter, Subscription } from 'rxjs';
import { ConfirmModalComponent } from './components/confirm-modal/confirm-modal';
import { Capacitor } from '@capacitor/core';
import { StatusBar, Style } from '@capacitor/status-bar';
import { App } from '@capacitor/app';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, CommonModule, NavbarComponent, ConfirmModalComponent],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class AppComponent implements OnInit, OnDestroy {

  public showPublicNavbar: boolean = true;
  // Variables para depuración (las borraremos luego)
  public rutaActual: string = '';
  private routerSubscription: Subscription | undefined;

  constructor(
    private router: Router,
    private location: Location,
    private cdRef: ChangeDetectorRef,
    private ngZone: NgZone
  ) {}

  async ngOnInit() {
    if (Capacitor.isNativePlatform()) {
      try {
        await StatusBar.setOverlaysWebView({ overlay: true });

        await StatusBar.setBackgroundColor({ color: 'transparent' });

        await StatusBar.setStyle({ style: Style.Dark });

        document.body.classList.add('is-mobile');
        this.configurarBotonAtras();
      } catch (e) {
        console.log('Error StatusBar:', e);
      }
    }

    // Chequeo inicial
    this.verificarNavbar(this.router.url);

    // Suscripción
    this.routerSubscription = this.router.events.pipe(
      filter(event => event instanceof NavigationEnd)
    ).subscribe((event: any) => {
      const urlFinal = event.urlAfterRedirects || event.url;
      this.verificarNavbar(urlFinal);
    });
  }

  private verificarNavbar(url: string) {
    this.ngZone.run(() => {
      this.rutaActual = url;

      const ruta = url.split(/[?#]/)[0]; // Limpieza profunda de URL

      const esAdmin = ruta.includes('/admin');
      const esLogin = ruta.includes('/login') || ruta === '/' || ruta === '/index.html';

      if (esAdmin || esLogin) {
        this.actualizarUI(false);
        return;
      }

      if (ruta.includes('/productos') || ruta.includes('/carrito') || ruta.includes('/checkout') || ruta.includes('/gracias')) {
        this.actualizarUI(true);
        return;
      }

      this.actualizarUI(true);
    });
  }

  private actualizarUI(mostrar: boolean) {
    if (this.showPublicNavbar !== mostrar) {
      this.showPublicNavbar = mostrar;
      this.cdRef.detectChanges();
    }
  }

  configurarBotonAtras() {
    App.addListener('backButton', () => {
      this.ngZone.run(() => {
        let ruta = this.router.url.split('?')[0].split('#')[0];

        if (ruta.length > 1 && ruta.endsWith('/')) {
          ruta = ruta.slice(0, -1);
        }
        console.log(`🔍 [BackButton] Ruta limpia: '${ruta}'`);
        const rutasRaiz = [
          '/login',
          '/admin/dashboard',
          '/productos',
          '/home',
          '/',
          '/index.html'
        ];
        if (rutasRaiz.includes(ruta)) {
          console.log('👋 En raíz -> Minimizando App');
          App.exitApp();
        } else {
          console.log('⬅️ En sub-página -> Retrocediendo');
          this.location.back();
        }
      });
    });
  }

  ngOnDestroy() {
    if (this.routerSubscription) {
      this.routerSubscription.unsubscribe();
    }
  }
}
