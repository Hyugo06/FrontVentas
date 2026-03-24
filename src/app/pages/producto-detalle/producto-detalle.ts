import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { Producto, ProductoVariante } from '../../services/producto';
import { CommonModule } from '@angular/common';
import { forkJoin } from 'rxjs';
import { take } from 'rxjs/operators';
import { Cart } from '../../services/cart';
import { FormsModule } from '@angular/forms';
import Swal from 'sweetalert2';
import {environment} from '../../../environments/environment.prod';

@Component({
  selector: 'app-producto-detalle',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule],
  templateUrl: './producto-detalle.html',
  styleUrl: './producto-detalle.css'
})
export class ProductoDetalleComponent implements OnInit {

  public producto: any = null;
  public imagenes: any[] = [];
  public imagenesFiltradas: any[] = [];
  public cargando: boolean = true;

  public idTiendaContexto: number | null = null;

  // Selección
  public colorSeleccionado: string | null = null;
  public tallaSeleccionada: string | null = null;
  public varianteSeleccionada: any = null;

  // Galería
  public imagenActual: string | null = null;

  private nombresSucursales: { [id: number]: string } = {
    1: 'Ropa',
    2: 'Hogar',
    3: 'Almacén',
    4: 'Almacén 2do Piso'
  };


  constructor(
    private route: ActivatedRoute,
    private productoService: Producto,
    private cartService: Cart
  ) {}

