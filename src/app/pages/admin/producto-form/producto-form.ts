import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule, FormArray, AbstractControl } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { Producto } from '../../../services/producto';
import { Marca, MarcaDTO } from '../../../services/marca';
import { Categoria, CategoriaDTO } from '../../../services/categoria';
import { Router, ActivatedRoute, RouterLink } from '@angular/router';
import { forkJoin } from 'rxjs';
import { HttpErrorResponse } from '@angular/common/http';
import { Media } from '../../../services/media';
import {environment} from '../../../../environments/environment.prod';

interface CategoriaView extends CategoriaDTO {
  nivel: number;
  rutaCompleta: string;
}

@Component({
  selector: 'app-producto-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './producto-form.html',
  styleUrl: './producto-form.css'
})
export class ProductoFormComponent implements OnInit {

  public productoForm: FormGroup;
  public esEdicion: boolean = false;
  public productoId: number | null = null;
  public listaMarcas: MarcaDTO[] = [];
  public listaCategorias: CategoriaView[] = [];
  public cargando: boolean = true;
  public error: string | null = null;

  public dropdownCatOpen: boolean = false;
  public dropdownMarcaOpen: boolean = false;
  public dropdownTiendaOpen: boolean = false;
  public filtroCategoria: string = '';

  public previewUrl: string | null = null;
  public uploading: boolean = false;
  public imagenesProducto: any[] = [];

  private caracteristicasTemplates: { [key: number]: string[] } = {};

  constructor(
    private fb: FormBuilder,
    private productoService: Producto,
    private marcaService: Marca,
    private categoriaService: Categoria,
    private router: Router,
    private route: ActivatedRoute,
    private mediaService: Media
  ) {
    this.productoForm = this.fb.group({
      idProducto: [null],
      codigoSku: [''],
      nombre: ['', Validators.required],
      descripcion: [''],
      tieneOferta: [false],
      precioRegular: [{ value: null, disabled: true }, [Validators.required, Validators.min(0)]],
      precioVenta: [0, [Validators.required, Validators.min(0)]],
      precioCompra: [0, [Validators.required, Validators.min(0)]],
      // 👇 El stock ahora se calcula solo y quitamos el idSucursal viejo
      stockActual: [{ value: 0, disabled: true }],
      idMarca: [null, Validators.required],
      idCategoria: [null, Validators.required],
      urlImagen: [''],
      caracteristicas: this.fb.group({}),
      gruposVariantes: this.fb.array([])
    });
  }

  get gruposVariantes(): FormArray {
    return this.productoForm.get('gruposVariantes') as FormArray;
  }

  get categoriasFiltradas() {
    if (!this.filtroCategoria) return this.listaCategorias;
    const busqueda = this.filtroCategoria.toLowerCase();

    const idsVisibles = new Set<number>();

    this.listaCategorias.forEach(cat => {
      if (cat.nombre.toLowerCase().includes(busqueda) || cat.rutaCompleta?.toLowerCase().includes(busqueda)) {
        idsVisibles.add(cat.idCategoria);
        let idPadre = cat.idCategoriaPadre;
        while (idPadre) {
          const padre = this.listaCategorias.find(p => p.idCategoria === idPadre);
          if (padre) {
            idsVisibles.add(padre.idCategoria);
            idPadre = padre.idCategoriaPadre;
          } else idPadre = null;
        }
      }
    });

    return this.listaCategorias.filter(c => idsVisibles.has(c.idCategoria));
  }

  get nombreCategoriaSeleccionada(): string {
    const id = this.productoForm.get('idCategoria')?.value;
    if (!id) return 'Seleccionar';
    const cat = this.listaCategorias.find(c => c.idCategoria === id);
    if (!cat) return 'Seleccionar';
    return `✨ ${cat.nombre}`;
  }

  seleccionarCategoria(cat: CategoriaView): void {
    if (cat.nivel !== 3) return;
    this.productoForm.patchValue({ idCategoria: cat.idCategoria });
    this.dropdownCatOpen = false;
    this.filtroCategoria = '';
  }

