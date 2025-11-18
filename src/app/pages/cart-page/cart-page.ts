import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { Observable } from 'rxjs';
import { Cart, CartItem } from '../../services/cart'; // Importa el servicio y la interfaz
import { map } from 'rxjs/operators';

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

  constructor(private cartService: Cart) {
    this.items$ = this.cartService.items$;

    this.total$ = this.items$.pipe(
      map(items =>
        items.reduce((total, item) => total + (item.producto.precioVenta * item.cantidad), 0)
      )
    );
  }

  // --- Métodos para los botones (Actualizados) ---

  /**
   * (Esta función se queda igual, solo cambia el tipo de 'item')
   */
  incrementar(item: CartItem): void {
    this.cartService.addItem(item.producto);
  }

  /**
   * ¡MODIFICADO!
   * Ahora comprueba la cantidad antes de actuar.
   */
  decrementar(item: CartItem): void {
    if (item.cantidad > 1) {
      // Si hay más de 1, solo decrementa. Sin aviso.
      this.cartService.decrementItem(item.producto);
    } else {
      // Si la cantidad es 1, pide confirmación (requisito 2).
      if (confirm(`Esto eliminará "${item.producto.nombre}" del carrito. ¿Estás seguro?`)) {
        this.cartService.decrementItem(item.producto); // El servicio se encargará de borrarlo
      }
    }
  }

  /**
   * ¡MODIFICADO!
   * Ahora pide confirmación antes de eliminar (requisito 1).
   */
  eliminar(item: CartItem): void {
    if (confirm(`¿Estás seguro de que quieres eliminar "${item.producto.nombre}" del carrito?`)) {
      this.cartService.removeItem(item.producto);
    }
  }
}
