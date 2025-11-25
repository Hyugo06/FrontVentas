import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { ProductoVariante } from './producto'; // Importamos la interfaz de variante

export interface CartItem {
  producto: any;
  cantidad: number;
  variante?: ProductoVariante | null; // <--- ¡NUEVO CAMPO!
}

@Injectable({
  providedIn: 'root'
})
export class Cart {

  private itemsSubject = new BehaviorSubject<CartItem[]>([]);
  public items$ = this.itemsSubject.asObservable();

  public totalItems$: Observable<number> = this.items$.pipe(
    map(items => items.reduce((total, item) => total + item.cantidad, 0))
  );

  constructor() { }

  /**
   * Añade un producto (con o sin variante) al carrito.
   */
  public addItem(producto: any, variante: ProductoVariante | null = null): void {
    const itemsActuales = this.itemsSubject.getValue();

    // Buscamos si ya existe este producto CON ESTA MISMA variante
    const itemEnCarrito = itemsActuales.find(item => {
      const mismoProducto = item.producto.idProducto === producto.idProducto;
      const mismaVariante = item.variante?.idVariante === variante?.idVariante;
      return mismoProducto && mismaVariante;
    });

    if (itemEnCarrito) {
      itemEnCarrito.cantidad++;
    } else {
      itemsActuales.push({
        producto: producto,
        cantidad: 1,
        variante: variante
      });
    }
    this.itemsSubject.next(itemsActuales);
  }

  public decrementItem(item: CartItem): void {
    let itemsActuales = this.itemsSubject.getValue();
    // Buscamos el item exacto (producto + variante)
    const targetItem = itemsActuales.find(i =>
      i.producto.idProducto === item.producto.idProducto &&
      i.variante?.idVariante === item.variante?.idVariante
    );

    if (targetItem) {
      if (targetItem.cantidad > 1) {
        targetItem.cantidad--;
      } else {
        // Eliminar si llega a 0
        this.removeItem(item);
        return; // Salimos para no emitir dos veces
      }
    }
    this.itemsSubject.next(itemsActuales);
  }

  public removeItem(item: CartItem): void {
    const itemsActuales = this.itemsSubject.getValue();
    const itemsFiltrados = itemsActuales.filter(i =>
      !(i.producto.idProducto === item.producto.idProducto && i.variante?.idVariante === item.variante?.idVariante)
    );
    this.itemsSubject.next(itemsFiltrados);
  }

  public clearCart(): void {
    this.itemsSubject.next([]);
  }
}
