import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AdminVentaDetalle } from './admin-venta-detalle';

describe('AdminVentaDetalle', () => {
  let component: AdminVentaDetalle;
  let fixture: ComponentFixture<AdminVentaDetalle>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AdminVentaDetalle]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AdminVentaDetalle);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