  ngOnInit(): void {
    this.cargarDropdowns();
    this.productoForm.get('idCategoria')?.valueChanges.subscribe(id => {
      if (id) this.actualizarCamposCaracteristicas(id);
    });
    this.productoForm.get('tieneOferta')?.valueChanges.subscribe(checked => {
      const regularControl = this.productoForm.get('precioRegular');
      if (checked) {
        regularControl?.enable();
      } else {
        regularControl?.disable();
      }
    });
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.esEdicion = true;
      this.productoId = +id;
      this.cargarDatosProducto(this.productoId);
      this.cargarImagenesGlobales(this.productoId);
    } else {
      this.cargando = false;
      this.agregarGrupoVariante();
    }
  }

  // ==========================================
  // 🎨 GESTIÓN DE GRUPOS CON GALERÍA
  // ==========================================

  crearGrupoGroup(color: string = '', imagenesUrls: string[] = []): FormGroup {
    return this.fb.group({
      _uid: [new Date().getTime() + Math.random()], // 👈 ID Único para el @for de colores
      color: [color, Validators.required],
      imagenes: this.fb.array(imagenesUrls.map(url => this.fb.control(url))),
      tallas: this.fb.array([])
    });
  }

  public resolverUrlImagen(url: string | null): string {
    if (!url) return 'assets/img/sin-imagen.png';
    if (url.startsWith('http')) return url;
    return environment.apiUrl + url;
  }

  crearTallaGroup(talla: string = '', stock: number = 0, idVariante: number | null = null, inventariosData: any[] = []): FormGroup {
    const inventariosBase = [
      { idSucursal: 1, nombre: 'Ropa', stockActual: 0, habilitado: false },
      { idSucursal: 2, nombre: 'Hogar', stockActual: 0, habilitado: false },
      { idSucursal: 3, nombre: 'Almacén', stockActual: 0, habilitado: false },
      { idSucursal: 4, nombre: 'Almacén 2do Piso', stockActual: 0, habilitado: false }
    ];

    if (inventariosData && inventariosData.length > 0) {
      inventariosBase.forEach(inv => {
        const dataBackend = inventariosData.find(i => i.idSucursal === inv.idSucursal);
        if (dataBackend) {
          inv.stockActual = dataBackend.stockActual;
          inv.habilitado = true;
        }
      });
    }

    return this.fb.group({
      _uid: [new Date().getTime() + Math.random()],
      idVariante: [idVariante],
      talla: [talla, Validators.required],
      inventarios: this.fb.array(
        inventariosBase.map(inv => this.fb.group({
          idSucursal: [inv.idSucursal],
          nombre: [inv.nombre],
          habilitado: [inv.habilitado],
          stockActual: [{ value: inv.stockActual, disabled: !inv.habilitado }, [Validators.required, Validators.min(0)]]
        }))
      )
    });
  }

  toggleTienda(invControl: AbstractControl): void {
    const habilitado = invControl.get('habilitado')?.value;
    const stockControl = invControl.get('stockActual');
    if (habilitado) {
      stockControl?.enable();
    } else {
      stockControl?.disable();
      stockControl?.setValue(0); // Si lo apagan, lo regresamos a 0
    }
    this.actualizarStockTotal();
  }

  // Helper para el HTML
  getInventariosControls(tallaGroup: AbstractControl): FormArray {
    return tallaGroup.get('inventarios') as FormArray;
  }

  agregarGrupoVariante(): void {
    const grupo = this.crearGrupoGroup();
    (grupo.get('tallas') as FormArray).push(this.crearTallaGroup());
    this.gruposVariantes.push(grupo);
  }

  eliminarGrupo(index: number): void {
    this.gruposVariantes.removeAt(index);
    this.actualizarStockTotal();
  }

  getTallasControls(grupoIndex: number): FormArray {
    return this.gruposVariantes.at(grupoIndex).get('tallas') as FormArray;
  }

  agregarTalla(grupoIndex: number): void {
    this.getTallasControls(grupoIndex).push(this.crearTallaGroup());
  }

  eliminarTalla(grupoIndex: number, tallaIndex: number): void {
    this.getTallasControls(grupoIndex).removeAt(tallaIndex);
    this.actualizarStockTotal();
  }

  getImagenesControls(grupoIndex: number): FormArray {
    return this.gruposVariantes.at(grupoIndex).get('imagenes') as FormArray;
  }

  onFileSelectedGrupo(event: any, grupoIndex: number): void {
    const files = event.target.files;
    if (files && files.length > 0) {
      this.uploading = true;
      let archivosPendientes = files.length;

      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        this.mediaService.uploadFile(file).subscribe({
          next: (response) => {
            this.getImagenesControls(grupoIndex).push(this.fb.control(response.url));
            archivosPendientes--;
            if (archivosPendientes === 0) this.uploading = false;
          },
          error: () => {
            console.error('Error al subir una de las imágenes');
            archivosPendientes--;
            if (archivosPendientes === 0) this.uploading = false;
          }
        });
      }
    }
  }

  eliminarImagenDeGrupo(grupoIndex: number, imgIndex: number): void {
    this.getImagenesControls(grupoIndex).removeAt(imgIndex);
  }

  // ==========================================
  // 🔄 TRANSFORMACIÓN DE DATOS
  // ==========================================

  reconstruirGruposDesdeBackend(variantesPlanas: any[]): void {
    this.gruposVariantes.clear();
    const gruposMap = new Map<string, any>();

    variantesPlanas.forEach(v => {
      const colorKey = v.color.toLowerCase().trim();

      if (!gruposMap.has(colorKey)) {
        gruposMap.set(colorKey, { color: v.color, imagenes: [], tallas: [] });
      }

      const grupo = gruposMap.get(colorKey);
      let urlsNuevas: string[] = [];

      if (v.urlImagen) urlsNuevas.push(v.urlImagen);
      if (v.galeriaImagenes && Array.isArray(v.galeriaImagenes)) {
        urlsNuevas = [...urlsNuevas, ...v.galeriaImagenes];
      }

      if (urlsNuevas.length > 0) {
        const combinadas = [...grupo.imagenes, ...urlsNuevas];
        grupo.imagenes = [...new Set(combinadas)];
      }

      grupo.tallas.push({
        idVariante: v.idVariante,
        talla: v.talla,
        stockActual: v.stockActual,
        inventarios: v.inventarios // Le pasamos los inventarios del backend
      });
    });

    gruposMap.forEach(g => {
      const grupoForm = this.crearGrupoGroup(g.color, g.imagenes);
      const tallasArray = grupoForm.get('tallas') as FormArray;

      g.tallas.forEach((t: any) => {
        tallasArray.push(this.crearTallaGroup(t.talla, t.stockActual, t.idVariante, t.inventarios));
      });

      this.gruposVariantes.push(grupoForm);
    });

    if (this.gruposVariantes.length === 0) {
      this.agregarGrupoVariante();
    }
  }

  aplanarGruposParaBackend(): any[] {
    const variantesPlanas: any[] = [];

    this.gruposVariantes.controls.forEach(grupo => {
      const color = grupo.get('color')?.value;
      const imagenesArray = (grupo.get('imagenes') as FormArray).value;
      const imagenPrincipal = imagenesArray.length > 0 ? imagenesArray[0] : null;
      const tallas = (grupo.get('tallas') as FormArray).controls;

      tallas.forEach(t => {
        const inventariosRaw = (t.get('inventarios') as FormArray).getRawValue();

        // 👇 FILTRO ESTRELLA: Solo enviamos a Java las tiendas que tengan el check prendido
        const inventariosActivos = inventariosRaw.filter((inv: any) => inv.habilitado);

        const stockTotalVariante = inventariosActivos.reduce((acc: number, cur: any) => acc + (cur.stockActual || 0), 0);

        variantesPlanas.push({
          idVariante: t.get('idVariante')?.value,
          color: color,
          talla: t.get('talla')?.value,
          stockActual: stockTotalVariante,
          urlImagen: imagenPrincipal,
          galeriaImagenes: imagenesArray,
          inventarios: inventariosActivos // Mandamos la mochila filtrada
        });
      });
    });

    return variantesPlanas;
  }

  actualizarStockTotal(): void {
    let total = 0;
    this.gruposVariantes.controls.forEach(grupo => {
      const tallas = (grupo.get('tallas') as FormArray).controls;
      tallas.forEach(t => {
        // Usamos getRawValue() para poder leer los valores aunque estén "disabled"
        const inventariosArray = (t.get('inventarios') as FormArray).getRawValue();
        total += inventariosArray.reduce((acc: number, cur: any) => acc + (cur.stockActual || 0), 0);
      });
    });
    this.productoForm.patchValue({ stockActual: total }, { emitEvent: false });
  }

  cargarDatosProducto(id: number): void {
    this.productoService.getProductoAdminPorId(id.toString()).subscribe({
      next: (producto: any) => {
        const estaEnOferta = producto.enOferta === true;
        this.productoForm.patchValue({
          idProducto: producto.idProducto,
          codigoSku: producto.codigoSku,
          nombre: producto.nombre,
          descripcion: producto.descripcion,
          tieneOferta: estaEnOferta,
          precioRegular: producto.precioRegular,
          precioVenta: producto.precioVenta,
          precioCompra: producto.precioCompra,
          idMarca: producto.marca?.idMarca || null,
          idCategoria: producto.categoria?.idCategoria || null,
          urlImagen: producto.urlImagen
        });

        if (producto.urlImagen) this.previewUrl = environment.apiUrl + producto.urlImagen;

        if (producto.variantes && producto.variantes.length > 0) {
          this.reconstruirGruposDesdeBackend(producto.variantes);
        } else {
          this.agregarGrupoVariante();
        }
        if (!estaEnOferta) {
          this.productoForm.get('precioRegular')?.disable();
        }

        this.actualizarStockTotal();

        if (producto.caracteristicas) {
          this.actualizarCamposCaracteristicas(producto.categoria.idCategoria);
          this.productoForm.get('caracteristicas')?.patchValue(producto.caracteristicas);
        }
        this.cargando = false;
      },
      error: () => {
        this.error = 'Producto no encontrado.';
        this.cargando = false;
      }
    });
  }

  onSubmit(): void {
    if (this.productoForm.invalid) {
      this.error = 'Por favor, completa todos los campos requeridos.';
      return;
    }

    this.cargando = true;
    const formValue = this.productoForm.getRawValue();
    const productoData: any = {
      ...formValue,
      enOferta: formValue.tieneOferta,
      variantes: this.aplanarGruposParaBackend()
    };

    delete productoData.gruposVariantes;
    delete productoData.tieneOferta;

    if (this.esEdicion && this.productoId) {
      this.productoService.updateProducto(this.productoId, productoData).subscribe({
        next: () => {
          this.router.navigate(['/admin/productos']);
        },
        error: (err: HttpErrorResponse) => {
          console.error('Error del backend:', err.error);
          this.error = 'Error al actualizar el producto. Verifica los datos.';
          this.cargando = false;
        }
      });
    } else {
      this.productoService.createProducto(productoData).subscribe({
        next: () => {
          this.router.navigate(['/admin/productos']);
        },
        error: (err: HttpErrorResponse) => {
          this.error = 'Error al crear el producto. Verifica los datos.';
          this.cargando = false;
        }
      });
    }
  }

  get nombreMarcaSeleccionada(): string {
    const id = this.productoForm.get('idMarca')?.value;
    if (!id) return 'Seleccionar Marca';
    const marca = this.listaMarcas.find(m => m.idMarca === id);
    return marca ? marca.nombre : 'Seleccionar Marca';
  }

  seleccionarMarca(id: number | null): void {
    this.productoForm.patchValue({ idMarca: id });
    this.dropdownMarcaOpen = false;
  }

  cargarDropdowns(): void {
    this.cargando = true;
    forkJoin([
      this.marcaService.getMarcas(),
      this.categoriaService.getCategoriasAdmin()
    ]).subscribe({
      next: ([marcas, categorias]) => {
        this.listaMarcas = marcas;
        const todas = categorias;
        const listaJerarquica: CategoriaView[] = [];

        const abuelos = todas.filter(c => !c.idCategoriaPadre).sort((a, b) => a.nombre.localeCompare(b.nombre));

        abuelos.forEach(abuelo => {
          const rutaAbuelo = abuelo.nombre;
          listaJerarquica.push({ ...abuelo, nivel: 1, rutaCompleta: rutaAbuelo }); //

          const papas = todas.filter(p => p.idCategoriaPadre === abuelo.idCategoria).sort((a, b) => a.nombre.localeCompare(b.nombre));

          papas.forEach(papa => {
            const rutaPapa = `${rutaAbuelo} > ${papa.nombre}`;
            listaJerarquica.push({ ...papa, nivel: 2, rutaCompleta: rutaPapa }); //

            const hijos = todas.filter(h => h.idCategoriaPadre === papa.idCategoria).sort((a, b) => a.nombre.localeCompare(b.nombre));

            hijos.forEach(hijo => {
              const rutaHijo = `${rutaPapa} > ${hijo.nombre}`;
              listaJerarquica.push({ ...hijo, nivel: 3, rutaCompleta: rutaHijo }); //
            });
          });
        });

        this.listaCategorias = listaJerarquica;
        this.cargando = false;
      }
    });
  }

  actualizarCamposCaracteristicas(id: number) { /* Lógica existente para características */ }
  get caracteristicasKeys() { return Object.keys((this.productoForm.get('caracteristicas') as FormGroup).controls); }
  cargarImagenesGlobales(id: number) { /* Lógica existente */ }
  agregarImagen(idProducto: number, imagenData: any): void { /* Lógica existente */ }

  // 👇 LA LÓGICA DE LA GALERÍA QUE FALTABA (YA NO HAY ERRORES ROJOS) 👇
  onFileSelected(event: any): void {
    const files = event.target.files;
    if (files && files.length > 0) {
      this.uploading = true;
      let archivosPendientes = files.length;

      for (let i = 0; i < files.length; i++) {
        this.mediaService.uploadFile(files[i]).subscribe({
          next: (response) => {
            this.imagenesProducto.push({
              idImagen: new Date().getTime() + i,
              urlImagen: response.url
            });
            archivosPendientes--;
            if (archivosPendientes === 0) this.uploading = false;
          },
          error: () => {
            archivosPendientes--;
            if (archivosPendientes === 0) this.uploading = false;
          }
        });
      }
    }
  }

  eliminarImagenGaleria(idImagen: number): void {
    this.imagenesProducto = this.imagenesProducto.filter(img => img.idImagen !== idImagen);
  }
}
