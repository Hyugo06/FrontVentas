import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import {Router, RouterLink} from '@angular/router';
import { forkJoin } from 'rxjs';

// --- Importa tus servicios y modelos ---
import { Cart, CartItem } from '../../services/cart'; // De tu servicio de carrito
import { Cliente } from '../../services/cliente'; // Asumo que crearás este servicio
import { Venta } from '../../services/venta'; // Asumo que crearás este servicio
import { Auth } from '../../services/auth';
// Importa el DTO de Venta (para el POST final)
import { DetalleVentaDTO, VentaRequestDTO } from '../../model/venta-request.dto'; // Asumo que crearás este archivo


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
  public usuarioLogueado: string | null = null;
  public cargando: boolean = false;
  public error: string | null = null;
  public isPurchaseSuccessful: boolean = false;
  public totalMonto: number = 0;

  constructor(
    private fb: FormBuilder,
    private cartService: Cart,
    private authService: Auth,
    private router: Router,
    private clienteService: Cliente,
    private ventaService: Venta // <-- ¡Asegúrate de que esté aquí!
  ) {
    // Definición del formulario de checkout
    this.checkoutForm = this.fb.group({
      tipoComprobante: ['boleta', Validators.required],
      cliente: this.fb.group({ // <-- Grupo anidado
        nombres: ['', Validators.required],
        apellidos: ['', Validators.required],
        celular: ['', [Validators.required, Validators.pattern('^[0-9]{9}$')]],
        dni: ['', [Validators.required, Validators.pattern('^[0-9]{8}$')]],
        email: ['', [Validators.email]] // Email es opcional pero validado
      })
    });
  }

  ngOnInit(): void {
    // 1. Obtener items del carrito
    this.cartService.items$.subscribe(items => {
      this.cartItems = items;
      this.totalMonto = this.calcularTotal();
      if (items.length === 0) {
        // 🛑 CORRECCIÓN: Si el carrito está vacío,
        // no lo envíes a '/', envíalo a '/productos'.
        this.router.navigate(['/productos']);
      }
    });

    // 2. Intentar cargar datos del usuario logueado (vendedor)
    this.usuarioLogueado = this.authService.getUsername();

    // 3. Lógica de /gracias (Esto está bien)
    if (this.router.url === '/gracias') {
      this.isPurchaseSuccessful = true;
    }
  }

  calcularTotal(): number {
    // Implementación simple del cálculo total
    return this.cartItems.reduce((sum, item) =>
      sum + (item.producto.precioVenta * item.cantidad), 0
    );
  }

  /**
   * Procesa la compra final
   */
  public procesarCompra(): void {
    // 1. Validar el formulario del cliente (DNI, nombre, etc.)
    if (this.checkoutForm.invalid || this.cartItems.length === 0) {
      this.error = 'Por favor, completa los datos y verifica que el carrito no esté vacío.';
      return;
    }

    this.cargando = true;
    this.error = null;

    // 2. Mapear el carrito a DetalleVentaDTO[]
    const detalles: DetalleVentaDTO[] = this.cartItems.map(item => ({
      idProducto: item.producto.idProducto,
      cantidad: item.cantidad
    }));

    // 3. Construir el objeto final VentaRequestDTO
    const ventaData: VentaRequestDTO = {
      // Ya no enviamos idUsuario (el backend lo sabe por el token)

      // Enviamos el objeto anidado del formulario
      clienteData: this.checkoutForm.get('cliente')?.value,

      tipoComprobante: this.checkoutForm.get('tipoComprobante')?.value,
      detalles: detalles
    };

    // 4. Llamada al servicio (POST /api/ventas)
    this.ventaService.procesarVenta(ventaData).subscribe({
      next: (response) => {
        this.cartService.clearCart();
        this.totalMonto = 0;

        // Esto muestra la sección @if (isPurchaseSuccessful) del HTML
        this.isPurchaseSuccessful = true;
        this.cargando = false;


      },
      error: (err) => {
        this.error = err.error || 'Error desconocido al procesar la venta.';
        this.cargando = false;
        console.error('Error al procesar la venta:', err);
      }
    });
  }
}

