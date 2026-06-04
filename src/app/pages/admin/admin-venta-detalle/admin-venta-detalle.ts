import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { Venta } from '../../../services/venta';
import Swal from 'sweetalert2';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

// 1. IMPORTS DE CAPACITOR (NUEVOS)
import { Capacitor } from '@capacitor/core';
import { Filesystem, Directory } from '@capacitor/filesystem';
import { Share } from '@capacitor/share';

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
        console.log("📦 DATA RECIBIDA DEL BACKEND:", data);
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

  // --- LÓGICA DE PDF HÍBRIDA (WEB Y MÓVIL) ---
  public async generarBoletaPDF() {
    if (!this.venta) return;

    try {
      const doc = new jsPDF();
      const venta = this.venta;

      doc.setDrawColor(0);
      doc.setLineWidth(0.5);
      doc.rect(10, 10, 190, 130 + (venta.detalles.length * 8)); // Altura dinámica

      const logoUrl = 'assets/image.png';
      try {
        const logoData = await this.getBase64ImageFromUrl(logoUrl);
        // Ajusta los valores (X, Y, Ancho, Alto) según las proporciones de tu logo
        doc.addImage(logoData, 'PNG', 15, 15, 80, 25);
      } catch (e) {
        console.warn('No se pudo cargar el logo. Verifica la ruta: assets/image.png');
        // Fallback si no carga el logo
        doc.setFontSize(24);
        doc.setFont('times', 'italic');
        doc.text('Margarita', 15, 30);
      }

      // --- INFORMACIÓN DE LA EMPRESA (Debajo del logo) ---
      doc.setFontSize(8);
      doc.setFont('helvetica', 'normal');
      doc.text('Ropa para su comodidad & De todo para su hogar', 15, 45);
      doc.text('Sábanas, colchas, almohadas, y moda hombre/mujer.', 15, 50);
      // Aquí puedes agregar la dirección y teléfono reales de tu tienda
      doc.text('Dirección: Av. Oscar Ramos Cabieses, Pasadizo de la puerta 4 - Imperial - Cañete', 15, 55);
      doc.text('Telf. 900-944-156', 15, 60);

      // --- RECUADRO DE RUC Y NÚMERO DE BOLETA (Esquina superior derecha) ---
      doc.setLineWidth(0.5);
      doc.roundedRect(120, 15, 75, 25, 3, 3); // Caja principal redondeada
      doc.line(120, 23, 195, 23); // Línea divisoria 1
      doc.line(120, 31, 195, 31); // Línea divisoria 2

      doc.setFontSize(11);
      doc.setFont('helvetica', 'bold');
      // Coloca tu RUC real aquí
      doc.text('R.U.C. 10092688131', 157.5, 21, { align: 'center' });

      const tipoDoc = venta.tipoComprobante === 'FACTURA' ? 'FACTURA ELECTRÓNICA' : 'BOLETA DE VENTA';
      doc.text(tipoDoc, 157.5, 29, { align: 'center' });

      doc.setFontSize(12);
      doc.text(`001 - ${venta.idVenta.toString().padStart(6, '0')}`, 157.5, 38, { align: 'center' });

      // --- RECUADRO DE FECHA (Debajo del RUC) ---
      const fechaObj = new Date(venta.fecha);
      const dia = fechaObj.getDate().toString().padStart(2, '0');
      const mes = (fechaObj.getMonth() + 1).toString().padStart(2, '0');
      const anio = fechaObj.getFullYear().toString();
      const hora = fechaObj.toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit' });

      doc.rect(140, 45, 55, 10);
      doc.line(158, 45, 158, 55);
      doc.line(176, 45, 176, 55);

      doc.setFontSize(7);
      doc.setFont('helvetica', 'bold');
      doc.text('DIA', 149, 49, { align: 'center' });
      doc.text('MES', 167, 49, { align: 'center' });
      doc.text('AÑO', 185, 49, { align: 'center' });

      doc.setFont('helvetica', 'normal');
      doc.text(dia, 149, 53, { align: 'center' });
      doc.text(mes, 167, 53, { align: 'center' });
      doc.text(anio, 185, 53, { align: 'center' });

      // --- DATOS DEL CLIENTE ---
      doc.setFontSize(10);
      const clienteNombre = venta.nombreCliente || 'Cliente General';
      const documento = venta.dniCliente || '-';

      doc.text('Señor(es):', 15, 70);
      // Línea punteada
      doc.setLineDashPattern([1, 1], 0);
      doc.line(35, 71, 190, 71);
      doc.text(clienteNombre, 37, 70);

      doc.text('DNI/RUC:', 15, 78);
      doc.line(35, 79, 100, 79);
      doc.text(documento, 37, 78);

      doc.text('Hora:', 110, 78);
      doc.line(120, 79, 190, 79);
      doc.text(hora, 122, 78);

      // Restaurar línea sólida para la tabla
      doc.setLineDashPattern([], 0);

      // --- TABLA DE PRODUCTOS (Estilo clásico) ---
      const startY = 85;

      // Configuración de la tabla con AutoTable pero forzando el estilo clásico
      const head = [['CANT.', 'DESCRIPCION', 'TALLA/COLOR', 'P. UNIT.', 'IMPORTE']];
      const body = venta.detalles.map((item: any) => [
        item.cantidad,
        item.producto.toUpperCase(),
        `${item.talla !== 'U' && item.talla ? item.talla : ''} ${item.color !== '-' && item.color ? item.color : ''}`.trim() || '-',
        item.precioUnitario.toFixed(2),
        item.subtotal.toFixed(2)
      ]);

      autoTable(doc, {
        startY: startY,
        head: head,
        body: body,
        theme: 'grid', // Borde en todas las celdas
        styles: {
          font: 'helvetica',
          fontSize: 8,
          textColor: 0,
          lineColor: 0,
          lineWidth: 0.5
        },
        headStyles: {
          fillColor: 255, // Fondo blanco
          textColor: 0,   // Letra negra
          fontStyle: 'bold',
          halign: 'center'
        },
        columnStyles: {
          0: { halign: 'center', cellWidth: 15 }, // Cantidad
          1: { halign: 'left', cellWidth: 85 },  // Descripcion
          2: { halign: 'center', cellWidth: 35 }, // Talla/Color
          3: { halign: 'right', cellWidth: 25 },  // P. Unit
          4: { halign: 'right', cellWidth: 25 }   // Importe
        },
        margin: { left: 10, right: 10 }
      });

      // --- ZONA DE TOTALES ---
      let finalY = (doc as any).lastAutoTable.finalY;

      // Dibujar caja de total al estilo de tu imagen
      doc.setFontSize(10);
      doc.setFont('helvetica', 'bold');

      if(venta.montoDescuento > 0){
        doc.text(`DSCTO. S/`, 155, finalY + 6, { align: 'right' });
        doc.rect(157, finalY + 1, 38, 7);
        doc.setFont('helvetica', 'normal');
        doc.text(`-${venta.montoDescuento.toFixed(2)}`, 193, finalY + 6, { align: 'right' });
        finalY += 7;
      }

      doc.setFont('helvetica', 'bold');
      doc.text(`TOTAL S/`, 155, finalY + 6, { align: 'right' });
      doc.rect(157, finalY + 1, 38, 7);
      doc.text(venta.total.toFixed(2), 193, finalY + 6, { align: 'right' });

      // --- MENSAJE FINAL (Centrado y cursiva) ---
      doc.setFontSize(11);
      doc.setFont('times', 'italic');
      doc.text('GRACIAS POR SU PREFERENCIA...', 105, finalY + 15, { align: 'center' });

      // SELLO DE ANULADA (Si aplica)
      if (venta.estado === 'ANULADA') {
        doc.setTextColor(220, 38, 38);
        doc.setFontSize(40);
        doc.setFont('helvetica', 'bold');
        // Texto rotado en el centro de la página
        doc.text('ANULADA', 105, 150, { align: 'center', angle: 45, opacity: 0.3 } as any);
      }

      const nombreArchivo = `Comprobante-${venta.idVenta}.pdf`;

      if (Capacitor.isNativePlatform()) {
        const base64Data = doc.output('datauristring').split(',')[1];
        const result = await Filesystem.writeFile({
          path: nombreArchivo,
          data: base64Data,
          directory: Directory.Cache
        });

        await Share.share({
          title: `Comprobante #${venta.idVenta}`,
          text: 'Adjunto el comprobante de venta.',
          url: result.uri,
          dialogTitle: 'Descargar Comprobante'
        });

      } else {
        doc.save(nombreArchivo);
      }

    } catch (error) {
      console.error("Error generando PDF:", error);
      Swal.fire('Error', 'Hubo un problema al generar el PDF.', 'error');
    }
  }

  // --- FUNCIÓN AUXILIAR PARA CARGAR EL LOGO ---
  // Añade esta función justo debajo de generarBoletaPDF()
  private getBase64ImageFromUrl(imageUrl: string): Promise<string> {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.crossOrigin = 'Anonymous';
      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error('No se pudo obtener el contexto 2D'));
          return;
        }
        ctx.drawImage(img, 0, 0);
        const dataURL = canvas.toDataURL('image/png');
        resolve(dataURL);
      };
      img.onerror = error => reject(error);
      img.src = imageUrl;
    });
  }
}
