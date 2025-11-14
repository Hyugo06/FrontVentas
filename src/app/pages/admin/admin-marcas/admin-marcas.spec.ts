import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AdminMarcas } from './admin-marcas';

describe('AdminMarcas', () => {
  let component: AdminMarcas;
  let fixture: ComponentFixture<AdminMarcas>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AdminMarcas]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AdminMarcas);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
