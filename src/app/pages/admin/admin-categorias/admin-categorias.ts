import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { Categoria, CategoriaDTO } from '../../../services/categoria'; // Asegúrate que la ruta sea correcta

// Extendemos la interfaz para la vista (añadimos propiedades visuales)
interface CategoriaView extends CategoriaDTO {
  subcategorias?: CategoriaDTO[];
  isOpen?: boolean; // Para controlar el acordeón
}

@Component({
  selector: 'app-admin-categorias',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './admin-categorias.html',
  styleUrl: './admin-categorias.css'
})
export class AdminCategoriasComponent implements OnInit {

  public categoriasArbol: CategoriaView[] = []; // Lista organizada (Padres con hijos dentro)
  public cargando: boolean = true;
  public error: string | null = null;

  constructor(private categoriaService: Categoria) {}

  ngOnInit(): void {
    this.cargarCategorias();
  }

  cargarCategorias(): void {
    this.cargando = true;
    this.categoriaService.getCategoriasAdmin().subscribe({
      next: (data: CategoriaDTO[]) => {
        // --- MAGIA: ORGANIZAR EN ÁRBOL ---
        // 1. Separamos Padres (los que no tienen idCategoriaPadre)
        const padres = data.filter(c => !c.idCategoriaPadre);

        // 2. Separamos Hijos
        const hijos = data.filter(c => c.idCategoriaPadre);

        // 3. Metemos los hijos dentro de sus padres
        this.categoriasArbol = padres.map(padre => {
          const misHijos = hijos.filter(h => h.idCategoriaPadre === padre.idCategoria);
          return {
            ...padre,
            subcategorias: misHijos,
            isOpen: false // Por defecto cerrados
          };
        });

        this.cargando = false;
      },
      error: (err: any) => {
        console.error(err);
        this.error = 'No se pudieron cargar las categorías.';
        this.cargando = false;
      }
    });
  }

  toggleAcordeon(categoria: CategoriaView): void {
    categoria.isOpen = !categoria.isOpen;
  }

  eliminarCategoria(categoria: CategoriaDTO): void {
    if (confirm(`¿Estás seguro de eliminar "${categoria.nombre}"?`)) {
      this.cargando = true;
      this.categoriaService.deleteCategoria(categoria.idCategoria).subscribe({
        next: () => {
          this.cargarCategorias(); // Recargar la lista
        },
        error: (err: any) => {
          this.cargando = false;
          alert('No se puede eliminar: Probablemente tenga productos o subcategorías asociadas.');
        }
      });
    }
  }
}
