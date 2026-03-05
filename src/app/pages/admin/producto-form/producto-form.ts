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
  public listaCategorias: CategoriaDTO[] = [];
  public cargando: boolean = true;
  public error: string | null = null;

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
      stockActual: [0],
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
      this.cargarImagenesGlobales(this.productoId); // (Si usas esta función)
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
      color: [color, Validators.required],
      // Array de strings (URLs)
      imagenes: this.fb.array(imagenesUrls.map(url => this.fb.control(url))),
      tallas: this.fb.array([])
    });
  }

  // --- FUNCIÓN PARA CORREGIR LAS URLs ---
  public resolverUrlImagen(url: string | null): string {
    if (!url) return 'assets/img/sin-imagen.png';

    // 1. Si ya es de Cloudinary (empieza con http), la dejamos tal cual
    if (url.startsWith('http')) {
      return url;
    }

    // 2. Si es una imagen antigua (ruta relativa), le pegamos tu dominio de Render
    return environment.apiUrl + url;
  }

  crearTallaGroup(talla: string = '', stock: number = 0, idVariante: number | null = null): FormGroup {
    return this.fb.group({
      idVariante: [idVariante],
      talla: [talla, Validators.required],
      stockActual: [stock, [Validators.required, Validators.min(0)]]
    });
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

  // --- GESTIÓN DE TALLAS ---
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

  // --- GESTIÓN DE IMÁGENES DEL GRUPO ---
  getImagenesControls(grupoIndex: number): FormArray {
    return this.gruposVariantes.at(grupoIndex).get('imagenes') as FormArray;
  }

  onFileSelectedGrupo(event: any, grupoIndex: number): void {
    // 1. Obtenemos TODOS los archivos, no solo el [0]
    const files = event.target.files;

    if (files && files.length > 0) {
      this.uploading = true;
      let archivosPendientes = files.length; // Contador para saber cuándo apagar el loading

      // 2. Recorremos cada archivo seleccionado
      for (let i = 0; i < files.length; i++) {
        const file = files[i];

        this.mediaService.uploadFile(file).subscribe({
          next: (response) => {
            // Agregamos la URL recibida al array de imágenes
            this.getImagenesControls(grupoIndex).push(this.fb.control(response.url));

            // Restamos uno al contador
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
  // 🔄 TRANSFORMACIÓN DE DATOS (CORREGIDA)
  // ==========================================

  reconstruirGruposDesdeBackend(variantesPlanas: any[]): void {
    this.gruposVariantes.clear();
    const gruposMap = new Map<string, any>();

    variantesPlanas.forEach(v => {
      const colorKey = v.color.toLowerCase().trim();

      if (!gruposMap.has(colorKey)) {
        gruposMap.set(colorKey, {
          color: v.color,
          imagenes: [],
          tallas: []
        });
      }

      const grupo = gruposMap.get(colorKey);

      // --- CORRECCIÓN AQUÍ: Leer 'galeriaImagenes' que envía el Backend ---
      let urlsNuevas: string[] = [];

      // A) Compatibilidad: imagen principal antigua
      if (v.urlImagen) urlsNuevas.push(v.urlImagen);

      // B) Nuevo sistema: lista de strings que manda tu Java DTO
      if (v.galeriaImagenes && Array.isArray(v.galeriaImagenes)) {
        urlsNuevas = [...urlsNuevas, ...v.galeriaImagenes];
      }

      // C) Agregamos sin duplicados
      if (urlsNuevas.length > 0) {
        const combinadas = [...grupo.imagenes, ...urlsNuevas];
        grupo.imagenes = [...new Set(combinadas)];
      }

      grupo.tallas.push({
        idVariante: v.idVariante,
        talla: v.talla,
        stockActual: v.stockActual
      });
    });

    gruposMap.forEach(g => {
      const grupoForm = this.crearGrupoGroup(g.color, g.imagenes);
      const tallasArray = grupoForm.get('tallas') as FormArray;

      g.tallas.forEach((t: any) => {
        tallasArray.push(this.crearTallaGroup(t.talla, t.stockActual, t.idVariante));
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

      // Obtenemos el array de strings ["/uploads/...", "/uploads/..."]
      const imagenesArray = (grupo.get('imagenes') as FormArray).value;

      // Imagen principal (para compatibilidad)
      const imagenPrincipal = imagenesArray.length > 0 ? imagenesArray[0] : null;

      const tallas = (grupo.get('tallas') as FormArray).controls;

      tallas.forEach(t => {
        variantesPlanas.push({
          idVariante: t.get('idVariante')?.value,
          color: color,
          talla: t.get('talla')?.value,
          stockActual: t.get('stockActual')?.value,

          // --- CORRECCIÓN AQUÍ: Enviar datos como Java los espera ---
          urlImagen: imagenPrincipal,       // String
          galeriaImagenes: imagenesArray    // List<String> <-- ¡ESTO ES LO QUE FALTABA!
        });
      });
    });

    return variantesPlanas;
  }

  // ==========================================
  // ⚙️ OTROS MÉTODOS
  // ==========================================

  actualizarStockTotal(): void {
    let total = 0;
    this.gruposVariantes.controls.forEach(grupo => {
      const tallas = (grupo.get('tallas') as FormArray).controls;
      tallas.forEach(t => total += (t.get('stockActual')?.value || 0));
    });
    this.productoForm.patchValue({ stockActual: total });
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
          tieneOferta: estaEnOferta,// Marcamos el check si corresponde
          precioRegular: producto.precioRegular,
          precioVenta: producto.precioVenta,
          precioCompra: producto.precioCompra,
          idMarca: producto.marca?.idMarca,
          idCategoria: producto.categoria?.idCategoria,
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
    const productoData = {
      ...formValue,
      enOferta: formValue.tieneOferta,
      variantes: this.aplanarGruposParaBackend()
    };
    delete productoData.gruposVariantes;
    delete productoData.tieneOferta;
    if (this.esEdicion && this.productoId) {
      this.productoService.updateProducto(this.productoId, productoData).subscribe({
        next: () => this.router.navigate(['/admin/productos']),
        error: (err: HttpErrorResponse) => {
          this.error = err.error?.message || 'Error al actualizar.';
          this.cargando = false;
        }
      });
    } else {
      this.productoService.createProducto(productoData).subscribe({
        next: () => this.router.navigate(['/admin/productos']),
        error: (err: HttpErrorResponse) => {
          this.error = err.error?.message || 'Error al crear.';
          this.cargando = false;
        }
      });
    }
  }

  cargarDropdowns(): void {
    forkJoin([this.marcaService.getMarcas(), this.categoriaService.getCategorias()]).subscribe({
      next: ([marcas, categorias]) => {
        this.listaMarcas = marcas;
        this.listaCategorias = categorias.filter(c => c.idCategoriaPadre != null);
      },
      error: () => { this.error = 'Error al cargar listas.'; this.cargando = false; }
    });
  }

  actualizarCamposCaracteristicas(id: number) { /* Lógica existente para características */ }
  get caracteristicasKeys() { return Object.keys((this.productoForm.get('caracteristicas') as FormGroup).controls); }
  cargarImagenesGlobales(id: number) { /* Lógica existente */ }
  onFileSelected(event: any) { /* Lógica existente */ }
  eliminarImagenGaleria(id: number) { /* Lógica existente */ }
  agregarImagen(idProducto: number, imagenData: any): void { /* Lógica existente */ }
}
