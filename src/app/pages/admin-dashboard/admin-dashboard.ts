import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { FormBuilder, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { Producto } from '../../services/producto';

@Component({
  selector: 'app-admin-dashboard',
  standalone: true,
  imports: [CommonModule, RouterLink, ReactiveFormsModule],
  templateUrl: './admin-dashboard.html',
  styleUrl: './admin-dashboard.css'
})
export class AdminDashboardComponent implements OnInit {

  public tituloVista: string = 'Inventario General'; // <-- NUEVA VARIABLE

  public productos: any[] = [];
  public productosFiltrados: any[] = [];
  public cargando: boolean = true;
  public error: string | null = null;
  public productoAEliminar: any = null;

  public filtroMarca: string = 'TODAS';
  public filtroCategoria: string = 'TODAS';
  public filtroColor: string = 'TODOS';
  public filtroTalla: string = 'TODAS';
  public filtroUbicacion: any = 'TODAS';

  public menuMarcaAbierto: boolean = false;
  public menuCatAbierto: boolean = false;
  public menuColorAbierto: boolean = false;
  public menuTallaAbierto: boolean = false;

  public marcas: string[] = [];
  public categorias: string[] = [];
  public colores: string[] = [];
  public tallas: string[] = [];

  public searchForm: FormGroup;
  public idSucursalActual: number | null = null;

  constructor(
    private productoService: Producto,
    private fb: FormBuilder,
    private route: ActivatedRoute
  ) {
    this.searchForm = this.fb.group({ search: [''] });
  }

  public limpiarFiltros(): void {
    this.filtroMarca = 'TODAS';
    this.filtroCategoria = 'TODAS';
    this.filtroColor = 'TODOS';
    this.filtroTalla = 'TODAS';
    this.searchForm.get('search')?.setValue('');
    this.toggleMenu('');
    this.filtrarProductos();
  }

  ngOnInit(): void {
    // 👇 NUEVO: LEER EL TÍTULO DESDE LAS RUTAS
    this.route.data.subscribe(data => {
      if (data['titulo']) {
        this.tituloVista = data['titulo'];
      }
    });

    this.route.url.subscribe(() => {
      this.cargarProductos();
    });

    this.searchForm.get('search')!.valueChanges.subscribe(() => {
      this.filtrarProductos();
    });
  }

  cargarProductos(): void {
    this.cargando = true;
    const urlSegments = this.route.snapshot.url.map(s => s.path);
    const tiendaPath = urlSegments[urlSegments.length - 1];

    if (tiendaPath === 'ropa' || tiendaPath === 'hogar' || tiendaPath === 'almacen' || tiendaPath === 'almacen2') {
      let nombreRealBD = '';
      if (tiendaPath === 'ropa') { nombreRealBD = 'Ropa'; this.idSucursalActual = 1; }
      if (tiendaPath === 'hogar') { nombreRealBD = 'Hogar'; this.idSucursalActual = 2; }
      if (tiendaPath === 'almacen') { nombreRealBD = 'Almacén'; this.idSucursalActual = 3; }
      if (tiendaPath === 'almacen2') { nombreRealBD = 'Almacén 2do Piso'; this.idSucursalActual = 4; }

      this.productoService.getProductosPorSucursal(nombreRealBD).subscribe({
        next: (data: any) => {
          this.productos = data || [];
          this.extraerFiltrosDinamicos();
          this.filtrarProductos();
          this.cargando = false;
        },
        error: () => { this.error = 'Error al cargar productos de la tienda.'; this.cargando = false; }
      });
    } else {
      this.idSucursalActual = null;
      this.productoService.getProductosAdmin('').subscribe({
        next: (data: any) => {
          this.productos = data;
          this.extraerFiltrosDinamicos();
          this.filtrarProductos();
          this.cargando = false;
        },
        error: () => { this.error = 'No se pudieron cargar los productos.'; this.cargando = false; }
      });
    }
  }




  obtenerStockVisible(prod: any): number {

    // 1. Si estamos en "Todos los productos", sumamos TODAS las tiendas de TODAS las variantes
    if (this.idSucursalActual === null) {
      if (prod.variantes && Array.isArray(prod.variantes) && prod.variantes.length > 0) {
        let totalGlobal = 0;
        prod.variantes.forEach((v: any) => {
          // Si tiene la mochila de tiendas, sumamos su contenido
          if (v.inventarios && Array.isArray(v.inventarios) && v.inventarios.length > 0) {
            totalGlobal += v.inventarios.reduce((sum: number, inv: any) => sum + (inv.stockActual || 0), 0);
          } else {
            // Por si acaso es un producto viejo sin tiendas aún
            totalGlobal += (v.stockActual || 0);
          }
        });
        return totalGlobal;
      }
      // Si no tiene variantes, devolvemos su stock base
      return prod.stockActual || 0;
    }

    // 2. Si estamos en una tienda específica, sumamos SOLO lo de esa tienda
    let stockTienda = 0;
    if (prod.variantes && Array.isArray(prod.variantes)) {
      prod.variantes.forEach((v: any) => {
        if (v.inventarios && Array.isArray(v.inventarios)) {
          const invTienda = v.inventarios.find((i: any) => i.idSucursal === this.idSucursalActual);
          if (invTienda && invTienda.stockActual) {
            stockTienda += invTienda.stockActual;
          }
        }
      });
    }
    return stockTienda;
  }



  private extraerFiltrosDinamicos(): void {
    // Marcas únicas
    this.marcas = [...new Set(this.productos
      .map(p => p.marca?.nombre)
      .filter(m => m)
    )].sort() as string[];

    // Categorías únicas
    this.categorias = [...new Set(this.productos
      .map(p => p.categoria?.nombre)
      .filter(c => c)
    )].sort() as string[];

    // Colores (desde características)
    this.colores = [...new Set(this.productos
      .map(p => p.caracteristicas?.color)
      .filter(col => col)
    )].sort() as string[];

    // Tallas (desde características)
    this.tallas = [...new Set(this.productos
      .map(p => p.caracteristicas?.talla)
      .filter(t => t)
    )].sort() as string[];
  }

  filtrarProductos(): void {
    const term = this.searchForm.get('search')?.value?.toLowerCase() || '';

    this.productosFiltrados = this.productos.filter(p => {
      const matchBusqueda =
        p.nombre.toLowerCase().includes(term) ||
        (p.codigoSku || '').toLowerCase().includes(term) ||
        (p.marca?.nombre || '').toLowerCase().includes(term);

      const matchMarca = this.filtroMarca === 'TODAS' || p.marca?.nombre === this.filtroMarca;
      const matchCat = this.filtroCategoria === 'TODAS' || p.categoria?.nombre === this.filtroCategoria;
      const matchColor = this.filtroColor === 'TODOS' || p.caracteristicas?.color === this.filtroColor;
      const matchTalla = this.filtroTalla === 'TODAS' || p.caracteristicas?.talla === this.filtroTalla;

      return matchBusqueda && matchMarca && matchCat && matchColor && matchTalla;
    });
  }

  toggleMenu(menu: string) {
    this.menuMarcaAbierto = menu === 'marca' ? !this.menuMarcaAbierto : false;
    this.menuCatAbierto = menu === 'cat' ? !this.menuCatAbierto : false;
    this.menuColorAbierto = menu === 'color' ? !this.menuColorAbierto : false;
    this.menuTallaAbierto = menu === 'talla' ? !this.menuTallaAbierto : false;
  }

  limpiarBusqueda(): void {
    this.searchForm.get('search')?.setValue('');
  }

  confirmarEliminacion(producto: any): void {
    this.productoAEliminar = producto;
  }

  cancelarEliminacion(): void {
    this.productoAEliminar = null;
  }

// 👇 NUEVO: Etiqueta Camaleónica conectada a la Ruta del Menú Lateral 👇
  obtenerNombreUbicacion(prod: any): string {
    // 1. EL TRUCO CORREGIDO: Leemos la variable 'idSucursalActual' que define la ruta de la página
    if (this.idSucursalActual !== null) {
      const idBuscado = Number(this.idSucursalActual);
      if (idBuscado === 1) return 'Ropa';
      if (idBuscado === 2) return 'Hogar';
      if (idBuscado === 3) return 'Almacén';
      if (idBuscado === 4) return 'Almacén 2do Piso';
    }

    // 2. Si estamos en "Inventario General" (idSucursalActual es null), leemos TODAS las mochilas
    if (prod.variantes && Array.isArray(prod.variantes) && prod.variantes.length > 0) {
      const sucursalesUnicas = new Set<number>();

      prod.variantes.forEach((v: any) => {
        if (v.inventarios && Array.isArray(v.inventarios)) {
          v.inventarios.forEach((inv: any) => {
            if ((inv.stockActual || 0) > 0) {
              sucursalesUnicas.add(Number(inv.idSucursal));
            }
          });
        }
      });

      // Si encontramos tiendas, las listamos (Ej: "Ropa, Almacén")
      if (sucursalesUnicas.size > 0) {
        const nombres = Array.from(sucursalesUnicas).map(id => {
          if (id === 1) return 'Ropa';
          if (id === 2) return 'Hogar';
          if (id === 3) return 'Almacén';
          if (id === 4) return 'Almacén 2do Piso';
          return 'Tienda ' + id;
        });
        return nombres.join(', ');
      }
    }

    // 3. Fallback: Para productos antiguos sin variantes o sin stock
    if (prod.sucursal && prod.sucursal.nombre) {
      return prod.sucursal.nombre;
    }
    const id = prod.idSucursal || (prod.sucursal && prod.sucursal.idSucursal) || prod._sucursalContexto;

    if (!id || id === 0) return 'Sin Asignar';
    switch (Number(id)) {
      case 1: return 'Ropa';
      case 2: return 'Hogar';
      case 3: return 'Almacén';
      case 4: return 'Almacén 2do Piso';
      default: return 'Desconocida';
    }
  }

  eliminarDefinitivamente(): void {
    if (this.productoAEliminar) {
      this.productoService.deleteProducto(this.productoAEliminar.idProducto).subscribe({
        next: () => {
          this.cargarProductos();
          this.productoAEliminar = null;
        },
        error: (err: any) => {
          console.error(err);
          this.error = 'No se puede eliminar este producto porque tiene ventas o registros asociados.';
          this.productoAEliminar = null;

          setTimeout(() => {
            this.error = null;
          }, 1000);
        }
      });
    }
  }
}
