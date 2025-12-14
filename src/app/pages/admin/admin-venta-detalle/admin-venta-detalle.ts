import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { Venta } from '../../../services/venta';
import Swal from 'sweetalert2'; // Importamos SweetAlert para errores

// --- IMPORTS DE PDF ---
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
// ----------------------

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
        this.venta = data;
        this.cargando = false;
      },
      error: (err: any) => {
        this.error = "No se pudo cargar el detalle de la venta.";
        this.cargando = false;
      }
    });
  }

  // --- LÓGICA DE ANULACIÓN (La que hicimos antes) ---
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

  // --- LÓGICA DE PDF MEJORADA ---
  public generarBoletaPDF(): void {
    console.log("--> Iniciando generación de PDF..."); // CHIVATO 1

    if (!this.venta) {
      console.warn("--> No hay datos de venta cargados.");
      return;
    }

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

      // Estado (Si está anulada, lo ponemos en rojo en el PDF)
      if (venta.estado === 'ANULADA') {
        doc.setTextColor(220, 38, 38); // Rojo
        doc.setFont('helvetica', 'bold');
        doc.text('-- VENTA ANULADA --', 105, 40, { align: 'center' });
        doc.setTextColor(0, 0, 0); // Reset a negro
        doc.setFont('helvetica', 'normal');
      }

      // 2. Datos del Cliente y Fecha
      const fecha = new Date(venta.fechaVenta).toLocaleString('es-PE');
      const clienteNombre = `${venta.cliente?.nombres || 'Cliente'} ${venta.cliente?.apellidos || 'General'}`;
      const dni = venta.cliente?.dni || '-';

      // Combinar nombre de vendedor
      const vendedorNombre = `${venta.usuario?.nombres || ''} ${venta.usuario?.apellidos || venta.usuario?.nombreUsuario || 'Sistema'}`;

      doc.setFontSize(10);
      doc.text(`Fecha: ${fecha}`, 14, 50);
      doc.text(`Cliente: ${clienteNombre}`, 14, 56);
      doc.text(`DNI/RUC: ${dni}`, 14, 62);
      doc.text(`Atendido por: ${vendedorNombre}`, 14, 68);

      // 3. Tabla de Productos
      const head = [['Cant.', 'SKU', 'Producto', 'P. Unit', 'Subtotal']];

      const body = venta.detalles.map((item: any) => {
        let nombreProd = item.producto?.nombre || 'Producto';
        // Agregar variante si existe
        if (item.variante) {
          nombreProd += ` (${item.variante.color} / ${item.variante.talla})`;
        }

        return [
          item.cantidad,
          item.producto?.codigoSku || '-',
          nombreProd,
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

      const finalY = (doc as any).lastAutoTable.finalY + 10;
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.text(`TOTAL A PAGAR:  S/ ${venta.montoTotal.toFixed(2)}`, 195, finalY, { align: 'right' });

      console.log("--> Generando Blob para móvil...");

      const pdfBlob = doc.output('blob');
      const url = URL.createObjectURL(pdfBlob);

      window.open(url, '_blank');
    } catch (error) {
      console.error("--> ERROR GENERANDO PDF:", error);
      Swal.fire('Error', 'Hubo un problema al generar el PDF.', 'error');
    }
  }
}
