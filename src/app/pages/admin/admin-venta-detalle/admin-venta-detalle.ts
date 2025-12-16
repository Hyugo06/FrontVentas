import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { Venta } from '../../../services/venta';
import Swal from 'sweetalert2';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

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
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.cargarVenta(id);
    } else {
      this.error = "No se proporcionó un ID de venta.";
      this.cargando = false;
    }
  }

  cargarVenta(id: string): void {
    this.cargando = true;
    this.ventaService.getVentaPorId(id).subscribe({
      next: (data: any) => {
        // --- AGREGA ESTA LÍNEA ---
        console.log("📦 DATA RECIBIDA DEL BACKEND:", data);
        console.log("🔍 Primer detalle:", data.detalles[0]);
        // -------------------------

        this.venta = data;
        this.cargando = false;
      },
      error: (err: any) => {
        this.error = "No se pudo cargar el detalle de la venta.";
        this.cargando = false;
      }
    });
  }

  public confirmarAnulacion(): void {
    if (!this.venta) return;

    Swal.fire({
      title: '¿Anular esta venta?',
      text: "Al hacerlo, el stock será devuelto al inventario.",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#ef4444',
      cancelButtonColor: '#3085d6',
      confirmButtonText: 'Sí, anular',
      cancelButtonText: 'Cancelar'
    }).then((result) => {
      if (result.isConfirmed) {
        this.ejecutarAnulacion();
      }
    });
  }

  private ejecutarAnulacion(): void {
    this.cargando = true;
    this.ventaService.anularVenta(this.venta.idVenta).subscribe({
      next: (res: any) => {
        this.cargando = false;
        Swal.fire('¡Anulada!', res.mensaje, 'success');
        this.venta.estado = 'ANULADA';
      },
      error: (err: any) => {
        this.cargando = false;
        const mensajeError = err.error?.mensaje || err.error?.error || 'No se pudo anular.';
        Swal.fire('Error', mensajeError, 'error');
      }
    });
  }

  // --- LÓGICA DE PDF CORREGIDA ---
  public generarBoletaPDF(): void {
    if (!this.venta) return;

    try {
      const doc = new jsPDF();
      const venta = this.venta;

      // 1. Encabezado
      doc.setFontSize(22);
      doc.setFont('helvetica', 'bold');
      doc.text('TIENDA MARGARITA', 105, 20, { align: 'center' });

      doc.setFontSize(12);
      doc.setFont('helvetica', 'normal');
      doc.text(`Comprobante de Venta #${venta.idVenta}`, 105, 30, { align: 'center' });

      if (venta.estado === 'ANULADA') {
        doc.setTextColor(220, 38, 38);
        doc.setFont('helvetica', 'bold');
        doc.text('-- VENTA ANULADA --', 105, 40, { align: 'center' });
        doc.setTextColor(0, 0, 0);
        doc.setFont('helvetica', 'normal');
      }

      // 2. Datos del Cliente
      const fecha = new Date(venta.fecha).toLocaleString('es-PE'); // 'fecha' viene del DTO
      const clienteNombre = venta.nombreCliente || 'Cliente General';
      const dni = venta.dniCliente || '-';

      doc.setFontSize(10);
      doc.text(`Fecha: ${fecha}`, 14, 50);
      doc.text(`Cliente: ${clienteNombre}`, 14, 56);
      doc.text(`DNI/RUC: ${dni}`, 14, 62);

      // 3. Tabla de Productos
      const head = [['Cant.', 'Descripción', 'Talla', 'Color', 'P. Unit', 'Total']];

      const body = venta.detalles.map((item: any) => {
        return [
          item.cantidad,
          item.producto,             // Nombre
          item.talla || '-',         // Talla
          item.color || '-',         // Color
          `S/ ${item.precioUnitario.toFixed(2)}`,
          `S/ ${item.subtotal.toFixed(2)}`
        ];
      });

      autoTable(doc, {
        startY: 75,
        head: head,
        body: body,
        theme: 'grid',
        headStyles: { fillColor: [79, 70, 229] },
        styles: { fontSize: 9 },
      });

      // Total y Descuento
      let finalY = (doc as any).lastAutoTable.finalY + 10;

      if(venta.montoDescuento > 0){
        doc.setFontSize(10);
        doc.setTextColor(22, 163, 74); // Verde
        doc.text(`Descuento (${venta.codigoCupon}): - S/ ${venta.montoDescuento.toFixed(2)}`, 195, finalY, { align: 'right' });
        finalY += 6;
        doc.setTextColor(0,0,0);
      }

      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.text(`TOTAL A PAGAR:  S/ ${venta.total.toFixed(2)}`, 195, finalY, { align: 'right' });

      const pdfBlob = doc.output('blob');
      const url = URL.createObjectURL(pdfBlob);
      window.open(url, '_blank');

    } catch (error) {
      console.error("Error generando PDF:", error);
      Swal.fire('Error', 'Hubo un problema al generar el PDF.', 'error');
    }
  }
}
