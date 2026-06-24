import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import Swal from 'sweetalert2';
// Asegúrate de que la ruta al servicio 'cliente' sea la correcta
import { Cliente, ClienteService, Movimiento } from '../../../services/cliente';


interface MovimientoView extends Movimiento {
  registradoPor?: string;
}


@Component({
  selector: 'app-admin-clientes-historialdeabonos',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './admin-clientes-historialdeabonos.html',
  styleUrl: './admin-clientes-historialdeabonos.css'
})
export class AdminClientesHistorialdeabonosComponent implements OnInit {

  public cliente: Cliente | null = null;
  public movimientos: MovimientoView[] = [];
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

  // --- FUNCIÓN PARA REGISTRAR (FIADO O ABONO) CON COMPATIBILIDAD DARK MODE ---
  // --- FUNCIÓN PARA REGISTRAR (FIADO O ABONO) CON COMPATIBILIDAD DARK MODE ---
  async abrirModalMovimiento(tipo: 'DEUDA' | 'PAGO') {
    const esDeuda = tipo === 'DEUDA';

    const titulo = esDeuda ? 'Registrar Fiado (Aumentar Deuda)' : 'Registrar Abono (Pago)';
    const colorBtn = esDeuda ? '#ef4444' : '#4f46e5';

    const { value: formValues } = await Swal.fire({
      title: titulo,
      html: `
        <div class="text-left space-y-3 mt-4">
          <div>
            <label class="block text-xs font-bold text-slate-400 mb-1 uppercase tracking-wider">Monto (S/)</label>
            <input id="swal-monto" type="number" step="0.10" class="swal2-input m-0 w-full rounded-xl bg-slate-50 border border-slate-200 text-slate-800 p-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all font-mono" placeholder="0.00">
          </div>

          <div>
            <label class="block text-xs font-bold text-slate-400 mb-1 uppercase tracking-wider">Concepto / Detalle</label>
            <input id="swal-concepto" class="swal2-input m-0 w-full rounded-xl bg-slate-50 border border-slate-200 text-slate-800 p-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all font-medium" placeholder="${esDeuda ? 'Ej: Zapatillas Nike, Casaca' : 'Ej: Pago Yape, Efectivo'}">
          </div>
          </div>
      `,
      focusConfirm: false,
      showCancelButton: true,
      confirmButtonColor: colorBtn,
      confirmButtonText: 'Guardar Movimiento',
      cancelButtonText: 'Cancelar',
      customClass: {
        popup: 'rounded-2xl border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100',
        title: 'text-lg font-bold text-slate-800 dark:text-white pt-2',
        actions: 'mt-4 gap-2',
        confirmButton: 'font-bold text-sm px-5 py-2.5 rounded-xl text-white shadow-md transition-all',
        cancelButton: 'font-bold text-sm px-5 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700 transition-all'
      },
      buttonsStyling: false,
      preConfirm: () => {
        const monto = (document.getElementById('swal-monto') as HTMLInputElement).value;
        const concepto = (document.getElementById('swal-concepto') as HTMLInputElement).value;

        document.querySelectorAll('.swal2-input').forEach(input => {
          input.classList.add('dark:bg-slate-950', 'dark:border-slate-800', 'dark:text-white', 'focus:ring-2', 'focus:ring-indigo-500');
        });

        if (!monto || parseFloat(monto) <= 0) {
          Swal.showValidationMessage('Por favor ingresa un monto válido');
          return false;
        }
        if (!concepto) {
          Swal.showValidationMessage('El concepto es obligatorio');
          return false;
        }
        return { monto: parseFloat(monto), concepto };
      }
    });

    if (formValues && this.cliente) {

      const nombreRealCajero = localStorage.getItem('nombreUsuarioReal') || 'Usuario Sistema';

      // 🌟 GENERADOR CORRELATIVO AUTOMÁTICO INDIVIDUAL POR CLIENTE:
      // Calculamos el número consecutivo sumando 1 a la cantidad de movimientos previos en la lista
      const siguienteCorrelativo = this.movimientos.length + 1;
      const comprobanteAutogenerado = `N° ${String(siguienteCorrelativo).padStart(4, '0')}`;

      const movimientoParaGuardar = {
        tipo: tipo,
        monto: formValues.monto,
        comentario: formValues.concepto,
        comprobante: comprobanteAutogenerado, // 👈 Se manda formateado como "N° 0001", "N° 0002"...
        registradoPor: nombreRealCajero
      };

      this.clienteService.registrarMovimiento(this.cliente.idCliente, movimientoParaGuardar).subscribe({
        next: (nuevoMovimiento) => {
          this.movimientos.unshift({
            idMovimiento: nuevoMovimiento.idMovimiento,
            tipo: tipo,
            monto: formValues.monto,
            fecha: new Date().toISOString(),
            comentario: formValues.concepto,
            comprobante: comprobanteAutogenerado, // 👈 Lo agregamos al historial local de inmediato
            registradoPor: nuevoMovimiento.registradoPor || nombreRealCajero
          });

          this.calcularSaldo();

          Swal.fire({
            title: '¡Registrado!',
            text: `El movimiento se guardó como ${comprobanteAutogenerado} con éxito.`,
            icon: 'success',
            timer: 2000,
            showConfirmButton: false,
            customClass: {
              popup: 'rounded-2xl border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100',
              title: 'text-slate-800 dark:text-white font-bold'
            }
          });
        },
        error: (err) => {
          console.error(err);
          Swal.fire({
            title: 'Error',
            text: 'No se pudo guardar el movimiento en el servidor.',
            icon: 'error',
            customClass: {
              popup: 'rounded-2xl border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100',
              title: 'text-slate-800 dark:text-white font-bold'
            }
          });
        }
      });
    }
  }
}
