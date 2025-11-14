import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MarcaForm } from './marca-form';

describe('MarcaForm', () => {
  let component: MarcaForm;
  let fixture: ComponentFixture<MarcaForm>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MarcaForm]
    })
    .compileComponents();

    fixture = TestBed.createComponent(MarcaForm);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
