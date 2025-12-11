export interface Usuario {
  idUsuario?: number;
  nombres: string;
  apellidos: string;
  celular?: string;
  nombreUsuario: string;
  hashContrasena?: string; // Opcional (solo se envía al crear/editar)
  rol: string;
  activo?: boolean;

  // --- LISTA DE PODERES PARA EL MODERADOR ---
  permisos?: string[];
}
