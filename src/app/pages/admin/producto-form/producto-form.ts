import { Component, OnInit } from '@angular/core';
// ¡Añade 'AbstractControl' para el helper!
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule, AbstractControl } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { Producto } from '../../../services/producto';
import { Marca, MarcaDTO } from '../../../services/marca';
import { Categoria, CategoriaDTO } from '../../../services/categoria';
import { Router, ActivatedRoute, RouterLink } from '@angular/router';
import { forkJoin } from 'rxjs';
import { HttpErrorResponse } from '@angular/common/http';
// --- ¡IMPORTA EL SERVICIO DE MEDIA! ---
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

  // Variables para IMÁGENES
  public selectedFile: File | null = null;
  public uploading: boolean = false;
  public imagenesProducto: any[] = [];

  // --- LÓGICA DE PLANTILLAS DE CARACTERÍSTICAS ---
  private caracteristicasTemplates: { [key: number]: string[] } = {
    3: ['talla', 'color', 'material'],  // Gorras
    4: ['talla', 'color', 'material'],  // Polos
    5: ['talla', 'color', 'tela'],      // Pantalones
    6: ['talla', 'color', 'material'],  // Casacas
    7: ['medidas', 'color', 'material'],// Cortinas
    8: ['tamaño', 'hilos', 'material'], // Sábanas
    9: ['medidas', 'firmeza', 'material'],// Almohadas
    10: ['medidas', 'color', 'gramaje'], // Toallas
    11: ['talla', 'color', 'material'],  // Calzado
    12: ['color', 'material', 'estilo'], // Decoración
    13: ['material', 'piezas']           // Utensilios de Cocina
  };

  constructor(
    private fb: FormBuilder,
    private productoService: Producto,
    private marcaService: Marca,
    private categoriaService: Categoria,
    private router: Router,
    private route: ActivatedRoute,
    private mediaService: Media // <-- INYECTA EL SERVICIO DE MEDIA
  ) {
    this.productoForm = this.fb.group({
      idProducto: [null],
      codigoSku: ['', Validators.required],
      nombre: ['', Validators.required],
      descripcion: [''],
      precioRegular: [0, [Validators.required, Validators.min(0)]],
      precioVenta: [0, [Validators.required, Validators.min(0)]],
      precioCompra: [0, [Validators.required, Validators.min(0)]],
      stockActual: [0, [Validators.required, Validators.min(0)]],
      idMarca: [null, Validators.required],
      idCategoria: [null, Validators.required],

      caracteristicas: this.fb.group({})
    });
  }

  ngOnInit(): void {
    this.cargarDropdowns();

    // Escucha cambios en la categoría para actualizar campos dinámicos
    this.productoForm.get('idCategoria')?.valueChanges.subscribe(idCategoria => {
      if (idCategoria) {
        this.actualizarCamposCaracteristicas(idCategoria);
      }
    });

    // Verificar si es modo edición
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.esEdicion = true;
      this.productoId = +id;
      this.cargarDatosProducto(this.productoId);

      // Cargar las imágenes existentes
      this.cargarImagenes(this.productoId);
    } else {
      this.cargando = false;
    }
  }

  // --- MÉTODOS DE IMÁGENES ---

  cargarImagenes(id: number): void {
    this.productoService.getImagenesPorProducto(id.toString()).subscribe({
      next: (imgs) => this.imagenesProducto = imgs,
      error: (err) => console.error('Error cargando imágenes', err)
    });
  }

  onFileSelected(event: any): void {
    const file: File = event.target.files[0];
    if (file) {
      this.selectedFile = file;
    }
  }

  subirImagen(): void {
    if (!this.selectedFile || !this.productoId) return;

    this.uploading = true;

    // 1. Subir el archivo físico al servidor
    this.mediaService.uploadFile(this.selectedFile).subscribe({
      next: (response) => {
        const url = response.url; // La URL que nos devuelve el backend

        // 2. Guardar la referencia en la base de datos
        const imagenData = {
          urlImagen: url,
          descripcionAlt: this.productoForm.get('nombre')?.value || 'Imagen de producto',
          orden: this.imagenesProducto.length + 1
        };

        this.productoService.agregarImagen(this.productoId!, imagenData).subscribe({
          next: (nuevaImg) => {
            alert('Imagen subida con éxito');
            this.imagenesProducto.push(nuevaImg); // Actualizar la vista
            this.selectedFile = null;
            this.uploading = false;
          },
          error: (err) => {
            console.error('Error guardando en BD:', err);
            this.uploading = false;
          }
        });
      },
      error: (err) => {
        console.error('Error subiendo archivo:', err);
        alert('Error al subir el archivo. Asegúrate de que el backend permite /api/media/upload.');
        this.uploading = false;
      }
    });
  }

  // --- MÉTODOS DEL FORMULARIO ---

  cargarDropdowns(): void {
    forkJoin([
      this.marcaService.getMarcas(),
      this.categoriaService.getCategorias()
    ]).subscribe({
      next: ([marcas, categorias]) => {
        this.listaMarcas = marcas;
        // Filtramos para que en el dropdown solo se vean las "hijas"
        this.listaCategorias = categorias.filter(c => c.idCategoriaPadre != null);
      },
      error: (err: any) => {
        this.error = 'Error al cargar Marcas y Categorías.';
        this.cargando = false;
      }
    });
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
          stockActual: producto.stockActual,
          idMarca: producto.marca.idMarca,
          idCategoria: producto.categoria.idCategoria
        });

        if (producto.caracteristicas) {
          this.actualizarCamposCaracteristicas(producto.categoria.idCategoria);
          this.productoForm.get('caracteristicas')?.patchValue(producto.caracteristicas);
        }

        this.cargando = false;
      },
      error: (err: any) => {
        this.error = 'Producto no encontrado.';
        this.cargando = false;
      }
    });
  }

  actualizarCamposCaracteristicas(idCategoria: number): void {
    const caracteristicasGroup = this.productoForm.get('caracteristicas') as FormGroup;

    Object.keys(caracteristicasGroup.controls).forEach(key => {
      caracteristicasGroup.removeControl(key);
    });

    const template = this.caracteristicasTemplates[idCategoria] || [];

    template.forEach(field => {
      caracteristicasGroup.addControl(field, this.fb.control('', Validators.required));
    });
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
    this.error = null;

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
