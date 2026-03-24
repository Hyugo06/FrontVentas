import {Component, HostListener, OnInit} from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, Router } from '@angular/router';
import {FormBuilder, FormGroup, FormsModule, ReactiveFormsModule} from '@angular/forms';
import { debounceTime, distinctUntilChanged, switchMap, tap, take } from 'rxjs/operators';
import Swal from 'sweetalert2';

import { Producto } from '../../services/producto';
import { Categoria, CategoriaDTO } from '../../services/categoria';
import { Cart } from '../../services/cart';
import { Auth } from '../../services/auth';
import {UiService} from '../../services/ui.service';
import {environment} from '../../../environments/environment.prod';

interface CategoriaTree extends CategoriaDTO {
  children?: CategoriaTree[];
  isOpen?: boolean;
}

@Component({
  selector: 'app-producto-lista',
  standalone: true,
  imports: [CommonModule, RouterLink, ReactiveFormsModule, FormsModule],
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

  // 👇 Ahora nuestros diccionarios usarán el ID ÚNICO de la tarjeta clonada
  public mapaImagenes: { [idUnico: string]: string[] } = {};
  public indiceImagen: { [idUnico: string]: number } = {};
  public colorSeleccionado: { [idUnico: string]: string } = {};
  public seleccion: { [idUnico: string]: any } = {};

  public categoriaHover: CategoriaTree | null = null;
  public menuMarcaAbierto: boolean = false;
  public menuColorAbierto: boolean = false;
  public menuTallaAbierto: boolean = false;
  public productosFiltrados: any[] = [];
  public filtroMarca: string = 'TODAS';
  public filtroColor: string = 'TODOS';
  public filtroTalla: string = 'TODAS';
  public marcas: string[] = [];
  public coloresList: string[] = [];
  public tallasList: string[] = [];
  public filtroUbicacion: any = 'TODAS';

  public ubicaciones = [
    { id: 1, nombre: 'Ropa', icono: '👕' },
    { id: 2, nombre: 'Hogar', icono: '🛋️' },
    { id: 3, nombre: 'Almacén', icono: '🏢' },
    { id: 4, nombre: 'Almacén 2do Piso', icono: '📦' }
  ];

  constructor(
    private productoService: Producto,
    public cartService: Cart,
    private fb: FormBuilder,
    private categoriaService: Categoria,
    private authService: Auth,
    private router: Router,
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
        this.productos = data;
        this.extraerFiltrosDinamicos();
        this.filtrarProductos(); // Aquí es donde ocurre la clonación
        this.cargandoProductos = false;
      },
      error: () => this.cargandoProductos = false
    });
    this.filtroForm.updateValueAndValidity({ emitEvent: true });
  }

  public extraerFiltrosDinamicos(): void {
    this.marcas = [...new Set(this.productos.map(p => p.marca?.nombre).filter(m => m))].sort() as string[];
    this.coloresList = [...new Set(this.productos.map(p => p.caracteristicas?.color).filter(c => c))].sort() as string[];
    this.tallasList = [...new Set(this.productos.map(p => p.caracteristicas?.talla).filter(t => t))].sort() as string[];
  }

  public filtrarProductos(): void {
    const term = this.filtroForm.get('search')?.value?.toLowerCase() || '';

    // 1. Primero filtramos la base (Marca, Color, Talla, Texto)
    let productosBase = this.productos.filter(p => {
      const matchBusqueda = p.nombre.toLowerCase().includes(term) || (p.codigoSku || '').toLowerCase().includes(term);
      const matchMarca = this.filtroMarca === 'TODAS' || p.marca?.nombre === this.filtroMarca;
      const matchColor = this.filtroColor === 'TODOS' || p.caracteristicas?.color === this.filtroColor;
      const matchTalla = this.filtroTalla === 'TODAS' || p.caracteristicas?.talla === this.filtroTalla;
      return matchBusqueda && matchMarca && matchColor && matchTalla;
    });

    // 2. MAGIA: Aplanar y clonar los productos por cada sucursal donde existan
    let productosExpandidos: any[] = [];

    productosBase.forEach(p => {
      let sucursalesConStock = new Set<number>();
      let esProductoViejo = true;

      // Averiguamos en qué sucursales tiene stock real
      if (p.variantes && Array.isArray(p.variantes)) {
        p.variantes.forEach((v: any) => {
          if (v.inventarios && Array.isArray(v.inventarios) && v.inventarios.length > 0) {
            esProductoViejo = false;
            v.inventarios.forEach((inv: any) => {
              if (inv.stockActual > 0) {
                sucursalesConStock.add(Number(inv.idSucursal));
              }
            });
          }
        });
      }

      // Si es un producto antiguo sin tiendas, lo mostramos normalmente
      if (esProductoViejo) {
        if (this.filtroUbicacion === 'TODAS') {
          productosExpandidos.push({ ...p, _idUnico: p.idProducto.toString(), _sucursalContexto: 0, _nombreSucursalContexto: 'General' });
        }
        return; // Saltamos a la siguiente iteración
      }

      // Si el filtro es "TODAS", creamos una tarjeta clonada por cada tienda
      if (this.filtroUbicacion === 'TODAS') {
        sucursalesConStock.forEach(idSuc => {
          productosExpandidos.push({
            ...p,
            _idUnico: `${p.idProducto}-${idSuc}`, // Ej: "15-1" (Producto 15 en tienda Ropa)
            _sucursalContexto: idSuc,
            _nombreSucursalContexto: this.ubicaciones.find(u => u.id === idSuc)?.nombre || 'Tienda'
          });
        });
      } else {
        // Si el usuario eligió "Ropa", solo creamos la tarjeta de "Ropa" si tiene stock
        const idBuscado = Number(this.filtroUbicacion);
        if (sucursalesConStock.has(idBuscado)) {
          productosExpandidos.push({
            ...p,
            _idUnico: `${p.idProducto}-${idBuscado}`,
            _sucursalContexto: idBuscado,
            _nombreSucursalContexto: this.ubicaciones.find(u => u.id === idBuscado)?.nombre || 'Tienda'
          });
        }
      }
    });

    this.productosFiltrados = productosExpandidos;
    this.inicializarCarruseles(this.productosFiltrados); // Inicializamos el visualizador para cada clon
  }

  // 👇 Ahora estas funciones exigen saber en QUÉ TIENDA estamos preguntando el stock
  getStockVarianteVisible(v: any, idSucursalContexto: number): number {
    if (!v.inventarios || !Array.isArray(v.inventarios)) return v.stockActual || 0; // Para productos viejos
    const inv = v.inventarios.find((i: any) => Number(i.idSucursal) === idSucursalContexto);
    return inv ? (inv.stockActual || 0) : 0;
  }

  getStockTotalColorVisible(prod: any, color: string): number {
    const variantesColor = this.getTallasPorColor(prod, color);
    return variantesColor.reduce((acc, v) => acc + this.getStockVarianteVisible(v, prod._sucursalContexto), 0);
  }

  getStockTotalProducto(prod: any): number {
    if (prod.variantes?.length > 0) {
      return prod.variantes.reduce((sum: number, v: any) => sum + this.getStockVarianteVisible(v, prod._sucursalContexto), 0);
    }
    return prod.stockActual || 0;
  }

  public limpiarTodo(): void {
    this.filtroMarca = 'TODAS';
    this.filtroColor = 'TODOS';
    this.filtroTalla = 'TODAS';
    this.filtroUbicacion = 'TODAS';
    this.filtroForm.reset({ search: '', categoria: '' });
    this.filtrarProductos();
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
      allowOutsideClick: true,
      allowEscapeKey: true
    }).then((result) => {
      if (result.isConfirmed) {
        this.authService.logout();
        this.router.navigate(['/login']);
      }
    });
  }

  resolverUrlImagen(url: string | null): string {
    if (!url) return 'assets/img/sin-imagen.png';
    if (url.startsWith('http')) return url;
    return environment.apiUrl + url;
  }

  // 👇 Ahora usa prod._idUnico para no mezclar las fotos de Ropa con las de Almacén
  inicializarCarruseles(productosExpandidos: any[]): void {
    productosExpandidos.forEach(prod => {
      const uid = prod._idUnico;
      this.indiceImagen[uid] = 0;
      const colores = this.getColoresUnicos(prod);
      if (colores.length > 0) {
        const primerColor = colores[0];
        this.colorSeleccionado[uid] = primerColor;
        this.construirGaleria(prod, primerColor);
      } else {
        this.colorSeleccionado[uid] = '';
        this.construirGaleria(prod, null);
      }
    });
  }

  getImagenActual(prod: any): string | null {
    const uid = prod._idUnico;
    const imagenes = this.mapaImagenes[uid];
    const indice = this.indiceImagen[uid];
    if (imagenes && imagenes.length > 0 && typeof indice === 'number') {
      return imagenes[indice] || null;
    }
    return null;
  }

  construirGaleria(prod: any, colorFiltro: string | null): void {
    const uid = prod._idUnico;
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
    this.mapaImagenes[uid] = [...new Set(urls)];
    this.indiceImagen[uid] = 0;
  }

  cambiarImagen(prod: any, direccion: number): void {
    const uid = prod._idUnico;
    const total = this.mapaImagenes[uid]?.length || 0;
    if (total <= 1) return;
    let nuevoIndice = this.indiceImagen[uid] + direccion;
    if (nuevoIndice < 0) nuevoIndice = total - 1;
    if (nuevoIndice >= total) nuevoIndice = 0;
    this.indiceImagen[uid] = nuevoIndice;
  }

  seleccionarColor(prod: any, color: string): void {
    const uid = prod._idUnico;
    if (this.colorSeleccionado[uid] === color) return;
    this.colorSeleccionado[uid] = color;
    this.seleccion[uid] = null;
    this.construirGaleria(prod, color);
  }

  seleccionarTalla(prod: any, variante: any): void {
    this.seleccion[prod._idUnico] = variante;
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
      // Usamos el UID de la tarjeta para que el carrito sepa de qué tienda es
      const cartUid = varianteSeleccionada ? `${producto._idUnico}-${varianteSeleccionada.idVariante}` : `${producto._idUnico}-base`;
      const itemEnCarrito = items.find(i => i.uid === cartUid);
      const cantidadEnCarrito = itemEnCarrito ? itemEnCarrito.cantidad : 0;

      const stockMaximo = varianteSeleccionada ? this.getStockVarianteVisible(varianteSeleccionada, producto._sucursalContexto) : this.getStockTotalProducto(producto);

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

  cargarCategorias(): void {
    this.categoriaService.getCategorias().subscribe({
      next: (data) => {
        this.categorias = data;
        const abuelos = data.filter(c => !c.idCategoriaPadre) as CategoriaTree[];
        abuelos.forEach(abuelo => {
          const padres = data.filter(c => c.idCategoriaPadre === abuelo.idCategoria) as CategoriaTree[];
          padres.forEach(padre => {
            padre.children = data.filter(c => c.idCategoriaPadre === padre.idCategoria) as CategoriaTree[];
            padre.isOpen = false;
          });
          abuelo.children = padres;
          abuelo.isOpen = false;
        });
        this.categoriasTree = abuelos;
      },
      error: (err) => console.error(err)
    });
  }

  toggleMenu(menu: string) {
    this.menuMarcaAbierto = menu === 'marca' ? !this.menuMarcaAbierto : false;
    this.menuColorAbierto = menu === 'color' ? !this.menuColorAbierto : false;
    this.menuTallaAbierto = menu === 'talla' ? !this.menuTallaAbierto : false;
  }

  seleccionarFiltro(tipo: string, valor: any) {
    if (tipo === 'marca') this.filtroMarca = valor;
    if (tipo === 'color') this.filtroColor = valor;
    if (tipo === 'talla') this.filtroTalla = valor;
    if (tipo === 'ubicacion') this.filtroUbicacion = valor;

    this.toggleMenu('');
    this.filtrarProductos();
  }

  toggleMobileMenu(): void {
    if (this.showMobileMenu) this.uiService.closeMenu();
    else this.uiService.toggleMenu();
  }

  limpiarFiltrosRapidos() {
    this.filtroMarca = 'TODAS';
    this.filtroColor = 'TODOS';
    this.filtroTalla = 'TODAS';
    this.filtroUbicacion = 'TODAS';
    this.filtrarProductos();
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
