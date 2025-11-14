import { ComponentFixture, TestBed } from '@angular/core/testing';

// --- ¡CORRECCIÓN! ---
// Importamos la clase real 'ProductoDetalleComponent'
import { ProductoDetalleComponent } from './producto-detalle';

describe('ProductoDetalleComponent', () => { // <-- Corregido
  let component: ProductoDetalleComponent; // <-- Corregido
  let fixture: ComponentFixture<ProductoDetalleComponent>; // <-- Corregido

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ProductoDetalleComponent] // <-- Corregido
    })
      .compileComponents();

    fixture = TestBed.createComponent(ProductoDetalleComponent); // <-- Corregido
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
