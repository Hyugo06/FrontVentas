import { Component, OnInit } from '@angular/core';
// ¡Añade 'AbstractControl' para el helper!
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule, AbstractControl } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { Producto } from '../../../services/producto';
import { Marca, MarcaDTO } from '../../../services/marca';
import { Categoria, CategoriaDTO } from '../../../services/categoria';
import {Router, ActivatedRoute, RouterLink} from '@angular/router';
import { forkJoin } from 'rxjs';
import { HttpErrorResponse } from '@angular/common/http';

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

  // --- ¡AQUÍ ESTÁ LA LÓGICA DE PLANTILLAS! ---
  // Mapea el ID de la Categoría (de tu BD) a los campos que debe tener.
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
      idMarca: [null, Validators.required],
      idCategoria: [null, Validators.required],

      // ¡AÑADIDO! Un sub-formulario vacío para las características
      caracteristicas: this.fb.group({})
    });
  }

  ngOnInit(): void {
    this.cargarDropdowns(); // Carga Marcas y Categorías

    // --- ¡AÑADIDO! Escucha los cambios del dropdown de Categoría ---
    this.productoForm.get('idCategoria')?.valueChanges.subscribe(idCategoria => {
      if (idCategoria) {
        this.actualizarCamposCaracteristicas(idCategoria);
      }
    });

    // 2. Verificar si es modo edición
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.esEdicion = true;
      this.productoId = +id;
      this.cargarDatosProducto(this.productoId);
    } else {
      this.cargando = false;
    }
  }

  /**
   * Carga las listas de Marcas y Categorías
   */
  cargarDropdowns(): void {
    forkJoin([
      this.marcaService.getMarcas(),
      this.categoriaService.getCategorias() // Carga todas
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

  /**
   * Carga los datos del producto (para Edición)
   */
  cargarDatosProducto(id: number): void {
    this.productoService.getProductoAdminPorId(id.toString()).subscribe({
      next: (producto: any) => {

        // 1. Rellena los campos principales
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

        // 2. Rellena las características dinámicas
        if (producto.caracteristicas) {
          // Genera los campos (basado en la categoría)
          this.actualizarCamposCaracteristicas(producto.categoria.idCategoria);
          // Rellena los valores que vienen del JSONB
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

  /**
   * ¡NUEVO! Esta función añade/quita campos del formulario dinámicamente
   */
  actualizarCamposCaracteristicas(idCategoria: number): void {
    const caracteristicasGroup = this.productoForm.get('caracteristicas') as FormGroup;

    // 1. Borra todos los controles (campos) anteriores
    Object.keys(caracteristicasGroup.controls).forEach(key => {
      caracteristicasGroup.removeControl(key);
    });

    // 2. Obtiene la nueva plantilla de campos (ej. ['talla', 'color'])
    const template = this.caracteristicasTemplates[idCategoria] || [];

    // 3. Añade los nuevos controles (campos) al formulario
    template.forEach(field => {
      caracteristicasGroup.addControl(field, this.fb.control('', Validators.required));
    });
  }

  /**
   * ¡NUEVO! Helper para que el HTML pueda iterar sobre los campos dinámicos
   */
  get caracteristicasControls(): AbstractControl[] {
    const group = this.productoForm.get('caracteristicas') as FormGroup;
    return Object.values(group.controls);
  }

  get caracteristicasKeys(): string[] {
    const group = this.productoForm.get('caracteristicas') as FormGroup;
    return Object.keys(group.controls);
  }


  /**
   * Lógica para el envío del formulario (¡ya funciona con el sub-formulario!)
   */
  onSubmit(): void {
    if (this.productoForm.invalid) {
      this.error = 'Por favor, completa todos los campos requeridos (incluyendo características).';
      return;
    }
    this.cargando = true;
    this.error = null;

    // productoData ahora incluye el objeto 'caracteristicas' anidado
    const productoData = this.productoForm.value;

    console.log('Enviando:', productoData); // ¡Revisa la consola para ver el JSON!

    if (this.esEdicion && this.productoId) {
      // --- LÓGICA DE ACTUALIZAR (PUT) ---
      this.productoService.updateProducto(this.productoId, productoData).subscribe({
        next: () => this.router.navigate(['/admin/productos']),
        error: (err: HttpErrorResponse) => {
          this.error = err.error?.message || 'Error al actualizar.';
          this.cargando = false;
        }
      });
    } else {
      // --- LÓGICA DE CREAR (POST) ---
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
