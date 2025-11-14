import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router, ActivatedRoute, RouterLink } from '@angular/router';
import { HttpErrorResponse } from '@angular/common/http';

// --- ¡¡ESTA ES LA CORRECCIÓN!! ---
// Necesita subir 3 niveles (../.._.._/) para encontrar la carpeta 'services'
import { Marca } from '../../../services/marca';

@Component({
  selector: 'app-marca-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './marca-form.html',
  styleUrl: './marca-form.css',
})
export class MarcaForm implements OnInit { // <-- Tu nombre de clase 'MarcaForm' está bien

  public marcaForm: FormGroup;
  public esEdicion: boolean = false;
  public marcaId: number | null = null;
  public error: string | null = null;
  public cargando: boolean = true;

  constructor(
    private fb: FormBuilder,
    private marcaService: Marca, // <-- Ahora Angular sabe qué es 'Marca'
    private router: Router,
    private route: ActivatedRoute
  ) {
    this.marcaForm = this.fb.group({
      nombre: ['', Validators.required],
      descripcion: ['']
    });
  }

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.esEdicion = true;
      this.marcaId = +id;
      this.cargarMarca(this.marcaId);
    } else {
      this.cargando = false;
    }
  }

  /**
   * Carga los datos de la marca en el formulario si es modo edición
   */
  cargarMarca(id: number): void {
    this.marcaService.getMarcaPorId(id.toString()).subscribe({
      next: (data: any) => {
        this.marcaForm.patchValue({
          nombre: data.nombre,
          descripcion: data.descripcion
        });
        this.cargando = false;
      },
      error: (err: any) => {
        this.error = 'No se pudo cargar la marca para editar.';
        this.cargando = false;
      }
    });
  }

  /**
   * Se llama al presionar el botón de Guardar/Crear
   */
  onSubmit(): void {
    if (this.marcaForm.invalid) {
      this.error = 'El campo "Nombre" es obligatorio.';
      return;
    }
    this.error = null;
    this.cargando = true;
    const data = this.marcaForm.value;

    if (this.esEdicion && this.marcaId) {
      // --- LÓGICA DE ACTUALIZAR (PUT) ---
      this.marcaService.updateMarca(this.marcaId, data).subscribe({
        next: () => {
          this.router.navigate(['/admin/marcas']); // Vuelve a la lista
        },
        error: (err: HttpErrorResponse) => {
          this.error = err.error?.message || 'Error al actualizar la marca.';
          this.cargando = false;
        }
      });
    } else {
      // --- LÓGICA DE CREAR (POST) ---
      this.marcaService.createMarca(data).subscribe({
        next: () => {
          this.router.navigate(['/admin/marcas']); // Vuelve a la lista
        },
        error: (err: HttpErrorResponse) => {
          this.error = err.error?.message || 'Error al crear la marca.';
          this.cargando = false;
        }
      });
    }
  }
}
