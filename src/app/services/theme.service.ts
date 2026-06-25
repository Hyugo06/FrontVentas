import { Injectable, Inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class ThemeService {
  private darkModeSubject = new BehaviorSubject<boolean>(false);
  public darkMode$ = this.darkModeSubject.asObservable();
  private isBrowser: boolean;

  constructor(@Inject(PLATFORM_ID) private platformId: Object) {
    this.isBrowser = isPlatformBrowser(this.platformId);
    this.inicializarTema();
  }

  private inicializarTema(): void {
    if (!this.isBrowser) return;

    // Verificar si ya guardó una preferencia previa en este navegador
    const temaGuardado = localStorage.getItem('theme');
    const prefiereOscuro = window.matchMedia('(prefers-color-scheme: dark)').matches;

    if (temaGuardado === 'dark' || (!temaGuardado && prefiereOscuro)) {
      this.activarModoOscuro(true);
    } else {
      this.activarModoOscuro(false);
    }
  }

  public toggleTema(): void {
    const nuevoEstado = !this.darkModeSubject.value;
    this.activarModoOscuro(nuevoEstado);
  }

  private activarModoOscuro(activar: boolean): void {
    this.darkModeSubject.next(activar);
    if (!this.isBrowser) return;

    const root = document.documentElement; // Elemento <html>
    if (activar) {
      root.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      root.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  }

  public isDarkMode(): boolean {
    return this.darkModeSubject.value;
  }
}
