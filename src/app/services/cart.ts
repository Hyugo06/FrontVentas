import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
// ¡Añadimos 'map' para el contador!
import { map } from 'rxjs/operators';

export interface CartItem {
  producto: any;
  cantidad: number;
}

@Injectable({
  providedIn: 'root'
})
export class Cart { // Tu clase 'Cart'

  private itemsSubject = new BehaviorSubject<CartItem[]>([]);
  public items$ = this.itemsSubject.asObservable();

  // --- ¡NUEVO OBSERVABLE PARA EL CONTADOR! ---
  /**
   * Un observable que solo emite la *cantidad total* de items en el carrito.
   * Ej: 2 polos + 1 gorra = 3 items.
   */
  public totalItems$: Observable<number> = this.items$.pipe(
    map(items => {
      // Suma la 'cantidad' de cada item
      return items.reduce((total, item) => total + item.cantidad, 0);
    })
  );

  constructor() { }

  /**
   * Añade 1 unidad de un producto.
   */
  public addItem(producto: any): void {
    const itemsActuales = this.itemsSubject.getValue();
    const itemEnCarrito = itemsActuales.find(item =>
      item.producto.idProducto === producto.idProducto
    );

    if (itemEnCarrito) {
      itemEnCarrito.cantidad++;
    } else {
      itemsActuales.push({
        producto: producto,
        cantidad: 1
      });
    }
    this.itemsSubject.next(itemsActuales);
  }

  // --- ¡NUEVO MÉTODO! ---
  /**
   * Disminuye 1 unidad de un producto.
   * Si la cantidad llega a 0, lo elimina de la lista.
   */
  public decrementItem(producto: any): void {
    let itemsActuales = this.itemsSubject.getValue();
    const itemEnCarrito = itemsActuales.find(item =>
      item.producto.idProducto === producto.idProducto
    );

    if (itemEnCarrito && itemEnCarrito.cantidad > 1) {
      // Si hay más de 1, solo resta
      itemEnCarrito.cantidad--;
    } else if (itemEnCarrito && itemEnCarrito.cantidad === 1) {
      // Si solo queda 1, elimina el item del array
      itemsActuales = itemsActuales.filter(item => item.producto.idProducto !== producto.idProducto);
    }

    this.itemsSubject.next(itemsActuales);
  }

  // --- ¡NUEVO MÉTODO! ---
  /**
   * Elimina un producto del carrito, sin importar la cantidad.
   */
  public removeItem(producto: any): void {
    const itemsActuales = this.itemsSubject.getValue();
    const itemsFiltrados = itemsActuales.filter(item =>
      item.producto.idProducto !== producto.idProducto
    );
    this.itemsSubject.next(itemsFiltrados);
  }

  // --- (Tu método clearCart() se queda igual) ---
  public clearCart(): void {
    this.itemsSubject.next([]);
  }
}
