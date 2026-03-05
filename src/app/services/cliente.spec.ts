import { TestBed } from '@angular/core/testing';
// 1. Cambia el import para traer el Servicio, no solo la interfaz
import { ClienteService } from './cliente';
import { HttpClientTestingModule } from '@angular/common/http/testing';

describe('ClienteService', () => {
  // 2. Cambia el tipo de la variable
  let service: ClienteService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      // 3. Importante: Agrega el módulo de pruebas de HTTP ya que tu servicio lo usa
      imports: [HttpClientTestingModule],
      providers: [ClienteService]
    });
    // 4. Inyecta el Servicio
    service = TestBed.inject(ClienteService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
