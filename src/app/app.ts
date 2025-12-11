import {Component, OnDestroy, OnInit} from '@angular/core';
import {RouterOutlet, RouterLink, Router, NavigationEnd} from '@angular/router';
import { CommonModule } from '@angular/common';
import {NavbarComponent} from './components/navbar/navbar';
import {filter, Subscription} from 'rxjs';
import {ConfirmModalComponent} from './components/confirm-modal/confirm-modal';
import {Capacitor} from '@capacitor/core';
import {StatusBar, Style} from '@capacitor/status-bar';




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

  async ngOnInit() {
    if (Capacitor.isNativePlatform()) {
      try {
        // 1. App DEBAJO de la barra (Sin Overlay)
        await StatusBar.setOverlaysWebView({ overlay: false });

        // 2. Fondo NEGRO
        await StatusBar.setBackgroundColor({ color: '#000000' });


        // 3. ¡CORRECCIÓN! Usamos Style.Light para tener ICONOS BLANCOS
        await StatusBar.setStyle({ style: Style.Dark });

        // 4. Inyectamos clase para CSS
        document.body.classList.add('is-mobile');

      } catch (e) {
        console.log('Error StatusBar', e);
      }
    }
    this.routerSubscription = this.router.events.pipe(
      filter(event => event instanceof NavigationEnd)
    ).subscribe((event: any) => {
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
