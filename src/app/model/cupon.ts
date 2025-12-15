import { Time } from "@angular/common";

export interface Cupon {
  idCupom?: number;
  codigo: string;
  tipoDescuento: 'PORCENTAJE' | 'FIJO';
  valor: number;
  fechaVencimiento: string; // Lo enviaremos como YYYY-MM-DD
  usosDisponibles: number;
  activo: boolean;

  // Opcionales (Happy Hour y Días)
  horaInicio?: string; // Formato HH:mm:ss
  horaFin?: string;
  diasPermitidos?: string; // Ej: "MONDAY,FRIDAY"
}
