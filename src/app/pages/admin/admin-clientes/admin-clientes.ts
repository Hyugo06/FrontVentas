import { Component, OnInit, HostListener, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms'; // Necesario para el buscador
import { Cliente, ClienteService } from '../../../services/cliente';
import { RouterLink } from '@angular/router';
import Swal from 'sweetalert2';
import {Auth} from '../../../services/auth';


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
  public filtroTipo: 'TODOS' | 'JURIDICO' | 'NATURAL' = 'TODOS';
  public filtroDeuda: 'TODOS' | 'DEUDORES' | 'AL_DIA' = 'TODOS';

  public menuTipoAbierto: boolean = false;
  public menuDeudaAbierto: boolean = false;

  constructor(
    private clienteService: ClienteService,
    private elementRef: ElementRef,
    private authService: Auth
  ) {}

  ngOnInit(): void {
    this.cargarClientes();
  }

  cargarClientes(): void {
    this.cargando = true;
    this.clienteService.getClientes().subscribe({
      next: (data) => {
        this.clientes = data.map((c: any) => ({
          ...c,
          nombres: c.nombres || 'Cliente',
          apellidos: c.apellidos || '',
          dni: c.dni || '',
          celular: c.celular || '',
          email: c.email || '',
          deudaActual: c.deudaActual || 0,
          esFrecuente: c.esFrecuente || false
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

    // 1. Buscador texto
    if (this.terminoBusqueda?.trim()) {
      const term = this.terminoBusqueda.toLowerCase().trim();
      lista = lista.filter(c =>
        (c.nombres || '').toLowerCase().includes(term) ||
        (c.apellidos || '').toLowerCase().includes(term) ||
        (c.dni || '').includes(term)
      );
    }

    // 2. Filtro por Tipo de Cliente (Material Select 1)
    if (this.filtroTipo === 'JURIDICO') {
      lista = lista.filter(c => (c.dni || '').length === 11);
    } else if (this.filtroTipo === 'NATURAL') {
      lista = lista.filter(c => (c.dni || '').length !== 11);
    }

    // 3. Filtro por Deuda (Material Select 2)
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
    // 🌟 NUEVA VALIDACIÓN DE SEGURIDAD INTERNA
    const rolUsuario = this.authService.getRole(); // Captura el rol activo ('ADMIN', 'VENDEDOR', etc.)

    if (rolUsuario !== 'ADMIN') {
      Swal.fire({
        title: 'Acceso Denegado',
        text: 'Por políticas de auditoría, solo los usuarios Administradores pueden purgar cuentas del sistema.',
        icon: 'error',
        confirmButtonColor: '#4f46e5'
      });
      return;
    }
    Swal.fire({
      title: '¿Purgar historial y cuenta?',
      text: `¿Estás seguro de eliminar a ${cliente.nombres}? Se borrará de forma permanente todo su historial de abonos y fiados acumulados.`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#ef4444',
      cancelButtonColor: '#f3f4f6',
      confirmButtonText: 'Sí, borrar todo',
      cancelButtonText: 'Cancelar',
      reverseButtons: true,
      allowOutsideClick: true
    }).then((result) => {
      if (result.isConfirmed) {
        this.clienteService.deleteCliente(cliente.idCliente).subscribe({
          next: () => {
            this.clientes = this.clientes.filter(c => c.idCliente !== cliente.idCliente);
            this.filtrarClientes();
            this.calcularMetricas();

            Swal.fire({
              title: '¡Cliente Purgado!',
              text: 'La cuenta y su historial se han limpiado correctamente.',
              icon: 'success',
              timer: 2000,
              showConfirmButton: false
            });
          },
          error: (err) => {
            console.error(err);
            // Captura nuestro mensaje controlado del backend
            const mensajeError = err.error || 'No se pudo eliminar al cliente.';
            Swal.fire('Operación Cancelada', mensajeError, 'error');
          }
        });
      }
    });
  }

  public seleccionarTipo(valor: 'TODOS' | 'JURIDICO' | 'NATURAL'): void {
    this.filtroTipo = valor;
    this.menuTipoAbierto = false;
    this.filtrarClientes();
  }

  public seleccionarDeuda(valor: 'TODOS' | 'DEUDORES' | 'AL_DIA'): void {
    this.filtroDeuda = valor;
    this.menuDeudaAbierto = false;
    this.filtrarClientes();
  }

  @HostListener('document:click', ['$event'])
  public clickAfueraPC(event: MouseEvent): void {
    this.evaluarCierreFiltros(event.target);
  }

  @HostListener('document:touchstart', ['$event'])
  public toqueAfueraMovil(event: TouchEvent): void {
    this.evaluarCierreFiltros(event.target);
  }

  private evaluarCierreFiltros(target: any): void {
    if (!target) return;

    const targetElement = target as HTMLElement;

    // Buscamos si el clic o toque proviene de alguno de nuestros dos menús desplegables
    const estaDentroDeFiltros = targetElement.closest('.zona-filtro');

    // Si el usuario tocó en cualquier otro lugar fuera de los selectores, replegamos todo
    if (!estaDentroDeFiltros) {
      this.menuTipoAbierto = false;
      this.menuDeudaAbierto = false;
    }
  }
}
