import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule, AbstractControl, FormArray } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { Producto } from '../../../services/producto';
import { Marca, MarcaDTO } from '../../../services/marca';
import { Categoria, CategoriaDTO } from '../../../services/categoria';
import { Router, ActivatedRoute, RouterLink } from '@angular/router';
import { forkJoin } from 'rxjs';
import { HttpErrorResponse } from '@angular/common/http';
import { Media } from '../../../services/media';

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

  // Variables para Imagen Principal y Galería Global
  public previewUrl: string | null = null;
  public uploading: boolean = false;
  public imagenesProducto: any[] = []; // <-- ¡ESTA FALTABA! Lista para la galería global

  private caracteristicasTemplates: { [key: number]: string[] } = {
    3: ['material'], 4: ['material'], 5: ['tela', 'corte'],
    // ... tus otros templates
  };

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
      codigoSku: ['', Validators.required],
      nombre: ['', Validators.required],
      descripcion: [''],
      precioRegular: [0, [Validators.required, Validators.min(0)]],
      precioVenta: [0, [Validators.required, Validators.min(0)]],
      precioCompra: [0, [Validators.required, Validators.min(0)]],
      stockActual: [0],
      idMarca: [null, Validators.required],
      idCategoria: [null, Validators.required],
      urlImagen: [''],
      caracteristicas: this.fb.group({}),
      variantes: this.fb.array([])
    });
  }

  get variantes(): FormArray {
    return this.productoForm.get('variantes') as FormArray;
  }

  ngOnInit(): void {
    this.cargarDropdowns();

    this.productoForm.get('idCategoria')?.valueChanges.subscribe(id => {
      if (id) this.actualizarCamposCaracteristicas(id);
    });

    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.esEdicion = true;
      this.productoId = +id;
      this.cargarDatosProducto(this.productoId);

      // ¡IMPORTANTE! Cargar la galería global si existe
      this.cargarImagenesGlobales(this.productoId);
    } else {
      this.cargando = false;
      this.agregarVariante();
    }
  }

  // --- GESTIÓN DE VARIANTES ---

  crearVarianteGroup(): FormGroup {
    return this.fb.group({
      idVariante: [null],
      color: ['', Validators.required],
      talla: ['', Validators.required],
      skuVariante: [''],
      stockActual: [0, [Validators.required, Validators.min(0)]],
      urlImagen: [''],
      galeriaImagenes: [[]]
    });
  }

  agregarVariante(): void {
    this.variantes.push(this.crearVarianteGroup());
    this.actualizarStockTotal();
  }

  eliminarVariante(index: number): void {
    this.variantes.removeAt(index);
    this.actualizarStockTotal();
  }

  // --- SUBIDA DE FOTOS PARA VARIANTES (TABLA) ---

  onFileSelectedVariante(event: any, index: number): void {
    const file: File = event.target.files[0];
    if (file) {
      this.mediaService.uploadFile(file).subscribe({
        next: (response) => {
          const varianteGroup = this.variantes.at(index) as FormGroup;
          const currentGallery = varianteGroup.get('galeriaImagenes')?.value || [];
          const updatedGallery = [...currentGallery, response.url];

          varianteGroup.patchValue({
            galeriaImagenes: updatedGallery,
            urlImagen: varianteGroup.get('urlImagen')?.value || response.url
          });
        },
        error: () => alert('Error al subir imagen para la variante')
      });
    }
  }

  eliminarImagenDeVariante(indexVariante: number, urlToRemove: string): void {
    const varianteGroup = this.variantes.at(indexVariante) as FormGroup;
    const currentGallery = varianteGroup.get('galeriaImagenes')?.value || [];
    const updatedGallery = currentGallery.filter((u: string) => u !== urlToRemove);

    varianteGroup.patchValue({
      galeriaImagenes: updatedGallery,
      urlImagen: updatedGallery.length > 0 ? updatedGallery[0] : ''
    });
  }

  // --- GESTIÓN DE GALERÍA GLOBAL (ABAJO DEL FORMULARIO) ---

  cargarImagenesGlobales(id: number): void {
    this.productoService.getImagenesPorProducto(id.toString()).subscribe({
      next: (imgs) => this.imagenesProducto = imgs,
      error: (err) => console.error(err)
    });
  }

  // Subir foto a la galería global
  onFileSelected(event: any): void {
    const file: File = event.target.files[0];
    if (file) {
      this.uploading = true;
      this.mediaService.uploadFile(file).subscribe({
        next: (resp) => {
          // 1. Si es la primera, la ponemos como principal en el formulario
          if (!this.productoForm.get('urlImagen')?.value) {
            this.productoForm.patchValue({ urlImagen: resp.url });
            this.previewUrl = 'http://localhost:8080' + resp.url;
          }

          // 2. Guardar en la tabla imagenes_producto (Galería Global)
          if (this.esEdicion && this.productoId) {
            const nuevaImagenData = {
              urlImagen: resp.url,
              descripcionAlt: this.productoForm.get('nombre')?.value || 'Imagen',
              orden: this.imagenesProducto.length + 1
            };
            this.productoService.agregarImagen(this.productoId, nuevaImagenData).subscribe({
              next: (imgGuardada) => {
                this.imagenesProducto.push(imgGuardada);
                this.uploading = false;
              }
            });
          } else {
            // Si es producto nuevo, solo actualizamos el campo principal por ahora
            this.uploading = false;
          }
        },
        error: () => {
          alert('Error al subir imagen');
          this.uploading = false;
        }
      });
    }
  }

  // ¡ESTE ES EL MÉTODO QUE FALTABA!
  eliminarImagenGaleria(idImagen: number): void {
    if (!confirm('¿Estás seguro de eliminar esta imagen de la galería?')) return;

    this.productoService.eliminarImagen(idImagen).subscribe({
      next: () => {
        // Eliminar de la lista local
        this.imagenesProducto = this.imagenesProducto.filter(img => img.idImagen !== idImagen);
      },
      error: () => alert('Error al eliminar la imagen.')
    });
  }

  // --------------------------------------

  actualizarStockTotal(): void {
    const total = this.variantes.controls.reduce((sum, control) => {
      return sum + (control.get('stockActual')?.value || 0);
    }, 0);
    this.productoForm.patchValue({ stockActual: total });
  }

  cargarDatosProducto(id: number): void {
    this.productoService.getProductoAdminPorId(id.toString()).subscribe({
      next: (producto: any) => {
        this.productoForm.patchValue({
          idProducto: producto.idProducto,
          codigoSku: producto.codigoSku,
          nombre: producto.nombre,
          descripcion: producto.descripcion,
          precioRegular: producto.precioRegular,
          precioVenta: producto.precioVenta,
          precioCompra: producto.precioCompra,
          // stockActual: producto.stockActual, // <-- Ya no confiamos en este valor directo
          idMarca: producto.marca?.idMarca,
          idCategoria: producto.categoria?.idCategoria,
          urlImagen: producto.urlImagen
        });

        if (producto.urlImagen) this.previewUrl = 'http://localhost:8080' + producto.urlImagen;

        this.variantes.clear();
        if (producto.variantes && producto.variantes.length > 0) {
          producto.variantes.forEach((v: any) => {
            const g = this.crearVarianteGroup();
            v.galeriaImagenes = v.galeriaImagenes || (v.urlImagen ? [v.urlImagen] : []);
            g.patchValue(v);
            this.variantes.push(g);
          });
        } else {
          this.agregarVariante();
        }

        // --- ¡CORRECCIÓN AQUÍ! ---
        // Forzamos el recálculo matemático del stock basado en las variantes cargadas
        this.actualizarStockTotal();
        // ------------------------

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

  cargarDropdowns(): void {
    forkJoin([
      this.marcaService.getMarcas(),
      this.categoriaService.getCategorias()
    ]).subscribe({
      next: ([marcas, categorias]) => {
        this.listaMarcas = marcas;
        this.listaCategorias = categorias.filter(c => c.idCategoriaPadre != null);
      },
      error: () => { this.error = 'Error al cargar listas.'; this.cargando = false; }
    });
  }

  actualizarCamposCaracteristicas(idCategoria: number): void {
    const caracteristicasGroup = this.productoForm.get('caracteristicas') as FormGroup;
    Object.keys(caracteristicasGroup.controls).forEach(key => caracteristicasGroup.removeControl(key));
    const template = this.caracteristicasTemplates[idCategoria] || [];
    template.forEach(field => caracteristicasGroup.addControl(field, this.fb.control('', Validators.required)));
  }

  get caracteristicasControls(): AbstractControl[] {
    const group = this.productoForm.get('caracteristicas') as FormGroup;
    return Object.values(group.controls);
  }

  get caracteristicasKeys(): string[] {
    const group = this.productoForm.get('caracteristicas') as FormGroup;
    return Object.keys(group.controls);
  }

  onSubmit(): void {
    if (this.productoForm.invalid) {
      this.error = 'Por favor, completa todos los campos requeridos.';
      return;
    }
    this.cargando = true;
    const productoData = this.productoForm.value;

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
}
