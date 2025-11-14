// DTO para los datos del formulario de cliente
export interface ClienteRequestDTO {
  nombres: string;
  apellidos: string;
  dni: string;
  celular: string;
  email?: string; // Opcional
}

// DTO para los detalles del carrito (este ya lo tenías)
export interface DetalleVentaDTO {
  idProducto: number;
  cantidad: number;
}

// DTO Principal de la Venta (Modificado)
export interface VentaRequestDTO {
  // ¡ELIMINADO! idUsuario e idCliente

  clienteData: ClienteRequestDTO; // <-- ¡AÑADIDO!
  tipoComprobante: string;
  detalles: DetalleVentaDTO[];
}
