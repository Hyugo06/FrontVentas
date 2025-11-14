import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { Categoria, CategoriaDTO } from '../../../services/categoria'; // Tu servicio de Categoria

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

  constructor(private categoriaService: Categoria) {}

  ngOnInit(): void {
    this.cargarCategorias();
  }

  cargarCategorias(): void {
    this.cargando = true;
    this.error = null;

    this.categoriaService.getCategoriasAdmin().subscribe({ // Llama al GET /api/admin/categorias
      next: (data: CategoriaDTO[]) => {
        this.categorias = data;
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
    if (confirm('¿Estás seguro de que quieres eliminar esta categoría? ¡Fallará si está siendo usada por productos!')) {
      this.categoriaService.deleteCategoria(id).subscribe({
        next: () => {
          this.cargarCategorias(); // Recarga la lista
        },
        error: (err: any) => {
          console.error('Error al eliminar categoría:', err);
          this.error = 'Error al eliminar: La categoría está en uso.';
        }
      });
    }
  }
}
