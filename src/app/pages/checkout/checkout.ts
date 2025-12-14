import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { Cart, CartItem } from '../../services/cart';
import { ClienteService } from '../../services/cliente';
import { Venta } from '../../services/venta';
import { Auth } from '../../services/auth';
import { DetalleVentaDTO, VentaRequestDTO } from '../../model/venta-request.dto';

import confetti from 'canvas-confetti';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-checkout',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './checkout.html',
  styleUrl: './checkout.css'
})
export class CheckoutComponent implements OnInit {

  public checkoutForm: FormGroup;
  public cartItems: CartItem[] = [];
  public totalMonto: number = 0;
  public cargando: boolean = false;
  public error: string | null = null;
  public esClienteAnonimo: boolean = false;

  // Variables para el Modal de Éxito
  public showSuccessModal: boolean = false;
  public countdown: number = 5;
  public circleDashOffset: number = 0;
  private timerInterval: any;

  constructor(
    private fb: FormBuilder,
    private cartService: Cart,
    private authService: Auth,
    private router: Router,
    private clienteService: ClienteService,
    private ventaService: Venta
  ) {
    this.checkoutForm = this.fb.group({
      tipoComprobante: ['boleta', Validators.required],
      cliente: this.fb.group({
        nombres: ['', Validators.required],
        apellidos: ['', Validators.required],
        celular: ['', [Validators.required, Validators.pattern('^[0-9]{9}$')]],
        dni: ['', [Validators.required, Validators.pattern('^[0-9]{8}$')]],
        email: ['', [Validators.email]]
      })
    });
  }

  ngOnInit(): void {
    this.cartService.items$.subscribe(items => {
      this.cartItems = items;
      this.totalMonto = this.cartItems.reduce((sum, item) =>
        sum + (item.producto.precioVenta * item.cantidad), 0
      );

      if (items.length === 0 && !this.showSuccessModal) {
        this.router.navigate(['/productos']);
      }
    });
  }

  // --- NUEVAS FUNCIONES DE VALIDACIÓN EN VIVO ---

  validarSoloNumeros(event: any): void {
    const input = event.target;
    // Reemplaza todo lo que NO sea número (0-9) por vacío
    input.value = input.value.replace(/[^0-9]/g, '');

    // Actualizamos el valor en el formulario de Angular
    const controlName = input.getAttribute('formControlName');
    if (controlName) {
      this.checkoutForm.get('cliente')?.get(controlName)?.setValue(input.value);
    }
  }

  validarSoloLetras(event: any): void {
    const input = event.target;
    // Reemplaza todo lo que NO sea letra o espacio (incluye tildes y ñ)
    input.value = input.value.replace(/[^a-zA-ZáéíóúÁÉÍÓÚñÑ\s]/g, '');

    const controlName = input.getAttribute('formControlName');
    if (controlName) {
      this.checkoutForm.get('cliente')?.get(controlName)?.setValue(input.value);
    }
  }
  // ---------------------------------------------

  toggleClienteAnonimo(): void {
    this.esClienteAnonimo = !this.esClienteAnonimo;
    const clienteGroup = this.checkoutForm.get('cliente');

    if (this.esClienteAnonimo) {
      clienteGroup?.get('nombres')?.clearValidators();
      clienteGroup?.get('apellidos')?.clearValidators();
      clienteGroup?.get('dni')?.clearValidators();
      clienteGroup?.get('celular')?.clearValidators();
    } else {
      clienteGroup?.get('nombres')?.setValidators(Validators.required);
      clienteGroup?.get('apellidos')?.setValidators(Validators.required);
      clienteGroup?.get('dni')?.setValidators([Validators.required, Validators.pattern('^[0-9]{8}$')]);
      clienteGroup?.get('celular')?.setValidators([Validators.required, Validators.pattern('^[0-9]{9}$')]);
    }

    clienteGroup?.get('nombres')?.updateValueAndValidity();
    clienteGroup?.get('apellidos')?.updateValueAndValidity();
    clienteGroup?.get('dni')?.updateValueAndValidity();
    clienteGroup?.get('celular')?.updateValueAndValidity();
  }

  public intentarProcesarCompra(): void {
    if (!this.esClienteAnonimo && this.checkoutForm.invalid) {
      this.checkoutForm.markAllAsTouched();
      this.error = 'Por favor, completa los datos del cliente correctamente.';
      return;
    }

    if (this.cartItems.length === 0) {
      this.error = 'El carrito está vacío.';
      return;
    }

    Swal.fire({
      title: '¿Confirmar Venta?',
      text: `Monto Total: S/ ${this.totalMonto.toFixed(2)}`,
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: '#16a34a',
      cancelButtonColor: '#d33',
      confirmButtonText: 'Sí, cobrar',
      cancelButtonText: 'Cancelar',
      heightAuto: false
    }).then((result) => {
      if (result.isConfirmed) {
        this.ejecutarVentaReal();
      }
    });
  }

  private ejecutarVentaReal(): void {
    this.cargando = true;
    this.error = null;

    let clienteDataFinal;

    if (this.esClienteAnonimo) {
      clienteDataFinal = {
        nombres: 'Cliente',
        apellidos: 'General',
        dni: '00000000',
        celular: '999999999',
        email: null
      };
    } else {
      clienteDataFinal = this.checkoutForm.get('cliente')?.value;
    }

    const detalles: DetalleVentaDTO[] = this.cartItems.map(item => ({
      idProducto: item.producto.idProducto,
      idVariante: item.variante?.idVariante,
      cantidad: item.cantidad
    }));

    const ventaData: VentaRequestDTO = {
      clienteData: clienteDataFinal,
      tipoComprobante: this.checkoutForm.get('tipoComprobante')?.value,
      detalles: detalles
    };

    this.ventaService.procesarVenta(ventaData).subscribe({
      next: (response: any) => {
        this.cartService.clearCart();
        this.cargando = false;
        this.showSuccessModal = true;
        this.lanzarConfeti();
        this.iniciarConteoRegresivo();
      },
      error: (err: any) => {
        this.error = 'Error al procesar la venta. ' + (err.error?.message || err.message);
        this.cargando = false;
        Swal.fire('Error', this.error || 'Algo salió mal', 'error');
      }
    });
  }

  lanzarConfeti(): void {
    confetti({
      particleCount: 150,
      spread: 70,
      origin: { y: 0.6 },
      colors: ['#26ccff', '#a25afd', '#ff5e7e', '#88ff5a', '#fcff42', '#ffa62d', '#ff36ff']
    });
  }

  iniciarConteoRegresivo(): void {
    const totalTime = 5;
    this.countdown = totalTime;
    const circumference = 113;

    this.timerInterval = setInterval(() => {
      this.countdown--;
      const progress = this.countdown / totalTime;
      this.circleDashOffset = circumference - (progress * circumference);

      if (this.countdown <= 0) {
        this.cerrarYRedirigir();
      }
    }, 1000);
  }

  cerrarYRedirigir(): void {
    clearInterval(this.timerInterval);
    this.router.navigate(['/productos']);
  }
}
