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

  constructor(
    private fb: FormBuilder,
    private clienteService: ClienteService,
    private router: Router,
    private route: ActivatedRoute
  ) {
    // 1. CAMBIO EN VALIDACIONES: Quitamos Validators.required del DNI
    this.clienteForm = this.fb.group({
      nombres: ['', [Validators.required, Validators.minLength(2)]],
      apellidos: ['', [Validators.required, Validators.minLength(2)]],

      // DNI: Solo validamos patrón si escriben algo (ya no es required)
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

  cargarCliente(id: number): void {
    this.clienteService.getClientePorId(id).subscribe({
      next: (data: any) => {
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

    // 2. CAMBIO EN ENVÍO: Limpieza de datos (Convertir "" a null)
    const rawData = this.clienteForm.value;

    const dataLimpia = {
      ...rawData,
      // Si es cadena vacía o espacios, enviamos null. Si no, enviamos el valor.
      dni: rawData.dni && rawData.dni.trim() !== '' ? rawData.dni.trim() : null,
      email: rawData.email && rawData.email.trim() !== '' ? rawData.email.trim() : null
    };

    // Usamos dataLimpia en lugar de rawData (this.clienteForm.value)
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
        let msg = 'Ocurrió un error al guardar.';
        if (err.error?.message?.includes('DNI')) {
          msg = 'Este DNI ya está registrado en el sistema.';
        }
        Swal.fire({
          title: 'Error',
          text: msg,
          icon: 'error',
          confirmButtonColor: '#ef4444'
        });
      }
    });
  }
}
