import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { Categoria, CategoriaDTO } from '../../../services/categoria';

interface CategoriaTree extends CategoriaDTO {
  children?: CategoriaDTO[];
  isOpen?: boolean;
}

@Component({
  selector: 'app-admin-categorias',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './admin-categorias.html',
  styleUrl: './admin-categorias.css'
})
export class AdminCategoriasComponent implements OnInit {

  public categorias: CategoriaDTO[] = [];
  public cargando: boolean = true;
  public error: string | null = null;
  public categoriasTree: CategoriaTree[] = [];

  constructor(private categoriaService: Categoria) {}

  ngOnInit(): void {
    this.cargarCategorias();
  }

  // --- MÉTODO REUTILIZABLE ---
  cargarCategorias(): void {
    this.cargando = true;
    this.error = null;

    this.categoriaService.getCategoriasAdmin().subscribe({
      next: (data: CategoriaDTO[]) => {
        this.categorias = data;
        // Reconstruimos el árbol desde cero con los datos frescos
        const padres = data.filter(c => !c.idCategoriaPadre) as CategoriaTree[];
        padres.forEach(padre => {
          padre.children = data.filter(c => c.idCategoriaPadre === padre.idCategoria);
          padre.isOpen = false; // Opcional: Podrías guardar el estado abierto si quisieras ser muy pro
        });
        this.categoriasTree = padres;
        this.cargando = false;
      },
      error: (err: any) => {
        console.error('Error cargando categorías:', err);
        this.error = 'No se pudieron cargar las categorías.';
        this.cargando = false;
      }
    });
  }

  eliminarCategoria(id: number): void {
    if (confirm('¿Eliminar categoría?')) {
      this.cargando = true; // Feedback visual

      this.categoriaService.deleteCategoria(id).subscribe({
        next: () => {
          // --- RECARGA AUTOMÁTICA ---
          this.cargarCategorias();
        },
        error: (err: any) => {
          this.cargando = false;
          console.error('Error al eliminar categoría:', err);
          this.error = 'No se puede eliminar: La categoría tiene subcategorías o productos asignados.';
        }
      });
    }
  }
}
