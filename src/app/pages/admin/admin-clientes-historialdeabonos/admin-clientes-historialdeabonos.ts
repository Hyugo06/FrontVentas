import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import Swal from 'sweetalert2';
// Asegúrate de que la ruta al servicio 'cliente' sea la correcta
import { Cliente, ClienteService, Movimiento } from '../../../services/cliente';

@Component({
  selector: 'app-admin-clientes-historialdeabonos',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './admin-clientes-historialdeabonos.html',
  styleUrl: './admin-clientes-historialdeabonos.css'
})
export class AdminClientesHistorialdeabonosComponent implements OnInit {

  public cliente: Cliente | null = null;
  public movimientos: Movimiento[] = [];
  public saldoActual: number = 0;
  public cargando: boolean = true;

  constructor(
    private route: ActivatedRoute,
    private clienteService: ClienteService
  ) {}

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.cargarDatos(+id);
    }
  }

  cargarDatos(id: number): void {
    this.cargando = true;

    // 1. Obtenemos datos del cliente (Nombre, DNI...)
    this.clienteService.getClientePorId(id).subscribe(c => this.cliente = c);

    // 2. Obtenemos el historial de movimientos
    this.clienteService.getHistorialCliente(id).subscribe({
      next: (data) => {
        // Ordenamos: El movimiento más reciente primero
        this.movimientos = data.sort((a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime());
        this.calcularSaldo();
        this.cargando = false;
      },
      error: () => this.cargando = false
    });
  }

  calcularSaldo(): void {
    // Sumamos todas las DEUDAS y restamos los PAGOS
    this.saldoActual = this.movimientos.reduce((acc, mov) => {
      return mov.tipo === 'DEUDA' ? acc + mov.monto : acc - mov.monto;
    }, 0);
  }

  // --- FUNCIÓN PARA REGISTRAR (FIADO O ABONO) ---
  async abrirModalMovimiento(tipo: 'DEUDA' | 'PAGO') {
    const esDeuda = tipo === 'DEUDA';

    // Personalización del Popup según el tipo de acción
    const titulo = esDeuda ? 'Registrar Fiado (Aumentar Deuda)' : 'Registrar Abono (Pago)';
    const colorBtn = esDeuda ? '#ef4444' : '#4f46e5'; // Rojo o Indigo

    const { value: formValues } = await Swal.fire({
      title: titulo,
      html: `
        <div class="text-left space-y-3 mt-4">
          <div>
            <label class="block text-xs font-bold text-gray-500 mb-1">Monto (S/)</label>
            <input id="swal-monto" type="number" step="0.10" class="swal2-input m-0 w-full" placeholder="0.00">
          </div>

          <div>
            <label class="block text-xs font-bold text-gray-500 mb-1">Concepto / Detalle</label>
            <input id="swal-concepto" class="swal2-input m-0 w-full" placeholder="${esDeuda ? 'Ej: Zapatillas Nike, Arroz, etc.' : 'Ej: Pago Yape, Efectivo'}">
          </div>

          <div>
            <label class="block text-xs font-bold text-gray-500 mb-1">Comprobante / Operación (Opcional)</label>
            <input id="swal-comprobante" class="swal2-input m-0 w-full" placeholder="Ej: OP-12345">
          </div>
        </div>
      `,
      focusConfirm: false,
      showCancelButton: true,
      confirmButtonColor: colorBtn,
      confirmButtonText: 'Guardar Movimiento',
      cancelButtonText: 'Cancelar',
      preConfirm: () => {
        const monto = (document.getElementById('swal-monto') as HTMLInputElement).value;
        const concepto = (document.getElementById('swal-concepto') as HTMLInputElement).value;
        const comprobante = (document.getElementById('swal-comprobante') as HTMLInputElement).value;

        if (!monto || parseFloat(monto) <= 0) {
          Swal.showValidationMessage('Por favor ingresa un monto válido');
          return false;
        }
        if (!concepto) {
          Swal.showValidationMessage('El concepto es obligatorio');
          return false;
        }
        return { monto: parseFloat(monto), concepto, comprobante };
      }
    });

    if (formValues && this.cliente) {

      // 1. Preparamos el objeto para enviar al Backend
      // (Nota: No enviamos fecha ni ID, el backend los genera)
      const movimientoParaGuardar = {
        tipo: tipo,
        monto: formValues.monto,
        comentario: formValues.concepto,
        comprobante: formValues.comprobante
      };

      // 2. LLAMADA REAL AL SERVIDOR
      this.clienteService.registrarMovimiento(this.cliente.idCliente, movimientoParaGuardar).subscribe({
        next: (nuevoMovimiento) => {

          // ÉXITO: El backend respondió que guardó bien.
          // Agregamos el movimiento real a la lista visual
          this.movimientos.unshift({
            idMovimiento: nuevoMovimiento.idMovimiento, // El ID real que dio la BD
            tipo: tipo,
            monto: formValues.monto,
            fecha: new Date().toISOString(), // Usamos la fecha actual para mostrar ya
            comentario: formValues.concepto,
            comprobante: formValues.comprobante
          });

          // Actualizamos el saldo visual
          this.calcularSaldo();

          // Mensaje de Éxito
          Swal.fire({
            title: '¡Registrado!',
            text: 'El movimiento se ha guardado correctamente en la base de datos.',
            icon: 'success',
            timer: 2000,
            showConfirmButton: false
          });
        },
        error: (err) => {
          console.error(err);
          Swal.fire('Error', 'No se pudo guardar el movimiento en el servidor.', 'error');
        }
      });
    }
  }
}
