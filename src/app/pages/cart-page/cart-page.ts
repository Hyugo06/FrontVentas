import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { Observable } from 'rxjs';
// ¡Importa CartItem!
import { Cart, CartItem } from '../../services/cart';
import { map } from 'rxjs/operators';
import {Modal} from '../../services/modal';
// ¡Importa Modal (la clase)!


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
    protected cartService: Cart,
    private modalService: Modal // Inyecta Modal
  ) {
    this.items$ = this.cartService.items$;
    this.total$ = this.items$.pipe(
      map(items =>
        items.reduce((total, item) => total + (item.producto.precioVenta * item.cantidad), 0)
      )
    );
  }

  incrementar(item: CartItem): void {
    // 1. Determinar el stock máximo
    const stockMaximo = item.variante ? item.variante.stockActual : item.producto.stockActual;

    // 2. Verificar antes de añadir
    if (item.cantidad < stockMaximo) {
      this.cartService.addItem(item.producto, item.variante || null);
    } else {
      // --- ¡CAMBIO AQUÍ! Usamos el Modal en lugar de alert() ---
      this.modalService.open(`Lo sentimos, solo quedan ${stockMaximo} unidades disponibles.`);
    }
  }

  decrementar(item: CartItem): void {
    if (item.cantidad > 1) {
      this.cartService.decrementItem(item);
    } else {
      this.modalService.open(`Esto eliminará "${item.producto.nombre}" del carrito. ¿Estás seguro?`)
        .subscribe((result: any) => {
          if (result) {
            this.cartService.decrementItem(item);
          }
        });
    }
  }

  eliminar(item: CartItem): void {
    this.modalService.open(`¿Estás seguro de que quieres eliminar "${item.producto.nombre}" del carrito?`)
      .subscribe((result: any) => {
        if (result) {
          this.cartService.removeItem(item);
        }
      });
  }
}
