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
      map(items => items.reduce((total, item) => {
        // Si está en oferta y el precio regular existe, usamos el regular (la oferta). Si no, usamos el precio de venta (el caro).
        const precioFinal = (item.producto.enOferta && item.producto.precioRegular && item.producto.precioVenta > item.producto.precioRegular)
          ? item.producto.precioRegular
          : item.producto.precioVenta;
        return total + (precioFinal * item.cantidad);
      }, 0))
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
    let stockMaximo = 0;

    // 👇 Buscamos en la mochila cuánto queda en esa tienda específica
    if (item.idSucursal === 0) {
      stockMaximo = item.variante ? (item.variante.stockActual || 0) : (item.producto.stockActual || 0);
    } else {
      if (item.variante && item.variante.inventarios) {
        const inv = item.variante.inventarios.find((i: any) => Number(i.idSucursal) === item.idSucursal);
        stockMaximo = inv ? (inv.stockActual || 0) : 0;
      } else {
        stockMaximo = item.producto.stockActual || 0;
      }
    }

    if (item.cantidad < stockMaximo) {
      // Pasamos el producto con su contexto intacto
      this.cartService.addToCart(item.producto, item.variante, 1);
    } else {
      this.modalService.open(`Lo sentimos, solo quedan ${stockMaximo} unidades en ${item.nombreSucursal}.`);
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
