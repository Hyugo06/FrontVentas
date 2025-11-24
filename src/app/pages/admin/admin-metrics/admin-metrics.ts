import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Venta } from '../../../services/venta';

@Component({
  selector: 'app-admin-metrics',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './admin-metrics.html',
  styleUrl: './admin-metrics.css'
})
export class AdminMetricsComponent implements OnInit {

  public metricas: any = null;
  public cargando: boolean = true;

  constructor(private ventaService: Venta) {}

  ngOnInit(): void {
    this.ventaService.getMetricas().subscribe({
      next: (data) => {
        this.metricas = data;
        this.cargando = false;
      },
      error: (err) => {
        console.error('Error obteniendo métricas:', err);
        this.cargando = false;
      }
    });
  }
}
