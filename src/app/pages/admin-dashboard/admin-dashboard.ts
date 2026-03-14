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

  public menuMarcaAbierto: boolean = false;
  public menuCatAbierto: boolean = false;
  public menuColorAbierto: boolean = false;
  public menuTallaAbierto: boolean = false;

  public marcas: string[] = [];
  public categorias: string[] = [];
  public colores: string[] = [];
  public tallas: string[] = [];

  public searchForm: FormGroup;

  constructor(
    private productoService: Producto,
    private fb: FormBuilder,
    private route: ActivatedRoute // <-- INYECTAMOS ACTIVATEDROUTE
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
    const tienda = urlSegments[urlSegments.length - 1];

    // 👇 ACTUALIZADO: AGREGAMOS "almacen2" A LA CONDICIÓN
    if (tienda === 'ropa' || tienda === 'hogar' || tienda === 'almacen' || tienda === 'almacen2') {
      this.productoService.getProductosPorSucursal(tienda).subscribe({
        next: (data: any) => {
          this.productos = data || [];
          this.extraerFiltrosDinamicos();
          this.filtrarProductos();
          this.cargando = false;
        },
        error: () => { this.error = 'Error al cargar productos de la tienda.'; this.cargando = false; }
      });
    } else {
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

  // ... (MANTÉN EL RESTO DE MÉTODOS EXACTAMENTE IGUAL) ...

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
