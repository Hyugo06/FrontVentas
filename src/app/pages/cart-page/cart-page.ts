import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { Observable } from 'rxjs';
import { Cart, CartItem } from '../../services/cart';
import { map } from 'rxjs/operators';
import { Modal } from '../../services/modal';
import {environment} from '../../../environments/environment.prod';

@Component({
  selector: 'app-cart-page',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './cart-page.html',
  styleUrl: './cart-page.css'
})
export class CartPageComponent {

  public items$: Observable<CartItem[]>;
  public total$: Observable<number>;

  constructor(
    public cartService: Cart, // Cambiado a public para usarlo en el HTML si hace falta
    private modalService: Modal
  ) {
    this.items$ = this.cartService.items$;
    this.total$ = this.items$.pipe(
      map(items => items.reduce((total, item) => total + (item.producto.precioVenta * item.cantidad), 0))
    );
  }

  // --- NUEVA FUNCIÓN INTELIGENTE ---
  resolverUrlImagen(url: string | null | undefined): string {
    if (!url) return 'assets/img/sin-imagen.png';

    // 1. Si ya es de Cloudinary (empieza con http), la dejamos tal cual
    if (url.startsWith('http')) {
      return url;
    }

    // 2. Si es una imagen antigua (ruta relativa), le pegamos tu dominio de Render
    return environment.apiUrl + url;
  }

  incrementar(item: CartItem): void {
    const stockMaximo = item.variante ? item.variante.stockActual : item.producto.stockActual;
    if (item.cantidad < stockMaximo) {
      this.cartService.addItem(item.producto, item.variante);
    } else {
      this.modalService.open(`Lo sentimos, solo quedan ${stockMaximo} unidades.`);
    }
  }

  decrementar(item: CartItem): void {
    if (item.cantidad > 1) {
      this.cartService.decrementItem(item);
    } else {
      this.eliminar(item);
    }
  }

  eliminar(item: CartItem): void {
    this.modalService.open(`¿Deseas quitar "${item.producto.nombre}" del carrito?`)
      .subscribe(result => {
        if (result) this.cartService.removeItem(item);
      });
  }
}
