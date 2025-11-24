import { Component, OnInit } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common'; // Importamos DatePipe
import { Router, RouterLink } from '@angular/router'; // Importamos Router y RouterLink
import { Venta } from '../../../services/venta';

@Component({
  selector: 'app-admin-metrics',
  standalone: true,
  imports: [CommonModule, RouterLink], // Añadimos RouterLink
  providers: [DatePipe], // Proveedor para formatear fechas si es necesario
  templateUrl: './admin-metrics.html',
  styleUrl: './admin-metrics.css'
})
export class AdminMetricsComponent implements OnInit {

  public metricas: any = null;
  public cargando: boolean = true;

  // Variables para los títulos dinámicos
  public labelHoy: string = '';
  public labelMes: string = '';

  constructor(
    private ventaService: Venta,
    private router: Router,
    private datePipe: DatePipe
  ) {}

  ngOnInit(): void {
    this.configurarEtiquetasFecha();

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

  /**
   * Genera los textos dinámicos para las tarjetas (Ej: "24/11/25", "NOV")
   */
  configurarEtiquetasFecha(): void {
    const hoy = new Date();

    // Formato dd/MM/yy (Ej: 24/11/25)
    const dia = hoy.getDate().toString().padStart(2, '0');
    const mesNum = (hoy.getMonth() + 1).toString().padStart(2, '0');
    const anio = hoy.getFullYear().toString().slice(-2);
    this.labelHoy = `${dia}/${mesNum}/${anio}`;

    // Nombre del mes abreviado (Ej: NOV)
    const meses = ['ENE', 'FEB', 'MAR', 'ABR', 'MAY', 'JUN', 'JUL', 'AGO', 'SET', 'OCT', 'NOV', 'DIC'];
    this.labelMes = meses[hoy.getMonth()];
  }

  /**
   * Navega al historial de ventas aplicando los filtros de fecha automáticamente.
   */
  verVentas(periodo: 'hoy' | 'semana' | 'mes'): void {
    const hoy = new Date();
    let inicio = '';
    let fin = '';

    // Helper para formatear a YYYY-MM-DD (formato que acepta el input date y el backend)
    const toIsoDate = (date: Date) => {
      const y = date.getFullYear();
      const m = (date.getMonth() + 1).toString().padStart(2, '0');
      const d = date.getDate().toString().padStart(2, '0');
      return `${y}-${m}-${d}`;
    };

    if (periodo === 'hoy') {
      inicio = toIsoDate(hoy);
      fin = toIsoDate(hoy);
    } else if (periodo === 'semana') {
      // Calcular el Lunes de esta semana
      const diaSemana = hoy.getDay() || 7; // 1=Lunes ... 7=Domingo
      const lunes = new Date(hoy);
      lunes.setDate(hoy.getDate() - diaSemana + 1);

      // Calcular el Domingo
      const domingo = new Date(lunes);
      domingo.setDate(lunes.getDate() + 6);

      inicio = toIsoDate(lunes);
      fin = toIsoDate(domingo);
    } else if (periodo === 'mes') {
      // Primer día del mes
      const primerDia = new Date(hoy.getFullYear(), hoy.getMonth(), 1);
      // Último día del mes
      const ultimoDia = new Date(hoy.getFullYear(), hoy.getMonth() + 1, 0);

      inicio = toIsoDate(primerDia);
      fin = toIsoDate(ultimoDia);
    }

    // Navegar pasando los parámetros en la URL
    this.router.navigate(['/admin/ventas'], {
      queryParams: {
        fechaInicio: inicio,
        fechaFin: fin
      }
    });
  }
}
