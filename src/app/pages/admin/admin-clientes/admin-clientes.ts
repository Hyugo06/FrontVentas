import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Cliente, ClienteService } from '../../../services/cliente'; //

@Component({
  selector: 'app-admin-clientes',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './admin-clientes.html',
  styleUrl: './admin-clientes.css'
})
export class AdminClientesComponent implements OnInit {

  public clientes: Cliente[] = [];
  public cargando: boolean = true;

  constructor(private clienteService: ClienteService) {}

  ngOnInit(): void {
    this.clienteService.getClientes().subscribe({
      next: (data) => {
        this.clientes = data;
        this.cargando = false;
      },
      error: (err) => {
        console.error('Error al cargar clientes', err);
        this.cargando = false;
      }
    });
  }
}
