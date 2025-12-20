import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { Observable } from 'rxjs';
import { Cart, CartItem } from '../../services/cart';
import { map } from 'rxjs/operators';
import { Modal } from '../../services/modal';

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
    private modalService: Modal
  ) {
    this.items$ = this.cartService.items$;
    this.total$ = this.items$.pipe(
      map(items => items.reduce((total, item) => total + (item.producto.precioVenta * item.cantidad), 0))
    );
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

  // ESTO ES LO QUE FALTABA
  eliminar(item: CartItem): void {
    this.modalService.open(`¿Deseas quitar "${item.producto.nombre}" del carrito?`)
      .subscribe(result => {
        if (result) this.cartService.removeItem(item);
      });
  }
}
