import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router'; // Importa RouterLink
import { Venta } from '../../../services/venta'; // Tu servicio de Venta

@Component({
  selector: 'app-admin-venta-detalle',
  standalone: true,
  imports: [CommonModule, RouterLink], // <-- Importa CommonModule y RouterLink
  templateUrl: './admin-venta-detalle.html',
  styleUrl: './admin-venta-detalle.css'
})
export class AdminVentaDetalleComponent implements OnInit {

  public venta: any = null;
  public cargando: boolean = true;
  public error: string | null = null;

  constructor(
    private route: ActivatedRoute,
    private ventaService: Venta
  ) {}

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id'); // Lee el ID de la URL

    if (id) {
      this.cargando = true;
      this.ventaService.getVentaPorId(id).subscribe({
        next: (data: any) => {
          this.venta = data;
          console.log("Detalle de Venta:", this.venta); // Revisa la consola
          this.cargando = false;
        },
        error: (err: any) => {
          this.error = "No se pudo cargar el detalle de la venta.";
          this.cargando = false;
        }
      });
    } else {
      this.error = "No se proporcionó un ID de venta.";
      this.cargando = false;
    }
  }
}
