import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import Swal from 'sweetalert2';

export interface CartItem {
  uid: string;
  producto: any;
  variante: any | null;
  cantidad: number;
  idSucursal: number;     // 👇 RECUPERADO
  nombreSucursal: string; // 👇 RECUPERADO
}

@Injectable({
  providedIn: 'root'
})
export class Cart {
  private key = 'margarita_cart_storage';
  private itemsSubject = new BehaviorSubject<CartItem[]>([]);
  public items$ = this.itemsSubject.asObservable();
  public totalItems$: Observable<number>;

  constructor() {
    this.cargarDeLocalStorage();
    this.totalItems$ = this.items$.pipe(
      map(items => items.reduce((acc, i) => acc + i.cantidad, 0))
    );
  }

  addToCart(producto: any, variante: any | null, cantidad: number = 1): boolean {
    const items = this.itemsSubject.value;

    // Leemos la tienda inyectada desde la vista de detalles
    const idSuc = producto._sucursalContexto || 0;
    const nomSuc = producto._nombreSucursalContexto || 'General';

    const uid = variante ? `${producto.idProducto}-${variante.idVariante}-${idSuc}` : `${producto.idProducto}-base-${idSuc}`;

    // Buscamos el stock exacto en la mochila de la tienda
    let stockDisponible = 0;
    if (idSuc === 0) {
      stockDisponible = variante ? (variante.stockActual || 0) : (producto.stockActual || 0);
    } else {
      if (variante && variante.inventarios) {
        const inv = variante.inventarios.find((i: any) => Number(i.idSucursal) === idSuc);
        stockDisponible = inv ? (inv.stockActual || 0) : 0;
      } else {
        stockDisponible = producto.stockActual || 0;
      }
    }

    const existing = items.find(i => i.uid === uid);

    if (existing) {
      if (existing.cantidad + cantidad > stockDisponible) {
        this.mostrarError(stockDisponible, nomSuc);
        return false;
      }
      existing.cantidad += cantidad;
    } else {
      if (cantidad > stockDisponible) {
        this.mostrarError(stockDisponible, nomSuc);
        return false;
      }
      items.push({ uid, producto, variante, cantidad, idSucursal: idSuc, nombreSucursal: nomSuc });
    }

    this.actualizar(items);
    return true;
  }

  private mostrarError(stock: number, tienda: string) {
    Swal.fire({
      icon: 'error',
      title: 'Stock Insuficiente',
      text: `Solo quedan ${stock} unidades en ${tienda}.`,
      toast: true,
      position: 'top-end',
      timer: 3000,
      showConfirmButton: false
    });
  }

  addItem(producto: any, variante: any | null) { this.addToCart(producto, variante, 1); }

  decrementItem(item: CartItem) {
    const items = this.itemsSubject.value;
    const index = items.findIndex(i => i.uid === item.uid);
    if (index > -1) {
      if (items[index].cantidad > 1) items[index].cantidad--;
      else items.splice(index, 1);
      this.actualizar(items);
    }
  }

  removeItem(item: CartItem) {
    const items = this.itemsSubject.value.filter(i => i.uid !== item.uid);
    this.actualizar(items);
  }

  clearCart() { this.actualizar([]); }

  private actualizar(items: CartItem[]) {
    this.itemsSubject.next([...items]);
    localStorage.setItem(this.key, JSON.stringify(items));
  }

  private cargarDeLocalStorage() {
    const saved = localStorage.getItem(this.key);
    if (saved) {
      try { this.itemsSubject.next(JSON.parse(saved)); }
      catch (e) { console.error("Error al cargar carrito", e); }
    }
  }
}
