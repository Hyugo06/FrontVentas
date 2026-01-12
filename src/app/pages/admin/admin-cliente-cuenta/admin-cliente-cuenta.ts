import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { Cliente, ClienteService } from '../../../services/cliente';
import { Venta } from '../../../services/venta';

@Component({
  selector: 'app-admin-cliente-cuenta',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './admin-cliente-cuenta.html',
})
export class AdminClienteCuentaComponent implements OnInit {

  public cliente: Cliente | null = null;
  public ventas: any[] = [];
  public cargando: boolean = true;
  public deudaTotal: number = 0; // Lo calcularemos

  constructor(
    private route: ActivatedRoute,
    private clienteService: ClienteService,
    private ventaService: Venta
  ) {}

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      // Aquí deberíamos tener un método para obtener cliente por ID.
      // Como no existe, vamos a obtener todos y filtrar.
      // Lo ideal sería: this.clienteService.getClienteById(id)
      this.clienteService.getClientes().subscribe(clientes => {
        this.cliente = clientes.find(c => c.idCliente === +id) || null;

        // Ahora obtenemos las ventas y las filtramos por este cliente
        // Lo ideal sería: this.ventaService.getVentas({ clienteId: id })
        this.ventaService.getVentas({}).subscribe(ventas => {
          this.ventas = ventas.filter(v => v.cliente?.idCliente === +id);
          this.calcularDeuda();
          this.cargando = false;
        });
      });
    }
  }

  calcularDeuda(): void {
    // Asumiremos que una venta es "deuda" si no está pagada.
    // Necesitamos un campo como `estadoPago` en el objeto de venta.
    // Por ahora, sumaremos el total de todas sus compras como ejemplo.
    this.deudaTotal = this.ventas
      .filter(v => v.estadoPago !== 'PAGADO' && v.estado !== 'ANULADO') // Asumiendo estos campos
      .reduce((acc, v) => acc + v.total, 0);
  }
}
