import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import {Router, RouterLink} from '@angular/router';
import { forkJoin } from 'rxjs';

// --- IMPORTACIONES CORREGIDAS ---
import { Cart, CartItem } from '../../services/cart';
import { Venta } from '../../services/venta';
import { Auth } from '../../services/auth';
// Importamos tanto la interfaz como el servicio (con alias si quieres, pero mejor explícito)
import { ClienteService } from '../../services/cliente';
import { DetalleVentaDTO, VentaRequestDTO, ClienteRequestDTO } from '../../model/venta-request.dto';


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
    // --- ¡CORRECCIÓN AQUÍ! ---
    private clienteService: ClienteService, // Inyecta el SERVICIO, no la interfaz
    private ventaService: Venta
  ) {
    // ... (Tu definición del formulario es correcta) ...
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
      this.totalMonto = this.calcularTotal();
      if (items.length === 0) {
        this.router.navigate(['/productos']);
      }
    });

    this.usuarioLogueado = this.authService.getUsername();

    if (this.router.url === '/gracias') {
      this.isPurchaseSuccessful = true;
    }
  }

  calcularTotal(): number {
    return this.cartItems.reduce((sum, item) =>
      sum + (item.producto.precioVenta * item.cantidad), 0
    );
  }

  public procesarCompra(): void {
    if (this.checkoutForm.invalid || this.cartItems.length === 0) {
      this.error = 'Por favor, completa los datos correctamente.';
      return;
    }
    this.cargando = true;
    this.error = null;

    const detalles: DetalleVentaDTO[] = this.cartItems.map(item => ({
      idProducto: item.producto.idProducto,
      cantidad: item.cantidad
    }));

    const ventaData: VentaRequestDTO = {
      clienteData: this.checkoutForm.get('cliente')?.value,
      tipoComprobante: this.checkoutForm.get('tipoComprobante')?.value,
      detalles: detalles
    };

    this.ventaService.procesarVenta(ventaData).subscribe({
      next: (response: any) => {
        this.cartService.clearCart();
        this.router.navigate(['/gracias']);
      },
      error: (err: any) => {
        this.error = 'Error al procesar la venta. ' + (err.error || err.message);
        console.error('Error de transacción:', err);
        this.cargando = false;
      }
    });
  }
}
