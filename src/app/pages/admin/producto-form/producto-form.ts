import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';

// --- Importa los servicios y las interfaces ---
import { Producto } from '../../../services/producto';
import { Marca, MarcaDTO } from '../../../services/marca';
import { Categoria, CategoriaDTO } from '../../../services/categoria';
import {Router, ActivatedRoute, RouterLink} from '@angular/router';
import { forkJoin } from 'rxjs';
import { HttpErrorResponse } from '@angular/common/http'; // ¡Esto ya está correcto!


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

  constructor(
    private fb: FormBuilder,
    private productoService: Producto,
    private marcaService: Marca,
    private categoriaService: Categoria,
    private router: Router,
    private route: ActivatedRoute
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
      // Inicializamos los select con null para que el 'required' de la BD se respete
      idMarca: [null, Validators.required],
      idCategoria: [null, Validators.required],
    });
  }

  ngOnInit(): void {
    // 1. Cargar las Marcas y Categorías al mismo tiempo
    this.cargarDropdowns();

    // 2. Verificar si es modo edición
    this.route.paramMap.subscribe(params => {
      const id = params.get('id');
      if (id) {
        this.esEdicion = true;
        this.productoId = +id;
        this.cargarDatosProducto(this.productoId);
      } else {
        this.cargando = false;
      }
    });
  }

  /**
   * Carga las listas de Marcas y Categorías (LIMPIEZA DE CÓDIGO)
   */
  cargarDropdowns(): void {
    forkJoin([
      this.marcaService.getMarcas(),
      this.categoriaService.getCategorias()
    ]).subscribe({
      next: ([marcas, categorias]) => {
        this.listaMarcas = marcas;
        this.listaCategorias = categorias;
        this.error = null;
      },
      // --- ¡BLOQUE ERROR CORREGIDO! ---
      error: (err: any) => { // Un solo bloque error con :any
        this.error = 'Error al cargar Marcas y Categorías. ¿Están funcionando sus endpoints?';
        console.error('Error cargando listas:', err);
        this.cargando = false;
      }
    });
  }

  /**
   * Carga los datos del producto existente en modo edición (CORRECCIÓN DE SINTAXIS)
   */
  cargarDatosProducto(id: number): void {
    this.productoService.getProductoAdminPorId(id.toString()).subscribe({
      next: (producto: any) => {
        // Mapear los datos de la respuesta al formulario
        this.productoForm.patchValue({
          idProducto: producto.idProducto,
          codigoSku: producto.codigoSku,
          nombre: producto.nombre,
          descripcion: producto.descripcion,
          precioRegular: producto.precioRegular,
          precioVenta: producto.precioVenta,
          precioCompra: producto.precioCompra,
          stockActual: producto.stockActual,
          // Usamos 'idMarca' y 'idCategoria' de los objetos anidados
          idMarca: producto.marca.idMarca,
          idCategoria: producto.categoria.idCategoria
        });
        this.cargando = false;
      },
      // --- ¡CORRECCIÓN DE SINTAXIS! ---
      error: (err: any) => {
        this.error = 'Producto no encontrado o error de conexión.';
        this.cargando = false;
        console.error('Error cargando datos del producto:', err);
      }
    });
  }


  /**
   * Lógica para el envío del formulario
   */
  onSubmit(): void {
    if (this.productoForm.invalid) {
      this.error = 'Por favor, completa todos los campos requeridos y revisa los números.';
      return;
    }

    const productoData = this.productoForm.value;

    // --- LÓGICA DE POST vs. PUT ---

    if (this.esEdicion && this.productoId) {
      this.actualizarProducto(this.productoId, productoData);
    }
    // Si es Creación (POST)
    else {
      this.crearProducto(productoData);
    }
  }

  crearProducto(data: any): void {
    this.productoService.createProducto(data).subscribe({ // Asumo que el servicio tendrá un createProducto
      next: (response) => {
        alert(`Producto ${response.nombre} creado con éxito!`);
        this.router.navigate(['/admin/productos']); // Redirigir al dashboard
      },
      error: (err: HttpErrorResponse) => { // Usamos HttpErrorResponse para más detalle
        this.error = `Error al crear: ${err.error.message || err.statusText}`;
        console.error('Error al crear producto:', err);
      }
    });
  }

  actualizarProducto(id: number, data: any): void {
    // 1. Añadimos el id al objeto de datos
    data.idProducto = id;

    this.productoService.updateProducto(id, data).subscribe({ // Asumo que el servicio tendrá un updateProducto
      next: (response) => {
        alert(`Producto ${response.nombre} actualizado con éxito!`);
        this.router.navigate(['/admin/productos']); // Redirigir al dashboard
      },
      error: (err: HttpErrorResponse) => {
        this.error = `Error al actualizar: ${err.error.message || err.statusText}`;
        console.error('Error al actualizar producto:', err);
      }
    });
  }
}
