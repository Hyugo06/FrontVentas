import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { Cart, CartItem } from '../../services/cart';
import { ClienteService } from '../../services/cliente';
import { Venta } from '../../services/venta';
import { Auth } from '../../services/auth';
import { DetalleVentaDTO } from '../../model/venta-request.dto';
import { CuponService } from '../../services/cupon';
import { Cupon } from '../../model/cupon';

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
  public totalMonto: number = 0; // Subtotal
  public cargando: boolean = false;
  public error: string | null = null;
  public esClienteAnonimo: boolean = false;

  // Modal de Éxito
  public showSuccessModal: boolean = false;
  public countdown: number = 5;
  public circleDashOffset: number = 0;
  private timerInterval: any;

  // Variables Cupón
  cuponAplicado: Cupon | null = null;
  montoDescuento: number = 0;
  mensajeCupon: string = '';
  cuponValido: boolean = false;
  cargandoCupon: boolean = false;

  constructor(
    private fb: FormBuilder,
    private cartService: Cart,
    private authService: Auth,
    private router: Router,
    private clienteService: ClienteService,
    private ventaService: Venta,
    private cuponService: CuponService
  ) {
    this.checkoutForm = this.fb.group({
      tipoComprobante: ['boleta', Validators.required],
      cliente: this.fb.group({
        nombres: ['', Validators.required],
        apellidos: ['', Validators.required],
        celular: ['', [Validators.required, Validators.pattern('^[0-9]{9}$')]],
        dni: ['', [Validators.pattern('^[0-9]{8}$')]],
        email: ['', [Validators.email]]
      })
    });
  }

  ngOnInit(): void {
    this.cartService.items$.subscribe(items => {
      this.cartItems = items;

      // Calculamos el total usando reduce (NO usamos cartService.total())
      this.totalMonto = this.cartItems.reduce((sum, item) =>
        sum + (item.producto.precioVenta * item.cantidad), 0
      );

      if (this.cuponAplicado) {
        this.calcularDescuento(this.totalMonto);
      }

      if (items.length === 0 && !this.showSuccessModal) {
        this.router.navigate(['/productos']);
      }
    });
  }

  // --- GETTERS & HELPERS ---
  get totalFinal(): number {
    return this.totalMonto - this.montoDescuento;
  }

  validarSoloNumeros(event: any): void {
    const input = event.target;
    input.value = input.value.replace(/[^0-9]/g, '');
    const controlName = input.getAttribute('formControlName');
    if (controlName) this.checkoutForm.get('cliente')?.get(controlName)?.setValue(input.value);
  }

  validarSoloLetras(event: any): void {
    const input = event.target;
    input.value = input.value.replace(/[^a-zA-ZáéíóúÁÉÍÓÚñÑ\s]/g, '');
    const controlName = input.getAttribute('formControlName');
    if (controlName) this.checkoutForm.get('cliente')?.get(controlName)?.setValue(input.value);
  }

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
    ['nombres', 'apellidos', 'dni', 'celular'].forEach(field =>
      clienteGroup?.get(field)?.updateValueAndValidity()
    );
  }

  // --- LÓGICA CUPONES ---
  aplicarCupon(codigo: string) {
    if (!codigo) return;
    const codigoMayus = codigo.toUpperCase();
    this.cargandoCupon = true;
    this.mensajeCupon = '';

    // AQUÍ ESTABA EL ERROR: Usamos this.totalMonto
    const totalCompra = this.totalMonto;

    this.cuponService.validarCupon(codigoMayus, totalCompra).subscribe({
      next: (cupon) => {
        this.cuponAplicado = cupon;
        this.cuponValido = true;
        this.mensajeCupon = `¡Descuento aplicado!`;
        this.calcularDescuento(totalCompra);
        this.cargandoCupon = false;
      },
      error: (err) => {
        this.cuponAplicado = null;
        this.cuponValido = false;
        this.montoDescuento = 0;
        this.cargandoCupon = false;
        this.mensajeCupon = err.error?.mensaje || 'El cupón no es válido';
      }
    });
  }

  calcularDescuento(total: number) {
    if (!this.cuponAplicado) return;

    if (this.cuponAplicado.tipoDescuento === 'FIJO') {
      this.montoDescuento = this.cuponAplicado.valor;
    } else {
      this.montoDescuento = (total * this.cuponAplicado.valor) / 100;
    }

    if (this.montoDescuento > total) this.montoDescuento = total;
  }

  // --- PROCESO DE VENTA ---
  public intentarProcesarCompra(): void {
    if (!this.esClienteAnonimo && this.checkoutForm.invalid) {
      this.checkoutForm.markAllAsTouched();
      this.error = 'Completa los datos correctamente.';
      return;
    }
    if (this.cartItems.length === 0) {
      this.error = 'El carrito está vacío.';
      return;
    }

    Swal.fire({
      title: '¿Confirmar Venta?',
      text: `Monto a Pagar: S/ ${this.totalFinal.toFixed(2)}`,
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: 'Sí, cobrar',
      confirmButtonColor: '#16a34a'
    }).then((result) => {
      if (result.isConfirmed) this.ejecutarVentaReal();
    });
  }

  private ejecutarVentaReal(): void {
    this.cargando = true;
    this.error = null;

    // 1. Preparamos los datos del cliente
    let clienteDataFinal;

    if (this.esClienteAnonimo) {
      // Caso A: Cliente Anónimo (Datos por defecto)
      clienteDataFinal = {
        nombres: 'Cliente',
        apellidos: 'General',
        dni: '00000000',
        celular: '999999999',
        email: null
      };
    } else {
      // Caso B: Cliente Real (Datos del formulario con limpieza)
      const rawCliente = this.checkoutForm.get('cliente')?.value;

      clienteDataFinal = {
        ...rawCliente,
        // Si el DNI está vacío o son solo espacios, enviamos null. Si no, enviamos el valor.
        dni: rawCliente.dni && rawCliente.dni.trim() !== '' ? rawCliente.dni : null,
        // Lo mismo para el Email
        email: rawCliente.email && rawCliente.email.trim() !== '' ? rawCliente.email : null
      };
    }

    console.log("Enviando cliente al backend:", clienteDataFinal);
    // 2. Preparamos los detalles de la venta
    const detalles: DetalleVentaDTO[] = this.cartItems.map(item => ({
      idProducto: item.producto.idProducto,
      idVariante: item.variante?.idVariante,
      cantidad: item.cantidad
    }));

    // 3. Armamos el objeto completo para el Backend
    const ventaData: any = {
      clienteData: clienteDataFinal,
      tipoComprobante: this.checkoutForm.get('tipoComprobante')?.value,
      detalles: detalles,
      idCupon: this.cuponAplicado ? this.cuponAplicado.idCupom : null
    };

    // 4. Enviamos al servicio
    this.ventaService.procesarVenta(ventaData).subscribe({
      next: () => {
        this.cartService.clearCart();
        this.cargando = false;
        this.showSuccessModal = true;
        this.lanzarConfeti();
        this.iniciarConteoRegresivo();
      },
      error: (err) => {
        this.error = 'Error: ' + (err.error?.message || err.message);
        this.cargando = false;
      }
    });
  }

  lanzarConfeti(): void {
    confetti({ particleCount: 150, spread: 70, origin: { y: 0.6 } });
  }

  iniciarConteoRegresivo(): void {
    this.countdown = 5;
    this.timerInterval = setInterval(() => {
      this.countdown--;
      this.circleDashOffset = 113 - ((this.countdown / 5) * 113);
      if (this.countdown <= 0) this.cerrarYRedirigir();
    }, 1000);
  }

  cerrarYRedirigir(): void {
    clearInterval(this.timerInterval);
    this.router.navigate(['/productos']);
  }
}
