import {Component, HostListener, OnInit} from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, Router } from '@angular/router'; // <--- Importar Router
import { FormBuilder, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { debounceTime, distinctUntilChanged, switchMap, tap, take } from 'rxjs/operators';
import Swal from 'sweetalert2';

import { Producto } from '../../services/producto';
import { Categoria, CategoriaDTO } from '../../services/categoria';
import { Cart } from '../../services/cart';
import { Auth } from '../../services/auth';
import {UiService} from '../../services/ui.service'; // <--- Importar Auth

interface CategoriaTree extends CategoriaDTO {
  children?: CategoriaDTO[];
  isOpen?: boolean;
}

@Component({
  selector: 'app-producto-lista',
  standalone: true,
  imports: [CommonModule, RouterLink, ReactiveFormsModule],
  templateUrl: './producto-lista.html',
  styleUrl: './producto-lista.css'
})
export class ProductoListaComponent implements OnInit {

  public productos: any[] = [];
  public categorias: CategoriaDTO[] = [];
  public categoriasTree: CategoriaTree[] = [];
  public cargandoProductos: boolean = true;
  public filtroForm: FormGroup;
  public showMobileMenu: boolean = false;

  public isHidden: boolean = false;
  private lastScrollTop: number = 0;

  public mapaImagenes: { [id: number]: string[] } = {};
  public indiceImagen: { [id: number]: number } = {};
  public colorSeleccionado: { [id: number]: string } = {};
  public seleccion: { [id: number]: any } = {};
  public categoriaHover: CategoriaTree | null = null;

  constructor(
    private productoService: Producto,
    public cartService: Cart, // <--- CAMBIO: Debe ser PUBLIC para usarse en el HTML
    private fb: FormBuilder,
    private categoriaService: Categoria,
    private authService: Auth, // <--- INYECCIÓN: Auth
    private router: Router,// <--- INYECCIÓN: Router
    private uiService: UiService
  ) {
    this.filtroForm = this.fb.group({
      search: [''],
      categoria: ['']
    });
  }

  ngOnInit(): void {
    this.uiService.menuOpen$.subscribe(estado => {
      this.showMobileMenu = estado;
    });
    this.cargarCategorias();
    this.filtroForm.valueChanges.pipe(
      debounceTime(400),
      distinctUntilChanged(),
      tap(() => this.cargandoProductos = true),
      switchMap(val => this.productoService.getProductosPublicos(val.search, val.categoria))
    ).subscribe({
      next: (data) => {
        this.inicializarCarruseles(data);
        this.productos = data;
        this.cargandoProductos = false;
      },
      error: () => this.cargandoProductos = false
    });
    this.filtroForm.updateValueAndValidity({ emitEvent: true });
  }

  @HostListener('window:scroll', [])
  onWindowScroll() {
    const currentScroll = window.pageYOffset || document.documentElement.scrollTop;
    if (currentScroll > this.lastScrollTop && currentScroll > 80) {
      this.isHidden = true;
    } else {
      this.isHidden = false;
    }
    this.lastScrollTop = currentScroll <= 0 ? 0 : currentScroll;
  }


  // --- NUEVA FUNCIÓN LOGOUT ---
  logout(): void {
    this.showMobileMenu = false;

    Swal.fire({
      title: '¿Cerrar sesión?',
      text: "¿Estás seguro que deseas salir?",
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: '#3085d6',
      cancelButtonColor: '#d33',
      confirmButtonText: 'Sí, salir',
      cancelButtonText: 'Cancelar',
      // --- ESTA ES LA LÍNEA CLAVE ---
      allowOutsideClick: true,
      allowEscapeKey: true // También permite cerrar con la tecla 'Esc'
    }).then((result) => {
      if (result.isConfirmed) {
        this.authService.logout();
        this.router.navigate(['/login']);
      }
    });
  }

  // ... (EL RESTO DEL CÓDIGO PERMANECE EXACTAMENTE IGUAL) ...
  // resolverUrlImagen, inicializarCarruseles, getImagenActual, etc.

  resolverUrlImagen(url: string | null): string {
    if (!url) return 'assets/img/sin-imagen.png';
    if (url.startsWith('http')) return url;
    return 'https://apiventas-1.onrender.com' + url;
  }

  inicializarCarruseles(productos: any[]): void {
    productos.forEach(prod => {
      this.indiceImagen[prod.idProducto] = 0;
      const colores = this.getColoresUnicos(prod);
      if (colores.length > 0) {
        const primerColor = colores[0];
        this.colorSeleccionado[prod.idProducto] = primerColor;
        this.construirGaleria(prod, primerColor);
      } else {
        this.colorSeleccionado[prod.idProducto] = '';
        this.construirGaleria(prod, null);
      }
    });
  }

  getImagenActual(prod: any): string | null {
    const id = prod.idProducto;
    const imagenes = this.mapaImagenes[id];
    const indice = this.indiceImagen[id];
    if (imagenes && imagenes.length > 0 && typeof indice === 'number') {
      return imagenes[indice] || null;
    }
    return null;
  }

  construirGaleria(prod: any, colorFiltro: string | null): void {
    let urls: string[] = [];
    if (!colorFiltro) {
      if (prod.urlImagen) urls.push(this.resolverUrlImagen(prod.urlImagen));
      if (prod.imagenes) prod.imagenes.forEach((img: any) => urls.push(this.resolverUrlImagen(img.urlImagen)));
      if (prod.variantes) {
        prod.variantes.forEach((v: any) => {
          if (v.urlImagen) urls.push(this.resolverUrlImagen(v.urlImagen));
          if (v.galeriaImagenes) v.galeriaImagenes.forEach((u: string) => urls.push(this.resolverUrlImagen(u)));
        });
      }
    } else {
      const variantesColor = prod.variantes.filter((v: any) => v.color === colorFiltro);
      variantesColor.forEach((v: any) => {
        if (v.galeriaImagenes) v.galeriaImagenes.forEach((u: string) => urls.push(this.resolverUrlImagen(u)));
        if (v.urlImagen) urls.push(this.resolverUrlImagen(v.urlImagen));
      });
      if (urls.length === 0 && prod.urlImagen) urls.push(this.resolverUrlImagen(prod.urlImagen));
    }
    this.mapaImagenes[prod.idProducto] = [...new Set(urls)];
    this.indiceImagen[prod.idProducto] = 0;
  }

  cambiarImagen(prod: any, direccion: number): void {
    const id = prod.idProducto;
    const total = this.mapaImagenes[id]?.length || 0;
    if (total <= 1) return;
    let nuevoIndice = this.indiceImagen[id] + direccion;
    if (nuevoIndice < 0) nuevoIndice = total - 1;
    if (nuevoIndice >= total) nuevoIndice = 0;
    this.indiceImagen[id] = nuevoIndice;
  }

  seleccionarColor(prod: any, color: string): void {
    const id = prod.idProducto;
    if (this.colorSeleccionado[id] === color) return;
    this.colorSeleccionado[id] = color;
    this.seleccion[id] = null;
    this.construirGaleria(prod, color);
  }

  seleccionarTalla(prod: any, variante: any): void {
    this.seleccion[prod.idProducto] = variante;
  }

  agregarAlCarrito(event: Event, producto: any, varianteSeleccionada: any): void {
    event.stopPropagation();
    if (producto.variantes?.length > 0 && !varianteSeleccionada) {
      Swal.fire({
        title: 'Falta la talla',
        text: 'Por favor selecciona una talla para continuar',
        icon: 'warning',
        toast: true,
        position: 'top-end',
        showConfirmButton: false,
        timer: 3000
      });
      return;
    }
    this.cartService.items$.pipe(take(1)).subscribe(items => {
      const uid = varianteSeleccionada ? `${producto.idProducto}-${varianteSeleccionada.idVariante}` : `${producto.idProducto}-base`;
      const itemEnCarrito = items.find(i => i.uid === uid);
      const cantidadEnCarrito = itemEnCarrito ? itemEnCarrito.cantidad : 0;
      const stockMaximo = varianteSeleccionada ? varianteSeleccionada.stockActual : producto.stockActual;

      if (cantidadEnCarrito + 1 > stockMaximo) {
        Swal.fire({ title: '¡Stock Máximo Alcanzado!', text: `Ya tienes las ${stockMaximo} unidades disponibles en tu carrito.`, icon: 'error', toast: true, position: 'top-end', showConfirmButton: false, showCloseButton: true, timer: 4000, background: '#fff5f5', iconColor: '#ef4444' });
        return;
      }
      this.cartService.addToCart(producto, varianteSeleccionada, 1);
      Swal.fire({ title: '¡Agregado!', text: `${producto.nombre} se agregó al carrito`, icon: 'success', toast: true, position: 'top-end', showConfirmButton: false, showCloseButton: true, timer: 3000, background: '#ffffff', iconColor: '#10b981' });
    });
  }

  getColoresUnicos(prod: any): string[] {
    if (!prod.variantes) return [];
    return [...new Set(prod.variantes.map((v: any) => v.color).filter((c: any) => c))] as string[];
  }

  getTallasPorColor(prod: any, color: string): any[] {
    if (!prod.variantes) return [];
    return prod.variantes.filter((v: any) => v.color === color);
  }

  getStockTotalColor(prod: any, color: string): number {
    return this.getTallasPorColor(prod, color).reduce((acc, v) => acc + v.stockActual, 0);
  }

  getStockTotalProducto(prod: any): number {
    if (prod.variantes?.length > 0) {
      return prod.variantes.reduce((sum: number, v: any) => sum + v.stockActual, 0);
    }
    return prod.stockActual || 0;
  }

  cargarCategorias(): void {
    this.categoriaService.getCategorias().subscribe({
      next: (data) => {
        this.categorias = data;
        const padres = data.filter(c => !c.idCategoriaPadre) as CategoriaTree[];
        padres.forEach(padre => {
          padre.children = data.filter(c => c.idCategoriaPadre === padre.idCategoria);
          padre.isOpen = false;
        });
        this.categoriasTree = padres;
      },
      error: (err) => console.error(err)
    });
  }
  toggleMobileMenu(): void {
    if (this.showMobileMenu) this.uiService.closeMenu();
    else this.uiService.toggleMenu();
  }
  toggleCategoria(cat: CategoriaTree): void { cat.isOpen = !cat.isOpen; }
  filtrarPorCategoria(id: any): void { this.filtroForm.patchValue({ categoria: id }); this.showMobileMenu = false; }
  setCategoriaFiltro(nombre: string): void { this.filtroForm.patchValue({ categoria: nombre }); }
  verTodo(): void { this.filtroForm.patchValue({ categoria: '', search: '' }); this.showMobileMenu = false; }
  limpiarFiltros(): void { this.filtroForm.reset({ search: '', categoria: '' }); }

  onMouseEnter(cat: CategoriaTree): void { this.categoriaHover = cat; }
  onMouseLeave(): void { this.categoriaHover = null; }
  seleccionarCategoriaYcerrar(nombre: string): void { this.setCategoriaFiltro(nombre); this.categoriaHover = null; this.showMobileMenu = false; }
}
