import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router, ActivatedRoute, RouterLink } from '@angular/router';
import { Categoria, CategoriaDTO } from '../../../services/categoria'; // Tu servicio de Categoria
import { HttpErrorResponse } from '@angular/common/http';


interface CategoriaView extends CategoriaDTO {
  nivel?: number;
}

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
  public dropdownOpen: boolean = false;

  // Lista para el dropdown de "Categoría Padre"
  public listaCategoriasPadre: CategoriaView[] = [];

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

  toggleDropdown(): void {
    this.dropdownOpen = !this.dropdownOpen;
  }

  seleccionarPadre(cat: any | null): void {
    // 1. Si elige "Categoría Principal" (Abuelo)
    if (cat === null) {
      this.categoriaForm.patchValue({ idCategoriaPadre: null });
      this.error = null;
      this.dropdownOpen = false;
      return;
    }

    // 2. Validación de nivel (Solo permite hasta nivel 2 como padre)
    if (cat.nivel === 3) {
      this.error = `No puedes seleccionar "${cat.nombre}". La estructura máxima es de 3 niveles y esta ya es una categoría hija.`;
      return;
    }

    // 3. Asigna el ID y cierra el dropdown
    this.categoriaForm.patchValue({ idCategoriaPadre: cat.idCategoria });
    this.error = null;
    this.dropdownOpen = false;
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

  get nombrePadreSeleccionado(): string {
    const idSeleccionado = this.categoriaForm.get('idCategoriaPadre')?.value;
    if (idSeleccionado === null) return '-- Categoría Principal (Abuelo) --';
    const cat = this.listaCategoriasPadre.find(c => c.idCategoria === idSeleccionado);
    if (!cat) return '-- Seleccionar Padre --';

    const nivelStr = (cat as any).nivel === 1 ? '[Abuelo]' : (cat as any).nivel === 2 ? '[Padre]' : '[Hijo]';
    return `${nivelStr} ${cat.nombre}`;
  }

  cargarCategoriasPadre(): void {
    this.categoriaService.getCategoriasAdmin().subscribe({
      next: (data: CategoriaDTO[]) => {
        const todas = data;
        const listaOrdenada: CategoriaDTO[] = [];

        // Función para determinar el nivel
        const obtenerNivel = (cat: CategoriaDTO): number => {
          if (!cat.idCategoriaPadre) return 1;
          const padre = todas.find(p => p.idCategoria === cat.idCategoriaPadre);
          if (padre && !padre.idCategoriaPadre) return 2;
          return 3;
        };

        // --- MAGIA: ORDENAR EN ESTRUCTURA DE ÁRBOL PLANO ---
        const abuelos = todas.filter(c => !c.idCategoriaPadre).sort((a, b) => a.nombre.localeCompare(b.nombre));

        abuelos.forEach(abuelo => {
          // Añadir Abuelo
          listaOrdenada.push({ ...abuelo, nivel: 1 } as any);

          // Buscar y añadir sus Padres
          const papas = todas
            .filter(p => p.idCategoriaPadre === abuelo.idCategoria)
            .sort((a, b) => a.nombre.localeCompare(b.nombre));

          papas.forEach(papa => {
            listaOrdenada.push({ ...papa, nivel: 2 } as any);

            // Buscar y añadir sus Hijos (Nietos)
            const hijos = todas
              .filter(h => h.idCategoriaPadre === papa.idCategoria)
              .sort((a, b) => a.nombre.localeCompare(b.nombre));

            hijos.forEach(hijo => {
              listaOrdenada.push({ ...hijo, nivel: 3 } as any);
            });
          });
        });

        this.listaCategoriasPadre = listaOrdenada;
        this.cargando = false;
      }
    });
  }

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

  onSubmit(): void {
    if (this.categoriaForm.invalid) {
      this.error = 'El campo "Nombre" es obligatorio.';
      return;
    }
    this.error = null;
    this.cargando = true;
    const data = this.categoriaForm.value;
    const categoriaData = {
      nombre: data.nombre,
      descripcion: data.descripcion,
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
