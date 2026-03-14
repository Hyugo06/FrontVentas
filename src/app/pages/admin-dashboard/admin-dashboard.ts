import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import {ActivatedRoute, RouterLink} from '@angular/router';
import { FormBuilder, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { debounceTime, distinctUntilChanged, switchMap, tap,catchError } from 'rxjs/operators';
import {Producto} from '../../services/producto';
import { of } from 'rxjs';

@Component({
  selector: 'app-admin-dashboard',
  standalone: true,
  imports: [CommonModule, RouterLink, ReactiveFormsModule],
  templateUrl: './admin-dashboard.html',
  styleUrl: './admin-dashboard.css'
})
export class AdminDashboardComponent implements OnInit {

  public productos: any[] = [];
  public productosFiltrados: any[] = []; // Nueva lista para el filtrado local
  public cargando: boolean = true;
  public error: string | null = null;
  public productoAEliminar: any = null;

  // --- NUEVAS VARIABLES DE FILTRADO ---
  public filtroMarca: string = 'TODAS';
  public filtroCategoria: string = 'TODAS';
  public filtroColor: string = 'TODOS';
  public filtroTalla: string = 'TODAS';

  // Control de apertura de menús
  public menuMarcaAbierto: boolean = false;
  public menuCatAbierto: boolean = false;
  public menuColorAbierto: boolean = false;
  public menuTallaAbierto: boolean = false;

  // Opciones (Puedes cambiarlas por las que manejes en tu tienda)
  public marcas: string[] = [];
  public categorias: string[] = [];
  public colores: string[] = [];
  public tallas: string[] = [];

  public searchForm: FormGroup;

  constructor(
    private productoService: Producto,
    private fb: FormBuilder,
    private route: ActivatedRoute) {
    this.searchForm = this.fb.group({ search: [''] });
  }

  public limpiarFiltros(): void {
    this.filtroMarca = 'TODAS';
    this.filtroCategoria = 'TODAS';
    this.filtroColor = 'TODOS';
    this.filtroTalla = 'TODAS';
    this.searchForm.get('search')?.setValue('');

    // Cerramos cualquier menú que haya quedado abierto
    this.toggleMenu('');

    // Aplicamos el filtrado para mostrar todo
    this.filtrarProductos();
  }

  ngOnInit(): void {
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

    // Si la URL es solo 'productos', 'tienda' será 'productos'
    if (tienda === 'ropa' || tienda === 'hogar' || tienda === 'almacen') {
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
      // Carga normal de todos los productos
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
      // Buscador: Nombre, SKU o Marca
      const matchBusqueda =
        p.nombre.toLowerCase().includes(term) ||
        (p.codigoSku || '').toLowerCase().includes(term) ||
        (p.marca?.nombre || '').toLowerCase().includes(term);

      // Filtros dinámicos
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

  // --- FUNCIONES DEL MODAL (YA NO EXISTE eliminarProducto) ---

  // 1. Botón "Eliminar" de la tarjeta llama a esto
  confirmarEliminacion(producto: any): void {
    this.productoAEliminar = producto; // Esto abre el modal en el HTML
  }

  // 2. Botón "Cancelar" del modal
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
          // Seteamos el error
          this.error = 'No se puede eliminar este producto porque tiene ventas o registros asociados.';
          this.productoAEliminar = null;

          // AUTO-LIMPIEZA: El aviso desaparecerá solo tras 3.5 segundos
          setTimeout(() => {
            this.error = null;
          }, 1000);
        }
      });
    }
  }
}
