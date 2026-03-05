import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { Categoria, CategoriaDTO } from '../../../services/categoria'; // Asegúrate que la ruta sea correcta

// Extendemos la interfaz para la vista (añadimos propiedades visuales)
interface CategoriaView extends CategoriaDTO {
  subcategorias?: CategoriaView[]; // Cambiamos CategoriaDTO por CategoriaView
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

  public categoriasArbol: CategoriaView[] = []; // Lista organizada (Padres con hijos dentro)
  public cargando: boolean = true;
  public error: string | null = null;
  public showModalEliminar: boolean = false;
  public categoriaAEliminar: CategoriaDTO | null = null;

  constructor(private categoriaService: Categoria) {}

  ngOnInit(): void {
    this.cargarCategorias();
  }

  abrirModalEliminar(categoria: CategoriaDTO): void {
    this.categoriaAEliminar = categoria;
    this.showModalEliminar = true;
  }

  cerrarModal(): void {
    this.showModalEliminar = false;
    this.categoriaAEliminar = null;
  }

  confirmarEliminacion(): void {
    if (this.categoriaAEliminar) {
      this.cargando = true;
      this.categoriaService.deleteCategoria(this.categoriaAEliminar.idCategoria).subscribe({
        next: () => {
          this.cargarCategorias(); // Recargar lista
          this.cerrarModal();
        },
        error: (err: any) => {
          this.cargando = false;
          this.cerrarModal();
          alert('No se puede eliminar: Probablemente tenga productos o subcategorías asociadas.');
        }
      });
    }
  }

  cargarCategorias(): void {
    this.cargando = true;
    this.categoriaService.getCategoriasAdmin().subscribe({
      next: (data: CategoriaDTO[]) => {
        const abuelos = data.filter(c => !c.idCategoriaPadre);
        const papas = data.filter(c => c.idCategoriaPadre);
        this.categoriasArbol = abuelos.map(abuelo => {
          const susPapas = papas.filter(p => p.idCategoriaPadre === abuelo.idCategoria);
          const papasConHijos = susPapas.map(papa => {
            const hijos = data.filter(h => h.idCategoriaPadre === papa.idCategoria);
            return { ...papa, subcategorias: hijos as CategoriaView[], isOpen: false };
          });

          return { ...abuelo, subcategorias: papasConHijos, isOpen: false };
        });
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
