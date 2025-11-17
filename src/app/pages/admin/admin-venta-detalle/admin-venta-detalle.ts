import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { Venta } from '../../../services/venta';

// --- ¡CORRECCIÓN DE IMPORTACIÓN DE PDF! ---
import jsPDF from 'jspdf';
// Importamos 'autoTable' como una función separada
import autoTable from 'jspdf-autotable';
// ------------------------------------

@Component({
  selector: 'app-admin-venta-detalle',
  standalone: true,
  imports: [CommonModule, RouterLink],
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
    // ... (tu ngOnInit está perfecto) ...
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.cargando = true;
      this.ventaService.getVentaPorId(id).subscribe({
        next: (data: any) => {
          this.venta = data;
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
  public generarBoletaPDF(): void {
    if (!this.venta) return;

    const doc = new jsPDF();
    const venta = this.venta;

    // 1. Título (Sin cambios)
    doc.setFontSize(22);
    doc.setFont('helvetica', 'bold');
    doc.text('Boleta de Venta', 105, 20, { align: 'center' });
    doc.text(`Venta #${venta.idVenta}`, 105, 30, { align: 'center' });

    // 2. Información del Cliente y Venta (¡Con el cambio!)
    doc.setFontSize(11);
    doc.setFont('helvetica', 'normal');

    doc.text('Cliente:', 14, 50);
    doc.text(`${venta.cliente?.nombres || ''} ${venta.cliente?.apellidos || ''}`, 50, 50);

    doc.text('DNI:', 14, 56);
    doc.text(venta.cliente?.dni || 'N/A', 50, 56);

    doc.text('Fecha:', 14, 62);
    doc.text(new Date(venta.fechaVenta).toLocaleString('es-PE'), 50, 62);

    // --- ¡¡AQUÍ ESTÁ LA CORRECCIÓN!! ---
    // Combinamos 'nombres' y 'apellidos' del vendedor
    const nombreVendedor = `${venta.usuario?.nombres || ''} ${venta.usuario?.apellidos || ''}`;

    doc.text('Vendedor:', 120, 50);
    // Usamos la nueva variable. Si está vacía (ej. para un admin antiguo),
    // usamos el username como respaldo.
    doc.text(nombreVendedor.trim() || venta.usuario?.nombreUsuario || 'N/A', 140, 50);
    // --- FIN DE LA CORRECCIÓN ---

    // 3. Preparar los datos para la Tabla (Sin cambios)
    const head = [['SKU', 'Producto', 'Cant.', 'P. Unit.', 'Subtotal']];
    const body = venta.detalles.map((item: any) => [
      item.producto?.codigoSku || 'N/A',
      item.producto?.nombre || 'N/A',
      item.cantidad,
      `S/ ${item.precioUnitario.toFixed(2)}`,
      `S/ ${item.subtotal.toFixed(2)}`
    ]);

    // 4. Dibujar la Tabla (Sin cambios)
    autoTable(doc, {
      startY: 75,
      head: head,
      body: body,
      theme: 'grid',
      headStyles: { fillColor: [22, 160, 133] }
    });

    // 5. Dibujar el Total (Sin cambios)
    const finalY = (doc as any).lastAutoTable.finalY;
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('MONTO TOTAL:', 130, finalY + 15);
    doc.text(`S/ ${venta.montoTotal.toFixed(2)}`, 170, finalY + 15);

    // 6. Guardar el archivo (Sin cambios)
    doc.save(`Boleta_Venta_#${venta.idVenta}.pdf`);
  }
}
