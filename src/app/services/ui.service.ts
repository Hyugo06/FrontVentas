import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class UiService {
  private menuOpen = new BehaviorSubject<boolean>(false);
  // Observable para que los componentes escuchen
  menuOpen$ = this.menuOpen.asObservable();

  toggleMenu() { this.menuOpen.next(!this.menuOpen.value); }
  closeMenu() { this.menuOpen.next(false); }
}
