import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { map } from 'rxjs/operators';

export interface CartItem {
  uid: string;
  producto: any;
  variante: any | null;
  cantidad: number;
}

@Injectable({
  providedIn: 'root'
})
export class Cart { // Mantengo el nombre 'Cart' para no romper tus imports
  private key = 'margarita_cart_storage';

  private itemsSubject = new BehaviorSubject<CartItem[]>([]);
  public items$ = this.itemsSubject.asObservable();

  constructor() {
    this.cargarDeLocalStorage();
  }

  // MÉTODO PRINCIPAL
  addToCart(producto: any, variante: any | null, cantidad: number = 1) {
    const items = this.itemsSubject.value;
    const uid = variante ? `${producto.idProducto}-${variante.idVariante}` : `${producto.idProducto}-base`;

    const existing = items.find(i => i.uid === uid);

    if (existing) {
      existing.cantidad += cantidad;
    } else {
      items.push({ uid, producto, variante, cantidad });
    }

    this.actualizar(items);
  }

  // Alias para compatibilidad con tus componentes
  addItem(producto: any, variante: any | null) {
    this.addToCart(producto, variante, 1);
  }

  decrementItem(item: CartItem) {
    const items = this.itemsSubject.value;
    const index = items.findIndex(i => i.uid === item.uid);

    if (index > -1) {
      if (items[index].cantidad > 1) {
        items[index].cantidad--;
      } else {
        items.splice(index, 1);
      }
      this.actualizar(items);
    }
  }

  removeItem(item: CartItem) {
    const items = this.itemsSubject.value.filter(i => i.uid !== item.uid);
    this.actualizar(items);
  }

  clearCart() {
    this.actualizar([]);
  }

  private actualizar(items: CartItem[]) {
    this.itemsSubject.next([...items]); // El '[...]' es vital para que Angular detecte el cambio
    localStorage.setItem(this.key, JSON.stringify(items));
  }

  private cargarDeLocalStorage() {
    const saved = localStorage.getItem(this.key);
    if (saved) {
      try {
        this.itemsSubject.next(JSON.parse(saved));
      } catch (e) {
        console.error("Error al cargar carrito", e);
      }
    }
  }

  get totalItems$() {
    return this.items$.pipe(map(items => items.reduce((acc, i) => acc + i.cantidad, 0)));
  }
}
