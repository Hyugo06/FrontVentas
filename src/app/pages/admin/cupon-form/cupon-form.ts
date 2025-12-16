import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterModule, ActivatedRoute } from '@angular/router'; // Importar ActivatedRoute
import { CuponService } from '../../../services/cupon';
import { Cupon } from '../../../model/cupon';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-cupon-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule],
  templateUrl: './cupon-form.html', // <--- Asegurate que coincida con tu archivo
  styleUrls: ['./cupon-form.css']
})
export class CuponFormComponent implements OnInit {

  private fb = inject(FormBuilder);
  private cuponService = inject(CuponService);
  private router = inject(Router);
  private route = inject(ActivatedRoute); // Para leer la URL

  public esEdicion: boolean = false;
  public idCuponEditar: number | null = null;

  form = this.fb.group({
    codigo: ['', [Validators.required, Validators.minLength(3)]],
    tipoDescuento: ['PORCENTAJE', [Validators.required]],
    valor: [0, [Validators.required, Validators.min(1)]],
    fechaVencimiento: ['', [Validators.required]],
    usosDisponibles: [10, [Validators.required, Validators.min(1)]],
    activo: [true],
    horaInicio: [''],
    horaFin: [''],
    diasPermitidos: ['']
  });

  ngOnInit(): void {
    // Verificar si estamos editando (¿hay ID en la URL?)
    this.route.params.subscribe(params => {
      if (params['id']) {
        this.esEdicion = true;
        this.idCuponEditar = +params['id']; // El + convierte string a numero
        this.cargarDatosCupon(this.idCuponEditar);
      }
    });
  }

  cargarDatosCupon(id: number) {
    this.cuponService.obtenerPorId(id).subscribe({
      next: (cupon) => {
        // Rellenamos el formulario con los datos que vinieron del backend
        this.form.patchValue({
          codigo: cupon.codigo,
          tipoDescuento: cupon.tipoDescuento as any,
          valor: cupon.valor,
          fechaVencimiento: cupon.fechaVencimiento, // Asegúrate que venga como YYYY-MM-DD
          usosDisponibles: cupon.usosDisponibles,
          activo: cupon.activo,
          horaInicio: cupon.horaInicio ? String(cupon.horaInicio) : '',
          horaFin: cupon.horaFin ? String(cupon.horaFin) : '',
          diasPermitidos: cupon.diasPermitidos
        });
      },
      error: () => {
        Swal.fire('Error', 'No se pudo cargar la información del cupón', 'error');
        this.router.navigate(['/admin/cupones']);
      }
    });
  }

  guardar() {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const datos = this.form.value as unknown as Cupon;
    // Forzar mayúsculas siempre
    datos.codigo = datos.codigo.toUpperCase();

    if (this.esEdicion && this.idCuponEditar) {
      // MODO ACTUALIZAR
      this.cuponService.actualizar(this.idCuponEditar, datos).subscribe({
        next: () => {
          Swal.fire('¡Actualizado!', 'El cupón se actualizó correctamente.', 'success');
          this.router.navigate(['/admin/cupones']);
        },
        error: () => Swal.fire('Error', 'No se pudo actualizar.', 'error')
      });
    } else {
      // MODO CREAR
      this.cuponService.crearCupon(datos).subscribe({
        next: (cuponCreado) => {
          Swal.fire('¡Creado!', `Cupón "${cuponCreado.codigo}" listo.`, 'success');
          this.router.navigate(['/admin/cupones']);
        },
        error: () => Swal.fire('Error', 'No se pudo crear.', 'error')
      });
    }
  }
}
