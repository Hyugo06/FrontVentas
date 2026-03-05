import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms'; // Necesario para el buscador
import { Cliente, ClienteService } from '../../../services/cliente';
import { RouterLink } from '@angular/router';
import Swal from 'sweetalert2';

// Extendemos la interfaz para incluir campos de negocio (si tu backend aún no los trae)
interface ClienteView extends Cliente {
  deudaActual?: number;      // Cuánto debe
  ultimaCompra?: Date;       // Para saber si es frecuente
  esFrecuente?: boolean;     // Lógica visual
}

@Component({
  selector: 'app-admin-clientes',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule],
  templateUrl: './admin-clientes.html',
  styleUrl: './admin-clientes.css'
})
export class AdminClientesComponent implements OnInit {

  public clientes: ClienteView[] = [];
  public clientesFiltrados: ClienteView[] = [];
  public cargando: boolean = true;

  // Métricas
  public totalClientes: number = 0;
  public totalDeuda: number = 0;
  public clientesDeudores: number = 0;

  // Filtros
  public terminoBusqueda: string = '';
  public filtroDeuda: 'TODOS' | 'DEUDORES' | 'AL_DIA' = 'TODOS';

  constructor(private clienteService: ClienteService) {}

  ngOnInit(): void {
    this.cargarClientes();
  }

  cargarClientes(): void {
    this.cargando = true;
    this.clienteService.getClientes().subscribe({
      next: (data) => {
        // Mapeamos los datos (Aquí simulo deuda aleatoria si el backend no la trae aún)
        this.clientes = data.map((c: any) => ({
          ...c,
          deudaActual: c.deudaActual || 0,
          esFrecuente: true // Lógica simple por ahora
        }));

        this.calcularMetricas();
        this.filtrarClientes();
        this.cargando = false;
      },
      error: (err) => {
        console.error('Error al cargar clientes', err);
        this.cargando = false;
      }
    });
  }

  calcularMetricas(): void {
    this.totalClientes = this.clientes.length;
    // Sumar solo si deudaActual existe
    this.totalDeuda = this.clientes.reduce((acc, c) => acc + (c.deudaActual || 0), 0);
    this.clientesDeudores = this.clientes.filter(c => (c.deudaActual || 0) > 0).length;
  }

  filtrarClientes(): void {
    let lista = this.clientes;

    // 1. Filtro de Texto (Nombre, Apellidos, DNI o Celular)
    // Agregamos .trim() para ignorar espacios accidentales
    if (this.terminoBusqueda && this.terminoBusqueda.trim() !== '') {
      const term = this.terminoBusqueda.toLowerCase().trim();

      lista = lista.filter(c => {
        // "Blindamos" los campos: si son nulos, usamos un texto vacío ''
        const nombres = (c.nombres || '').toLowerCase();
        const apellidos = (c.apellidos || '').toLowerCase();
        const dni = (c.dni || ''); // Campo crítico que estaba fallando
        const celular = (c.celular || '');

        return nombres.includes(term) ||
          apellidos.includes(term) ||
          dni.includes(term) ||
          celular.includes(term);
      });
    }

    // 2. Filtro de Estado (Deuda)
    if (this.filtroDeuda === 'DEUDORES') {
      lista = lista.filter(c => (c.deudaActual || 0) > 0);
    } else if (this.filtroDeuda === 'AL_DIA') {
      lista = lista.filter(c => (c.deudaActual || 0) === 0);
    }

    this.clientesFiltrados = lista;
  }

  // --- ACCIONES ---

  registrarPago(cliente: ClienteView): void {
    // Aquí abrirías un Modal o SweetAlert para ingresar el monto a pagar
    alert(`Aquí abriríamos modal para cobrar a: ${cliente.nombres}. Deuda: S/ ${cliente.deudaActual}`);
  }

  eliminarCliente(cliente: ClienteView): void {
    Swal.fire({
      title: '¿Eliminar cliente?',
      text: `¿Estás seguro de borrar a ${cliente.nombres}? Esta acción no se puede deshacer.`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#ef4444', // Rojo para peligro
      cancelButtonColor: '#f3f4f6',
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar',
      reverseButtons: true,
      allowOutsideClick: true
    }).then((result) => {
      if (result.isConfirmed) {
        this.clienteService.deleteCliente(cliente.idCliente).subscribe({
          next: () => {
            // 1. Quitamos al cliente de la lista local
            this.clientes = this.clientes.filter(c => c.idCliente !== cliente.idCliente);

            // 2. Recalculamos filtros y métricas (total deuda, etc)
            this.filtrarClientes();
            this.calcularMetricas();

            Swal.fire({
              title: '¡Eliminado!',
              text: 'El cliente ha sido borrado correctamente.',
              icon: 'success',
              timer: 1500,
              showConfirmButton: false
            });
          },
          error: (err) => {
            console.error(err);
            Swal.fire('Error', 'No se pudo eliminar. Si el cliente tiene ventas registradas, no podrás borrarlo por seguridad.', 'error');
          }
        });
      }
    });
  }

  verHistorial(cliente: ClienteView): void {
    // Redirigir a una vista de detalle
    // this.router.navigate(['/admin/clientes/historial', cliente.idCliente]);
  }
}