  ngOnInit(): void {

    this.route.queryParams.subscribe(params => {
      if (params['tienda']) {
        this.idTiendaContexto = Number(params['tienda']);
      }
    });
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      forkJoin({
        producto: this.productoService.getProductoPublicoPorId(id),
        imagenes: this.productoService.getImagenesPorProducto(id)
      }).subscribe({
        next: (resultado: any) => {
          this.producto = resultado.producto;
          this.imagenes = resultado.imagenes;
          this.cargando = false;

          const colores = this.getColoresUnicos();
          if (colores.length > 0) {
            this.seleccionarColor(colores[0]);
          } else {
            // Si no hay variantes, usamos las imágenes globales
            this.imagenesFiltradas = this.imagenes;
            if (this.producto?.urlImagen) {
              this.imagenActual = this.resolverUrlImagen(this.producto.urlImagen);
            } else if (this.imagenes.length > 0) {
              this.imagenActual = this.resolverUrlImagen(this.imagenes[0].urlImagen);
            }
          }
        },
        error: (err) => {
          console.error(err);
          this.cargando = false;
        }
      });
    }
  }

  getStockPorTienda(): { id: number; nombre: string; stock: number }[] {
    const consolidado = new Map<number, { id: number; nombre: string; stock: number }>();
    if (!this.producto) return [];

    const sumarInventarios = (inventarios: any[]) => {
      if (!inventarios || !Array.isArray(inventarios)) return;
      inventarios.forEach((inv: any) => {
        const sucursalId = Number(inv.idSucursal);

        // REGLA DE ORO: Si venimos de una tienda específica, ignoramos las demás
        if (this.idTiendaContexto && this.idTiendaContexto > 0 && sucursalId !== this.idTiendaContexto) return;

        const nombre = this.nombresSucursales[sucursalId] || `Tienda ${sucursalId}`;
        const stock = inv.stockActual || 0;

        if (stock > 0) {
          if (consolidado.has(sucursalId)) consolidado.get(sucursalId)!.stock += stock;
          else consolidado.set(sucursalId, { id: sucursalId, nombre, stock });
        }
      });
    };

    if (this.varianteSeleccionada) sumarInventarios(this.varianteSeleccionada.inventarios);
    else if (this.colorSeleccionado) {
      const variantesColor = this.producto.variantes.filter((v: any) => v.color === this.colorSeleccionado);
      variantesColor.forEach((v: any) => sumarInventarios(v.inventarios));
    } else if (this.producto.variantes && this.producto.variantes.length > 0) {
      this.producto.variantes.forEach((v: any) => sumarInventarios(v.inventarios));
    } else {
      if ((this.producto.stockActual || 0) > 0 && (!this.idTiendaContexto || this.idTiendaContexto === 0)) {
        consolidado.set(0, { id: 0, nombre: 'General', stock: this.producto.stockActual });
      }
    }
    return Array.from(consolidado.values());
  }

  // 👇 NUEVO: Calcula el stock real sumando la mochila de todas las tiendas
  getStockReal(v: any): number {
    if (!v) return 0;
    if (v.inventarios && Array.isArray(v.inventarios) && v.inventarios.length > 0) {
      return v.inventarios.reduce((acc: number, inv: any) => acc + (inv.stockActual || 0), 0);
    }
    return v.stockActual || 0;
  }

  // 👇 NUEVO: Muestra el stock en la pantalla dependiendo de si eligió talla o no
  getStockDisplay(): number {
    if (this.varianteSeleccionada) {
      return this.getStockReal(this.varianteSeleccionada);
    }
    if (this.producto?.variantes && this.producto.variantes.length > 0) {
      return this.producto.variantes.reduce((acc: number, v: any) => acc + this.getStockReal(v), 0);
    }
    return this.producto?.stockActual || 0;
  }

  // --- NUEVA FUNCIÓN INTELIGENTE (Pública para el HTML) ---
  resolverUrlImagen(url: string | null): string {
    if (!url) return 'assets/img/sin-imagen.png';

    // 1. Si ya es de Cloudinary (empieza con http), la dejamos tal cual
    if (url.startsWith('http')) {
      return url;
    }

    // 2. Si es una imagen antigua (ruta relativa), le pegamos tu dominio de Render
    return environment.apiUrl + url;
  }

  // --- LÓGICA DE FILTRADO Y SELECCIÓN ---

  seleccionarColor(color: string): void {
    if (!this.producto?.variantes) return;

    this.colorSeleccionado = color;
    this.tallaSeleccionada = null;
    this.varianteSeleccionada = null;

    const variantesDeColor = this.producto.variantes.filter((v: any) => v.color === color);
    let fotosDelColor: any[] = [];

    variantesDeColor.forEach((v: any) => {
      // A. Fotos de la galería nueva
      if (v.galeriaImagenes && Array.isArray(v.galeriaImagenes)) {
        v.galeriaImagenes.forEach((url: string) => {
          fotosDelColor.push({ urlImagen: url, idVariante: v.idVariante });
        });
      }
      // B. Foto legacy
      if (v.urlImagen) {
        fotosDelColor.push({ urlImagen: v.urlImagen, idVariante: v.idVariante });
      }
    });

    // Eliminar duplicados
    const fotosUnicas = new Map();
    fotosDelColor.forEach(foto => {
      if (!fotosUnicas.has(foto.urlImagen)) {
        fotosUnicas.set(foto.urlImagen, foto);
      }
    });

    this.imagenesFiltradas = Array.from(fotosUnicas.values());

    if (this.imagenesFiltradas.length === 0 && this.producto?.urlImagen) {
      this.imagenesFiltradas = [{ urlImagen: this.producto.urlImagen, idVariante: null }];
    }

    // Poner la primera foto en el visor
    if (this.imagenesFiltradas.length > 0) {
      this.cambiarImagen(this.imagenesFiltradas[0].urlImagen);
    }
  }

  seleccionarTalla(talla: string): void {
    this.tallaSeleccionada = talla;
    this.actualizarVariante();
  }

  actualizarVariante(): void {
    if (this.colorSeleccionado && this.tallaSeleccionada) {
      this.varianteSeleccionada = this.producto.variantes.find((v: any) =>
        v.color === this.colorSeleccionado && v.talla === this.tallaSeleccionada
      ) || null;
    } else {
      this.varianteSeleccionada = null;
    }
  }

  // --- HELPERS ---
  getColoresUnicos(): string[] {
    if (!this.producto?.variantes) return [];
    const colores = this.producto.variantes.map((v: any) => v.color).filter((c: any) => c);
    return [...new Set(colores)] as string[];
  }

  getTallasPorColor(color: string | null): string[] {
    if (!this.producto?.variantes || !color) return [];
    const tallas = this.producto.variantes
      .filter((v: any) => v.color === color)
      .map((v: any) => v.talla);
    return [...new Set(tallas)] as string[];
  }

  getStockTotalColor(color: string | null): number {
    if (!this.producto?.variantes || !color) return 0;
    return this.producto.variantes
      .filter((v: any) => v.color === color)
      .reduce((acc: number, v: any) => {
        if (v.inventarios && Array.isArray(v.inventarios)) {
          if (this.idTiendaContexto && this.idTiendaContexto > 0) {
            const inv = v.inventarios.find((i: any) => Number(i.idSucursal) === this.idTiendaContexto);
            return acc + (inv ? inv.stockActual || 0 : 0);
          }
          return acc + v.inventarios.reduce((sum: number, inv: any) => sum + (inv.stockActual || 0), 0);
        }
        return acc + (v.stockActual || 0);
      }, 0);
  }

  getStockVarianteSeleccionada(): number {
    if (!this.varianteSeleccionada) return 0;
    if (this.varianteSeleccionada.inventarios && Array.isArray(this.varianteSeleccionada.inventarios)) {
      if (this.idTiendaContexto && this.idTiendaContexto > 0) {
        const inv = this.varianteSeleccionada.inventarios.find((i: any) => Number(i.idSucursal) === this.idTiendaContexto);
        return inv ? inv.stockActual || 0 : 0;
      }
      return this.varianteSeleccionada.inventarios.reduce((acc: number, inv: any) => acc + (inv.stockActual || 0), 0);
    }
    return this.varianteSeleccionada.stockActual || 0;
  }

  isTallaDisponible(talla: string): boolean {
    if (!this.producto || !this.producto.variantes) return false;
    const variantesColor = this.producto.variantes.filter((v: any) => v.color === this.colorSeleccionado && v.talla === talla);

    return variantesColor.some((v: any) => {
      if (v.inventarios && Array.isArray(v.inventarios) && v.inventarios.length > 0) {
        if (this.idTiendaContexto && this.idTiendaContexto > 0) {
          const inv = v.inventarios.find((i: any) => Number(i.idSucursal) === this.idTiendaContexto);
          return (inv ? inv.stockActual || 0 : 0) > 0;
        }
        return v.inventarios.reduce((acc: number, inv: any) => acc + (inv.stockActual || 0), 0) > 0;
      }
      return (v.stockActual || 0) > 0;
    });
  }

  // --- GALERÍA (CORREGIDA) ---

  cambiarImagen(url: string): void {
    // Usamos el resolver directamente
    this.imagenActual = this.resolverUrlImagen(url);
  }

  navegarImagen(direccion: number): void {
    if (!this.imagenActual || this.imagenesFiltradas.length <= 1) return;

    // Buscamos el índice comparando las URLs resueltas (ya procesadas)
    const currentIndex = this.imagenesFiltradas.findIndex(img =>
      this.resolverUrlImagen(img.urlImagen) === this.imagenActual
    );

    if (currentIndex !== -1) {
      const total = this.imagenesFiltradas.length;
      let newIndex = (currentIndex + direccion) % total;
      if (newIndex < 0) newIndex = total - 1;
      // Actualizamos
      this.cambiarImagen(this.imagenesFiltradas[newIndex].urlImagen);
    }
  }

  agregarAlCarrito(): void {
    if (this.producto.variantes?.length > 0 && !this.varianteSeleccionada) {
      Swal.fire({ title: 'Falta la talla', text: 'Por favor selecciona una talla para continuar', icon: 'warning', toast: true, position: 'top-end', showConfirmButton: false, timer: 3000 });
      return;
    }

    let idSuc: number | null = null;
    let nomSuc: string | null = null;

    if (this.idTiendaContexto && this.idTiendaContexto > 0) {
      idSuc = this.idTiendaContexto;
      nomSuc = this.nombresSucursales[idSuc] || 'Tienda';
    } else if (this.producto.variantes?.length > 0) {
      const stockTiendas = this.getStockPorTienda();
      const tiendaConMasStock = stockTiendas.reduce((max, tienda) =>
        (tienda.stock > (max ? max.stock : 0)) ? tienda : max, null as any);

      if (tiendaConMasStock && tiendaConMasStock.stock > 0) {
        idSuc = tiendaConMasStock.id;
        nomSuc = tiendaConMasStock.nombre;
      }
    } else {
      if ((this.producto.stockActual || 0) > 0) {
        idSuc = 0; nomSuc = 'General';
      }
    }

    if (idSuc !== null) {
      this.producto._sucursalContexto = idSuc;
      this.producto._nombreSucursalContexto = nomSuc;
    }

    this.cartService.items$.pipe(take(1)).subscribe(items => {
      const uid = this.varianteSeleccionada
        ? `${this.producto.idProducto}-${this.varianteSeleccionada.idVariante}-${idSuc}`
        : `${this.producto.idProducto}-base-${idSuc}`;

      const itemEnCarrito = items.find(i => i.uid === uid);
      const cantidadEnCarrito = itemEnCarrito ? itemEnCarrito.cantidad : 0;

      const stockMaximoSucursal = this.varianteSeleccionada
        ? (idSuc === 0 ? this.varianteSeleccionada.stockActual : this.varianteSeleccionada.inventarios.find((i:any)=>Number(i.idSucursal)===idSuc)?.stockActual)
        : this.producto.stockActual;

      if (cantidadEnCarrito + 1 > (stockMaximoSucursal || 0)) {
        Swal.fire({ title: '¡Stock Máximo Alcanzado!', text: `Ya tienes las ${stockMaximoSucursal} unidades disponibles de ${nomSuc} en tu carrito.`, icon: 'error', toast: true, position: 'top-end', showConfirmButton: false, timer: 4500, background: '#fff5f5', iconColor: '#ef4444' });
        return;
      }

      this.cartService.addToCart(this.producto, this.varianteSeleccionada, 1);
      Swal.fire({ title: '¡Agregado!', text: `${this.producto.nombre} se agregó al carrito`, icon: 'success', toast: true, position: 'top-end', showConfirmButton: false, timer: 3000, background: '#ffffff', iconColor: '#10b981' });
    });
  }
}
