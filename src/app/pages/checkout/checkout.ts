import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router'; // Importamos RouterLink
import { Cart, CartItem } from '../../services/cart';
import { ClienteService } from '../../services/cliente';
import { Venta } from '../../services/venta';
import { Auth } from '../../services/auth';
import { DetalleVentaDTO, VentaRequestDTO } from '../../model/venta-request.dto';

// --- IMPORTAR CONFETI ---
import confetti from 'canvas-confetti';

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

  // Variables para el Modal de Éxito
  public showSuccessModal: boolean = false;
  public countdown: number = 5; // Segundos para redireccionar
  public circleDashOffset: number = 0; // Para la animación del círculo SVG
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

      // Solo redirigir si no hay items y NO estamos mostrando el modal de éxito
      if (items.length === 0 && !this.showSuccessModal) {
        this.router.navigate(['/productos']);
      }
    });
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
        // 1. Limpiar carrito y estado de carga
        this.cartService.clearCart();
        this.cargando = false;

        // 2. Mostrar el modal y lanzar confeti
        this.showSuccessModal = true;
        this.lanzarConfeti();
        this.iniciarConteoRegresivo();
      },
      error: (err: any) => {
        this.error = 'Error al procesar la venta. ' + (err.error?.message || err.message);
        this.cargando = false;
      }
    });
  }

  // --- LÓGICA VISUAL ---

  lanzarConfeti(): void {
    // Lanza confeti desde el centro
    confetti({
      particleCount: 150,
      spread: 70,
      origin: { y: 0.6 },
      colors: ['#26ccff', '#a25afd', '#ff5e7e', '#88ff5a', '#fcff42', '#ffa62d', '#ff36ff']
    });
  }

  iniciarConteoRegresivo(): void {
    const totalTime = 5; // 5 segundos
    this.countdown = totalTime;

    // Lógica para el círculo SVG (Circunferencia aprox de radio 18 = 113)
    const circumference = 113;

    this.timerInterval = setInterval(() => {
      this.countdown--;

      // Calcular el offset para la animación del borde
      const progress = this.countdown / totalTime;
      this.circleDashOffset = circumference - (progress * circumference);

      if (this.countdown <= 0) {
        this.cerrarYRedirigir();
      }
    }, 5000);
  }

  cerrarYRedirigir(): void {
    clearInterval(this.timerInterval);
    this.router.navigate(['/productos']);
  }
}
