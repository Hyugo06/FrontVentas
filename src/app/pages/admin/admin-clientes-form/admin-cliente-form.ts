import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router, ActivatedRoute, RouterLink } from '@angular/router';
import { HttpErrorResponse } from '@angular/common/http';
import Swal from 'sweetalert2';
import { ClienteService } from '../../../services/cliente';

@Component({
  selector: 'app-admin-cliente-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './admin-cliente-form.html',
  styleUrl: './admin-cliente-form.css'
})
export class AdminClienteFormComponent implements OnInit {

  public clienteForm: FormGroup;
  public esEdicion: boolean = false;
  public clienteId: number | null = null;
  public cargando: boolean = true;

  // 👇 NUEVAS VARIABLES PARA EL DESPLEGABLE DE CLASIFICACIÓN
  public tipoCliente: 'NATURAL' | 'JURIDICO' = 'NATURAL';
  public menuTipoAbierto: boolean = false;

  constructor(
    private fb: FormBuilder,
    private clienteService: ClienteService,
    private router: Router,
    private route: ActivatedRoute
  ) {
    this.clienteForm = this.fb.group({
      nombres: ['', [Validators.required, Validators.minLength(2)]],
      apellidos: ['', [Validators.required, Validators.minLength(2)]],
      // Por defecto iniciamos con el patrón estricto de 8 números para DNI
      dni: ['', [Validators.pattern('^[0-9]{8}$')]],
      celular: ['', [Validators.pattern('^[0-9]{9}$')]],
      email: ['', [Validators.email]],
      direccion: ['']
    });
  }

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.esEdicion = true;
      this.clienteId = Number(id);
      this.cargarCliente(this.clienteId);
    } else {
      this.cargando = false;
    }
  }

  // 👇 MÉTODO ELEGANTE PARA INTERCAMBIAR LAS REGLAS DE VALIDACIÓN AL VUELO
  public seleccionarTipo(tipo: 'NATURAL' | 'JURIDICO'): void {
    this.tipoCliente = tipo;
    this.menuTipoAbierto = false;

    const dniControl = this.clienteForm.get('dni');
    const apellidosControl = this.clienteForm.get('apellidos');

    if (tipo === 'NATURAL') {
      // Reglas para Persona Natural (DNI 8 dígitos y Apellidos Obligatorios)
      dniControl?.setValidators([Validators.pattern('^[0-9]{8}$')]);
      apellidosControl?.setValidators([Validators.required, Validators.minLength(2)]);
    } else {
      // Reglas para Empresa Jurídica (RUC 11 dígitos y Apellidos Libres/Null)
      dniControl?.setValidators([Validators.pattern('^[0-9]{11}$')]);
      apellidosControl?.clearValidators();
      apellidosControl?.setValue(''); // Vaciamos residuos de texto
    }

    // Forzamos a Angular a refrescar y recalcular la validez del formulario al instante
    dniControl?.updateValueAndValidity();
    apellidosControl?.updateValueAndValidity();
  }

  cargarCliente(id: number): void {
    this.clienteService.getClientePorId(id).subscribe({
      next: (data: any) => {
        // DETECCIÓN AUTOMÁTICA EN EDICIÓN: Si el documento recuperado tiene 11 caracteres, conmutamos a Empresa
        if (data.dni && data.dni.length === 11) {
          this.seleccionarTipo('JURIDICO');
        }

        this.clienteForm.patchValue({
          nombres: data.nombres,
          apellidos: data.apellidos,
          dni: data.dni,
          celular: data.celular,
          email: data.email,
          direccion: data.direccion
        });
        this.cargando = false;
      },
      error: (err) => {
        console.error(err);
        Swal.fire('Error', 'No se pudo cargar la información del cliente.', 'error');
        this.router.navigate(['/admin/clientes']);
      }
    });
  }

  onSubmit(): void {
    if (this.clienteForm.invalid) {
      this.clienteForm.markAllAsTouched();
      return;
    }

    this.cargando = true;
    const rawData = this.clienteForm.value;

    // CONSTRUCCIÓN SEGURA: Si es jurídica, anulamos los apellidos antes de ir al backend
    const dataLimpia = {
      ...rawData,
      apellidos: this.tipoCliente === 'NATURAL' ? rawData.apellidos : null,
      dni: rawData.dni && rawData.dni.trim() !== '' ? rawData.dni.trim() : null,
      email: rawData.email && rawData.email.trim() !== '' ? rawData.email.trim() : null,
      celular: rawData.celular && rawData.celular.trim() !== '' ? rawData.celular.trim() : null
    };

    const request$ = this.esEdicion && this.clienteId
      ? this.clienteService.updateCliente(this.clienteId, dataLimpia)
      : this.clienteService.createCliente(dataLimpia);

    request$.subscribe({
      next: () => {
        this.cargando = false;
        Swal.fire({
          title: this.esEdicion ? '¡Actualizado!' : '¡Registrado!',
          text: `El cliente ${dataLimpia.nombres} ha sido guardado con éxito.`,
          icon: 'success',
          confirmButtonColor: '#4f46e5',
          confirmButtonText: 'Listo'
        }).then(() => {
          this.router.navigate(['/admin/clientes']);
        });
      },
      error: (err: HttpErrorResponse) => {
        this.cargando = false;
        console.error('ERROR DETALLADO DESDE EL BACKEND:', err);

        const codigoError = err.error?.codigo || 'SYS-500';
        const mensajeServidor = err.error?.mensaje || err.error?.message || 'Ocurrió un error inesperado al guardar.';

        Swal.fire({
          title: `Acción Denegada [${codigoError}]`,
          text: mensajeServidor,
          icon: 'warning',
          confirmButtonColor: '#f59e0b',
          confirmButtonText: 'Entendido'
        });
      }
    });
  }
}
