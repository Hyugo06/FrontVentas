import { Component, OnInit } from '@angular/core';
// ¡IMPORTANTE: Añade FormArray a las importaciones!
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

  // Imagen
  public previewUrl: string | null = null;
  public uploading: boolean = false;

  // Plantillas (Ya no pedimos Talla/Color aquí porque van en Variantes)
  private caracteristicasTemplates: { [key: number]: string[] } = {
    3: ['material'],
    4: ['material'],
    5: ['tela', 'corte'],
    6: ['material', 'impermeable'],
    7: ['material'],
    8: ['hilos', 'material'],
    11: ['material', 'suela']
    // ... ajusta según tus necesidades
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

      // Stock Total (Calculado, solo lectura)
      stockActual: [0, [Validators.required, Validators.min(0)]],

      idMarca: [null, Validators.required],
      idCategoria: [null, Validators.required],
      urlImagen: [''],

      caracteristicas: this.fb.group({}),

      // --- ¡NUEVO: ARRAY DE VARIANTES! ---
      variantes: this.fb.array([])
    });
  }

  // Getter para usar en el HTML
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
    } else {
      this.cargando = false;
      // Si es nuevo, añadimos una variante vacía por defecto
      this.agregarVariante();
    }
  }

  // --- LÓGICA DE VARIANTES ---

  crearVarianteGroup(): FormGroup {
    return this.fb.group({
      idVariante: [null], // Para saber si es update
      color: ['', Validators.required],
      talla: ['', Validators.required],
      skuVariante: [''],
      stockActual: [0, [Validators.required, Validators.min(0)]]
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

  // Suma el stock de todas las filas y actualiza el campo principal
  actualizarStockTotal(): void {
    const total = this.variantes.controls.reduce((sum, control) => {
      return sum + (control.get('stockActual')?.value || 0);
    }, 0);
    this.productoForm.patchValue({ stockActual: total });
  }

  // ---------------------------

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
          stockActual: producto.stockActual,
          idMarca: producto.marca?.idMarca,
          idCategoria: producto.categoria?.idCategoria,
          urlImagen: producto.urlImagen
        });

        // Cargar Imagen
        if (producto.urlImagen) {
          this.previewUrl = 'http://localhost:8080' + producto.urlImagen;
        }

        // Cargar Variantes
        this.variantes.clear();
        if (producto.variantes && producto.variantes.length > 0) {
          producto.variantes.forEach((v: any) => {
            const g = this.crearVarianteGroup();
            g.patchValue(v);
            this.variantes.push(g);
          });
        } else {
          this.agregarVariante(); // Al menos una
        }

        // Cargar Características
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

  // --- Resto de métodos (igual que antes) ---

  cargarDropdowns(): void {
    forkJoin([
      this.marcaService.getMarcas(),
      this.categoriaService.getCategorias()
    ]).subscribe({
      next: ([marcas, categorias]) => {
        this.listaMarcas = marcas;
        this.listaCategorias = categorias.filter(c => c.idCategoriaPadre != null);
      },
      error: () => {
        this.error = 'Error al cargar listas.';
        this.cargando = false;
      }
    });
  }

  onFileSelected(event: any): void {
    const file: File = event.target.files[0];
    if (file) {
      this.uploading = true;
      this.mediaService.uploadFile(file).subscribe({
        next: (resp) => {
          this.productoForm.patchValue({ urlImagen: resp.url });
          this.previewUrl = 'http://localhost:8080' + resp.url;
          this.uploading = false;
        },
        error: () => {
          alert('Error al subir imagen');
          this.uploading = false;
        }
      });
    }
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
