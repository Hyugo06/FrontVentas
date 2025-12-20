import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { Cart } from '../../services/cart';
import { Observable } from 'rxjs';

@Component({
  selector: 'app-cart-status',
  standalone: true,
  imports: [CommonModule, RouterLink],
  styles: [`
    :host {
      display: flex;
      align-items: center;
      height: 100%;
    }
  `],
  template: `
    <a routerLink="/carrito" class="relative flex items-center justify-center p-2 text-slate-600 hover:text-indigo-600 transition-colors group">
      <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
      </svg>
      @if ((total$ | async)! > 0) {
        <span class="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white shadow-sm ring-2 ring-white animate-in zoom-in">
          {{ total$ | async }}
        </span>
      }
    </a>
  `
})
export class CartStatusComponent {
  total$: Observable<number>;
  constructor(private cartService: Cart) {
    this.total$ = this.cartService.totalItems$;
  }
}
