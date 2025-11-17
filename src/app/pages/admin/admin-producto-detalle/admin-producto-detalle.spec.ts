import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AdminProductoDetalle } from './admin-producto-detalle';

describe('AdminProductoDetalle', () => {
  let component: AdminProductoDetalle;
  let fixture: ComponentFixture<AdminProductoDetalle>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AdminProductoDetalle]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AdminProductoDetalle);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
