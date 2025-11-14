import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { Marca, MarcaDTO } from '../../../services/marca'; // Tu servicio de Marca

@Component({
  selector: 'app-admin-marcas',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './admin-marcas.html',
  styleUrl: './admin-marcas.css'
})
export class AdminMarcasComponent implements OnInit {

  public marcas: MarcaDTO[] = [];
  public cargando: boolean = true;
  public error: string | null = null;

  constructor(private marcaService: Marca) {}

  ngOnInit(): void {
    this.cargarMarcas();
  }

  cargarMarcas(): void {
    this.cargando = true;
    this.error = null;

    this.marcaService.getMarcas().subscribe({ // Llama al GET /api/marcas
      next: (data: MarcaDTO[]) => {
        this.marcas = data;
        this.cargando = false;
      },
      error: (err: any) => {
        console.error('Error cargando marcas:', err);
        this.error = 'No se pudieron cargar las marcas.';
        this.cargando = false;
      }
    });
  }

  eliminarMarca(id: number): void {
    if (confirm('¿Estás seguro de que quieres eliminar esta marca? (Esto podría fallar si está en uso por un producto)')) {
      this.marcaService.deleteMarca(id).subscribe({
        next: () => {
          this.cargarMarcas(); // Recarga la lista
        },
        error: (err: any) => {
          console.error('Error al eliminar marca:', err);
          this.error = 'Error al eliminar: ' + (err.error?.message || 'Error desconocido');
        }
      });
    }
  }
}
