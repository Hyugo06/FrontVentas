import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router, ActivatedRoute, RouterLink } from '@angular/router';
import { Categoria, CategoriaDTO } from '../../../services/categoria'; // Tu servicio de Categoria
import { HttpErrorResponse } from '@angular/common/http';

@Component({
  selector: 'app-categoria-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './categoria-form.html',
  styleUrl: './categoria-form.css'
})
export class CategoriaFormComponent implements OnInit {

  public categoriaForm: FormGroup;
  public esEdicion: boolean = false;
  public categoriaId: number | null = null;
  public error: string | null = null;
  public cargando: boolean = true;

  // Lista para el dropdown de "Categoría Padre"
  public listaCategoriasPadre: CategoriaDTO[] = [];

  constructor(
    private fb: FormBuilder,
    private categoriaService: Categoria,
    private router: Router,
    private route: ActivatedRoute
  ) {
    this.categoriaForm = this.fb.group({
      nombre: ['', Validators.required],
      descripcion: [''],
      // Este es el dropdown para seleccionar el padre
      // Usamos 'idCategoriaPadre' para guardar solo el ID
      idCategoriaPadre: [null]
    });
  }

  ngOnInit(): void {
    // 1. Cargar el dropdown de categorías padre
    this.cargarCategoriasPadre();

    // 2. Revisar si es modo edición
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.esEdicion = true;
      this.categoriaId = +id;
      this.cargarCategoria(this.categoriaId); // Carga los datos de la categoría
    } else {
      this.cargando = false; // Modo 'nuevo'
    }
  }

  /**
   * Carga la lista de categorías para el dropdown
   */
  cargarCategoriasPadre(): void {
    this.categoriaService.getCategoriasAdmin().subscribe({
      next: (data: CategoriaDTO[]) => {

        // --- ¡¡ESTA ES LA CORRECCIÓN!! ---
        // Filtramos la lista 'data' para quedarnos solo
        // con las categorías que NO tienen padre (idCategoriaPadre es null).
        this.listaCategoriasPadre = data.filter(cat => cat.idCategoriaPadre === null);
        // ---------------------------------

      },
      error: (err: any) => {
        this.error = 'No se pudo cargar la lista de categorías padre.';
      }
    });
  }

  /**
   * Carga los datos de la categoría en el formulario (modo edición)
   */
  cargarCategoria(id: number): void {
    this.categoriaService.getCategoriaPorId(id.toString()).subscribe({
      next: (data: any) => {
        this.categoriaForm.patchValue({
          nombre: data.nombre,
          descripcion: data.descripcion,
          // Seteamos el ID del padre (puede ser null si es una categoría raíz)
          idCategoriaPadre: data.categoriaPadre ? data.categoriaPadre.idCategoria : null
        });
        this.cargando = false;
      },
      error: (err: any) => {
        this.error = 'No se pudo cargar la categoría para editar.';
        this.cargando = false;
      }
    });
  }

  /**
   * Se llama al presionar el botón de Guardar/Crear
   */
  onSubmit(): void {
    if (this.categoriaForm.invalid) {
      this.error = 'El campo "Nombre" es obligatorio.';
      return;
    }
    this.error = null;
    this.cargando = true;

    // Construimos el objeto que la API espera
    const data = this.categoriaForm.value;
    const categoriaData = {
      nombre: data.nombre,
      descripcion: data.descripcion,
      // Construimos el objeto "categoriaPadre" que el backend espera
      categoriaPadre: data.idCategoriaPadre ? { idCategoria: data.idCategoriaPadre } : null
    };


    if (this.esEdicion && this.categoriaId) {
      // --- LÓGICA DE ACTUALIZAR (PUT) ---
      this.categoriaService.updateCategoria(this.categoriaId, categoriaData).subscribe({
        next: () => {
          this.router.navigate(['/admin/categorias']); // Vuelve a la lista
        },
        error: (err: HttpErrorResponse) => {
          this.error = err.error?.message || 'Error al actualizar la categoría.';
          this.cargando = false;
        }
      });
    } else {
      // --- LÓGICA DE CREAR (POST) ---
      this.categoriaService.createCategoria(categoriaData).subscribe({
        next: () => {
          this.router.navigate(['/admin/categorias']); // Vuelve a la lista
        },
        error: (err: HttpErrorResponse) => {
          this.error = err.error?.message || 'Error al crear la categoría.';
          this.cargando = false;
        }
      });
    }
  }
}
