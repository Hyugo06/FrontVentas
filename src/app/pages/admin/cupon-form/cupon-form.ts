import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { CuponService } from '../../../services/cupon';
import { Cupon } from '../../../model/cupon';

@Component({
  selector: 'app-cupon-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule],
  templateUrl: './cupon-form.html',
  styleUrls: ['./cupon-form.css']
})
export class CuponFormComponent {

  private fb = inject(FormBuilder);
  private cuponService = inject(CuponService);
  private router = inject(Router);

  // Definimos el formulario con sus validaciones
  form = this.fb.group({
    codigo: ['', [Validators.required, Validators.minLength(3)]],
    tipoDescuento: ['PORCENTAJE', [Validators.required]],
    valor: [0, [Validators.required, Validators.min(1)]],
    fechaVencimiento: ['', [Validators.required]],
    usosDisponibles: [10, [Validators.required, Validators.min(1)]],
    activo: [true],

    // Opcionales
    horaInicio: [''],
    horaFin: [''],
    diasPermitidos: ['']
  });

  guardar() {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const datos = this.form.value as unknown as Cupon;

    this.cuponService.crearCupon(datos).subscribe({
      next: (cuponCreado) => {
        // 1. Éxito visual
        alert(`¡Cupón "${cuponCreado.codigo}" creado correctamente!`);

        // 2. Redirección
        this.form.reset({
          tipoDescuento: 'PORCENTAJE',
          valor: 0,
          usosDisponibles: 10,
          activo: true,
          // Los demás campos (código, fecha, etc.) se pondrán en null/vacío
        });
      },
      error: (error) => {
        console.error('Error:', error);
        alert('Hubo un error al guardar el cupón.');
      }
    });
  }
}
