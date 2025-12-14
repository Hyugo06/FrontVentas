import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { Marca, MarcaDTO } from '../../../services/marca';

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

  // --- MÉTODO REUTILIZABLE ---
  cargarMarcas(): void {
    this.cargando = true;
    this.error = null;

    this.marcaService.getMarcas().subscribe({
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

  // Cambia la firma de la función para recibir el objeto completo
  eliminarMarca(marca: MarcaDTO): void { // <--- Cambiado de 'id: number' a 'marca: MarcaDTO'
    if (confirm(`¿Estás seguro de eliminar la marca "${marca.nombre}"?`)) {
      this.cargando = true;

      // Aquí extraemos el ID del objeto
      this.marcaService.deleteMarca(marca.idMarca).subscribe({
        next: () => {
          this.cargarMarcas();
        },
        error: (err: any) => {
          this.cargando = false;
          console.error('Error al eliminar marca:', err);
          this.error = 'No se puede eliminar: Esta marca está asignada a productos.';
        }
      });
    }
  }
}
